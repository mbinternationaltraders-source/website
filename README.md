# MB International Traders / C3M

Next.js catalog and quotation website. The local preview runs without external accounts using the supplied seed catalog. **This is a review build, not a launched ordering service.**

## Run and check

Use Node.js 22 or newer (validated with Node 24.19).

```sh
npm ci
npm run dev
npm run typecheck
npm test
npm run build
# For environments that restrict Turbopack's local worker sockets:
npm run build -- --webpack
```

Open `http://localhost:3000`. The public site includes home, searchable/filterable catalog, 10 product pages, 5 industry pages, company, contact, quote basket, confirmation, four policy pages and a custom 404. The owner area is `/admin`.

The home adapts the supplied Baseline layout and motion to MB/C3M: rounded navy framing, native system typography, a photographic product stage, an editorial component carousel, industry rows, sourcing steps and a large closing wordmark. The facts band uses catalog counts, not invented customer or performance claims. Quote actions remain available independently of motion or 3D. No prices, checkout or payment collection are implied.

The desktop pump study follows a five-stage natural-scroll sequence: assembled, housing, components, winding and reassembly. A 450vh track is enabled only on larger screens with motion enabled. Mobile and reduced-motion users get a compact layout and explicit stage controls. The catalog shortcut bypasses the sequence; no scroll hijacking is used. Section reveals and the manual carousel take their visual rhythm from Baseline, while all business content and enquiry behaviour remain MB/C3M.

`/api/quote/submit` and `/quote/thank-you` are available alongside the earlier enquiry and confirmation URLs. RFQs require a company, delivery city and phone even when email is the preferred reply channel. General contact enquiries still allow email-only replies. `/admin/dashboard` and `/admin/leads` expose the existing protected owner lead area.

## Clients and testimonials

`lib/proof.ts` holds the client list and testimonials. The ten clients were confirmed by the owner; their logos come from each company's own website, re-encoded to WebP in `public/images/clients/`. Keep order records on file and ask each client's permission for logo use before launch.

Testimonials marked `sample: true` are design placeholders. They carry a visible "Sample" tag, are attributed to no real company, and are removed automatically when `NEXT_PUBLIC_LAUNCH_READY=true` (`tests/proof.test.ts` checks this). Replace them with real quotes, with each customer's permission, before launch. If no real testimonials exist at launch, `/testimonials`, its nav link and its sitemap entry disappear.

`lib/region-map.ts` rasterises a regional dot map from coarse outlines (decorative, not survey-accurate). `components/pakistan-map.tsx` animates every dot on a canvas as one ripple out from Gujranwala (Pakistan bold, neighbours light), prints the country name along it, then pops the testimonial pins. The reveal replays each time the page is opened.

## Loading

Product and industry links prefetch their content, so navigation is normally instant (30–40 ms in production). When a page does take longer, `components/page-loader.tsx` appears after 400 ms (sub-second waits show nothing): an MB bearing assembles and rolls, the destination is named, and short facts rotate. Reduced-motion users see it assembled and still.

## Photography and animation

### Home hero video

The hero plays `public/videos/hero-motor-{1440,1080,720}.mp4` (chosen by screen width) full-bleed. While the clip is dark behind the headline (the `DARK` window in `components/home-hero.tsx`, measured from the frames) the text switches to white; re-measure it if the clip changes. The still poster is `public/images/hero/motor-poster.webp`. The videos come from the owner-supplied 720p clip, upscaled 4× with Apple's on-device super-resolution model and encoded with a short fade at each end so the loop dissolves cleanly. To replace the clip:

```sh
swiftc -O scripts/upscale-video/main.swift -o /tmp/upscale
/tmp/upscale new-clip.mp4 /tmp/master.mov 2560 1440
FX="fade=t=in:st=0:d=0.45:color=0xb9bec4,fade=t=out:st=9.5:d=0.5:color=0xb9bec4,format=yuv420p"
ffmpeg -i /tmp/master.mov -an -vf "$FX" -c:v libx264 -crf 21 -preset slower -movflags +faststart public/videos/hero-motor-1440.mp4
ffmpeg -i /tmp/master.mov -an -vf "scale=1920:1080:flags=lanczos,$FX" -c:v libx264 -crf 20 -preset slower -movflags +faststart public/videos/hero-motor-1080.mp4
ffmpeg -i /tmp/master.mov -an -vf "scale=1280:720:flags=lanczos,$FX" -c:v libx264 -crf 22 -preset slower -movflags +faststart public/videos/hero-motor-720.mp4
```

