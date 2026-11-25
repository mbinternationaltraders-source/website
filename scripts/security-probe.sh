#!/usr/bin/env bash
# Black-box security probes against a running build. Usage: scripts/security-probe.sh [base-url]
# Read-only except for intentionally invalid requests that the server must reject. Never sends real enquiries.
B=${1:-http://localhost:3100}
pass=0; fail=0
check() { if [ "$2" = "$3" ]; then echo "PASS  $1 ($2)"; pass=$((pass+1)); else echo "FAIL  $1 (got $2, want $3)"; fail=$((fail+1)); fi; }
code() { curl -s -o /dev/null -w "%{http_code}" --max-time 20 "$@"; }
hdr() { curl -s -D - -o /dev/null --max-time 20 "$1" | tr -d '\r' | grep -i "^$2:" | head -1; }

echo "== Security headers (home)"
for h in content-security-policy strict-transport-security x-frame-options x-content-type-options referrer-policy permissions-policy; do
  v=$(hdr "$B/" "$h"); [ -n "$v" ] && { echo "PASS  $h present"; pass=$((pass+1)); } || { echo "WARN  $h missing"; }
done
csp=$(hdr "$B/" content-security-policy)
echo "$csp" | grep -q "frame-ancestors 'none'" && check "CSP blocks framing (clickjacking)" yes yes || check "CSP blocks framing" no yes
echo "$csp" | grep -q "object-src 'none'" && check "CSP blocks plugins" yes yes || check "CSP blocks plugins" no yes
[ -z "$(hdr "$B/" x-powered-by)" ] && check "X-Powered-By hidden" yes yes || check "X-Powered-By hidden" no yes

echo "== Owner area requires sign-in"
for p in /admin /admin/leads /admin/customers /admin/reports /admin/team /admin/products /admin/export "/admin/export?ids=00000000-0000-4000-8000-000000000001"; do
  c=$(code "$B$p"); [ "$c" = 200 ] && body=$(curl -s --max-time 20 "$B$p") || body=""
  if [ "$c" = 200 ] && echo "$body" | grep -q -i "reference,\|ad-table\|Needs a reply"; then check "$p hides owner data" leaked hidden; else check "$p hides owner data" hidden hidden; fi
done
loc=$(hdr "$B/admin/auth/callback?next=https://evil.example&code=x" location)
echo "$loc" | grep -qi "evil.example" && check "sign-in link cannot redirect off-site" open closed || check "sign-in link cannot redirect off-site" closed closed
echo "$(hdr "$B/admin/login" x-robots-tag)$(curl -s "$B/admin/login" | grep -o 'noindex' | head -1)" | grep -qi noindex && check "admin pages are noindex" yes yes || check "admin pages are noindex" no yes

echo "== Scheduled jobs reject callers without the secret"
check "email job, no auth" "$(code "$B/api/jobs/email")" 401
check "email job, wrong secret" "$(code -H 'Authorization: Bearer wrong-wrong-wrong-wrong-wrong-wrong' "$B/api/jobs/email")" 401
check "retention job, no auth" "$(code "$B/api/jobs/retention")" 401

echo "== Enquiry endpoint input validation"
E="$B/api/enquiries"
check "GET not allowed" "$(code "$E")" 405
check "foreign Origin rejected" "$(code -X POST -H 'Origin: https://evil.example' -H 'Content-Type: application/json' -d '{}' "$E")" 403
check "non-JSON rejected" "$(code -X POST -H "Origin: $B" -H 'Content-Type: text/plain' -d 'x' "$E")" 415
big=$(head -c 70000 /dev/zero | tr '\0' 'a')
check "oversized body rejected" "$(code -X POST -H "Origin: $B" -H 'Content-Type: application/json' --data "{\"x\":\"$big\"}" "$E")" 413
check "malformed JSON rejected" "$(code -X POST -H "Origin: $B" -H 'Content-Type: application/json' -d '{bad' "$E")" 400
check "schema-invalid payload rejected" "$(code -X POST -H "Origin: $B" -H 'Content-Type: application/json' -d '{"kind":"quote","items":[{"sku":"<script>","quantity":-1}]}' "$E")" 400

echo "== Secrets never reach the browser"
# Env var names, or values shaped like real keys (the Supabase library itself mentions the "sb_secret_" prefix).
leak=$(grep -rlE "SUPABASE_SECRET_KEY|RESEND_API_KEY|TURNSTILE_SECRET_KEY|CRON_SECRET|RATE_LIMIT_SALT|sb_secret_[A-Za-z0-9_-]{16,}|re_[A-Za-z0-9]{20,}|eyJhbGciOi[A-Za-z0-9_-]{20,}" .next/static 2>/dev/null | head -3)
[ -z "$leak" ] && check "no secret names or keys in client bundles" none none || check "no secrets in client bundles" "$leak" none

echo "== Error and edge responses"
check "unknown page is a real 404" "$(code "$B/no-such-page-$RANDOM")" 404
# Dynamic routes stream a prerendered shell (Cache Components), so an unknown slug may answer 200;
# what must hold is "404 or noindex, and nothing from outside the catalog".
gone() { c=$(code "${@:2}"); b=$(curl -s "${@:2}"); if [ "$c" = 404 ] || echo "$b" | grep -q 'content="noindex'; then check "$1" ok ok; else check "$1" "$c, indexable" "404 or noindex"; fi; }
gone "path traversal attempt" "$B/products/..%2f..%2fetc%2fpasswd-$RANDOM"
curl -s "$B/products/..%2f..%2fetc%2fpasswd" | grep -q "root:" && check "traversal leaks no files" leaked clean || check "traversal leaks no files" clean clean
gone "unknown product not indexable" "$B/products/no-such-part-$RANDOM"
gone "unknown product not indexable (Googlebot)" -A 'Mozilla/5.0 (compatible; Googlebot/2.1)' "$B/products/no-such-part-$RANDOM"
gone "unknown industry not indexable" "$B/industries/no-such-industry-$RANDOM"
curl -s "$B/no-such-page" | grep -qiE "at .*\.(ts|js):[0-9]+|stack" && check "404 leaks no stack trace" leaked clean || check "404 leaks no stack trace" clean clean

echo; echo "passed $pass, failed $fail"
[ "$fail" = 0 ]