Adjust the fade times to the new clip's length. The current clip's exploded-view labels need correcting before launch: "Copper Coil" points at the bearing, "Rotor" at the copper stator winding and "Magnet" at the top cover.

`lib/catalog/media.ts` maps each product to a local reference photo. Source pages, original image URLs and rights status are recorded in `docs/reference-images.json` and shown at `/image-credits`. Images are compressed WebP in 320, 640 and 960 pixel derivatives. Cards lazy-load; the leading product photograph has high priority. The entire 33-file derivative set is approximately 475 KiB in encoded file data. No third-party image server is contacted by visitors.

**The reference photos are not confirmed MB stock photos, and reuse permission is not established. Replace them with owner-approved original or licensed supplier photography before publishing.** Markings and ratings visible in a reference photo are not copied into product specifications. The pump image, for example, is a generic cooler-pump reference, not an exact LH1020 claim. Trademarks have not been removed or relabelled.

Current parts views are explanatory SVG and optional Three.js illustrations. They are not photoreal CAD models and do not match every detail of the photographs. Sealed assemblies use section views; single-piece products use feature highlights. Catalog hover uses a 300ms intent delay; the explicit component button opens a native modal with a named parts list, Escape dismissal and focus restoration. Three.js loads when the desktop hero sequence is explored, a card hover is sustained, or View in 3D is selected. Viewers share one active renderer lease and render on demand; leaving the hero or card releases its renderer.

The floating contact control uses an SVG bearing with a brief hover/focus rotation and immediate WhatsApp navigation. On product pages it prepares a message with the current product, SKU and confirmed specifications. The message remains a draft for the buyer to send. Motion preferences also disable the bearing animation.

To deliver the final realistic breakdown, obtain the exact supplied product and a matching CAD/GLB model or measured component photography. Keep named meshes aligned with component keys in the catalog, verify the assembly and seal boundaries, and optimise textures/mesh size before replacing the illustration. This is an asset-production task still to complete. R2 upload controls are also not implemented; the current media is local.

## Connect the services

1. Copy `.env.example` to `.env.local`. Enter credentials locally or through the hosting provider's secret manager. Never put the Supabase secret, Turnstile secret, Resend key, rate-limit salt or cron secret in a `NEXT_PUBLIC_` variable. Do not paste secrets into chat or commit them.
2. Create the Supabase project; apply `supabase/migrations/0001_init.sql`, `0002_ingestion_guards.sql`, then `0003_token_bucket.sql` in order. Run `npm run seed` to load the initial catalog. Seeding updates matching slugs/SKUs; do not use it to overwrite later owner edits inadvertently.
3. Create the owner's Auth account through the Supabase dashboard, disable public signups, and insert its user UUID into `public.owners`. Sign in at `/admin/login` and enrol/verify an authenticator. Lead access and writes require both the allowlist and an AAL2 session. Keep a documented account recovery procedure.
4. Set real Turnstile site/secret keys with the correct production hostname. Published Cloudflare test keys are only accepted in development. Set a randomly generated `RATE_LIMIT_SALT` and a 32+ character `CRON_SECRET`.
5. Verify an email domain with Resend, set `EMAIL_FROM`, `EMAIL_REPLY_TO`, `OWNER_EMAIL` and `RESEND_API_KEY`. A Gmail address cannot substitute for a verified sending domain. Provision the scheduled routes in `vercel.json`; the proposed ten-minute email schedule requires a host/plan that supports it.
6. Set the real HTTPS `NEXT_PUBLIC_SITE_URL`. Configure HTTPS enforcement, WAF/DDoS rules and platform spending limits before launch. This implementation trusts Vercel's provider-written client-IP header. Other hosts must implement an equivalent trusted edge adapter; production forms fail closed without it.
7. Optional GA4 loads only after analytics consent. Google Maps loads after map consent or Load map. Verify the business address and map pin. Review company details, specifications, commercial terms and proposed retention periods. Retention deletion stays disabled unless `RETENTION_ENABLED=true`.
8. Replace reference assets, complete live integration testing, then set `NEXT_PUBLIC_LAUNCH_READY=true` and rebuild to allow search indexing. Titles, canonical links, structured data, sitemap, robots, favicon and a social preview are included.

## Security and operational behaviour

The submission endpoint validates origins, fields, body size, Turnstile and rate limits. A transactional database function validates published SKUs, quantities and units, stores an immutable quote snapshot, and queues email in one transaction. Identical retries reuse the saved reference; reusing a key with changed content is rejected. The UI only confirms success after receiving a saved reference. Without services it shows an unavailable message, preserves the basket and provides phone/WhatsApp alternatives.

Migration 0003 replaces the fixed window with locked, replenishing token buckets. The IP bucket allows a burst of five requests and refills at five tokens per ten minutes; additional contact and global buckets still apply. Existing counters start drained after migration. This change has been tested locally, but has not been applied to a hosted Supabase project.

Only published catalog data is public. Private records are protected by RLS and owner MFA; server actions recheck access. CSV exports escape spreadsheet formulas. Email jobs use leases, provider idempotency keys, at most five attempts and a configurable daily send-attempt cap. These application limits do not cap hosting/CDN bills or replace provider spending controls. There is no recurring function self-invocation or AI API workload.

Production headers include HSTS, anti-framing, content-type protection and CSP. CSP permits Next.js inline bootstrap scripts; it is not a strict nonce-based CSP. A stricter nonce approach would change the static rendering/cache tradeoff. Hosting access protection, backups, restore testing and provider budget enforcement must still be configured in those services.

Provider budgets are not universal hard caps. [Vercel Spend Management](https://vercel.com/docs/spend-management) needs the pause-production action enabled to stop deployments at the selected threshold; periodic checks can overshoot and some charges are excluded. [Supabase cost control](https://supabase.com/docs/guides/platform/cost-control) excludes compute and several add-ons from its spend cap. Configure and verify the controls for the chosen plan instead of assuming a static site or an alert guarantees a fixed maximum bill.

## Validation and remaining checks

Nineteen automated tests cover contact and RFQ requirements, quantities, finite geometry, bounded assembly timing, CSV injection, origin/body checks, unconfigured-service failures, cron authentication, Turnstile checks, public/private RLS, owner MFA, atomic and idempotent quote storage, immutable snapshots, token replenishment and email leases/retry exhaustion. Database tests use PostgreSQL through PGlite with Supabase auth claims stubbed; they do not replace a live Supabase integration test.

The October 10 refresh passes lint, TypeScript, all 19 tests and a production build with `npm run build -- --webpack` (49 generated paths). The default Turbopack build encountered an environment-level worker socket permission error; its production build is not claimed as verified. The Webpack fallback uses the installed Tailwind loader through Next's existing CSS pipeline and was checked in the browser.

All 33 prerendered public page/metadata URLs returned HTTP 200 from the local production server. The results are recorded in `docs/refresh-routes.json`; this is a route availability check, not a substitute for visual or live-service tests.

Refresh browser checks cover 1280px desktop, 390px and 320px mobile widths; no horizontal overflow was observed. Checks include the five-stage pump study, one active canvas, the product viewer, modal Escape/focus return, carousel selection, add-to-quote, required-field errors, product-specific WhatsApp drafts, mobile navigation and the motion preference. Footer controls were moved clear of the contact widget and given larger tap targets. Earlier browser checks also covered catalog search and basket quantity persistence. No live email, Supabase login, hosted DDoS/billing protection or actual order acceptance has been tested because those accounts are not connected. Full assistive-technology testing, the 150KiB initial-bundle target and deployed Core Web Vitals remain launch checks, not claimed certifications.

The earlier dependency audit reported zero runtime vulnerabilities and nine high-severity findings in development tooling (the glob dependency chain in ESLint/shadcn); it was not rerun for this design refresh, which adds no packages. Do not use `--force` without reviewing version compatibility.

## Design references

- [Vyro](https://vyro.com): large type, restrained navigation and a distinct primary action.
- The supplied Baseline tennis-site document: rounded framing, oversized ghost type, product-card carousel, staggered section reveals and footer scale, adapted with the user's approval to the MB/C3M business.
- [React Three Fiber performance guidance](https://r3f.docs.pmnd.rs/advanced/scaling-performance): on-demand rendering and resource reuse.
- The supplied `gemini_generated_video_6b7bd98d.mp4`: pump-led composition and assembly-study direction. The rendered tablet frame and unreliable generated part labels were not embedded as product evidence.
- [SKF products](https://www.skf.com/group/products): product identification and specification-led navigation.
- [Next.js Image reference](https://nextjs.org/docs/app/api-reference/components/image), [video performance](https://web.dev/learn/performance/video-performance), [Supabase RLS](https://supabase.com/docs/guides/database/postgres/row-level-security) and [MFA](https://supabase.com/docs/guides/auth/auth-mfa): implementation reference points.
