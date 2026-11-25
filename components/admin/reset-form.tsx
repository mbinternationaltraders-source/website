"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { browserClient } from "@/lib/supabase/browser";

const MIN = 12;

// Reached from a reset or invite email (via /admin/auth/callback). Invite links may instead carry the
// session in the URL fragment; it is read once and then removed from the address bar.
export function ResetPasswordForm({ configured }: { configured: boolean }) {
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [ready, setReady] = useState<boolean | null>(null);
  const router = useRouter();

  useEffect(() => {
    if (!configured) return;
    (async () => {
      const db = browserClient();
      const hash = new URLSearchParams(window.location.hash.slice(1));
      const access = hash.get("access_token"), refresh = hash.get("refresh_token");
      if (access && refresh) {
        await db.auth.setSession({ access_token: access, refresh_token: refresh });
        history.replaceState(null, "", window.location.pathname); // keep tokens out of history
      }
      const { data } = await db.auth.getUser();
      setReady(!!data.user);
    })();
  }, [configured]);

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (password.length < MIN) return setError(`Use at least ${MIN} characters.`);
    if (password !== confirm) return setError("The two passwords do not match.");
    setBusy(true);
    setError("");
    const db = browserClient();
    const { error } = await db.auth.updateUser({ password });
    if (error) {
      setBusy(false);
      return setError("Could not set the password. The link may have expired; request a new one.");
    }
    await db.auth.signOut(); // sign in again with the new password, then the authenticator code
    router.replace("/admin/login?reset=1");
  }

  if (!configured || ready === false)
    return (
      <section className="login-panel">
        <h1>Link expired</h1>
        <p>This password link is no longer valid. Request a new one from the sign-in page.</p>
        <Link className="ad-btn ad-btn-dark" href="/admin/login">Back to sign-in</Link>
      </section>
    );
  return (
    <section className="login-panel">
      <h1>Set a new password</h1>
      <p className="ad-muted">At least {MIN} characters. A short phrase is easier to remember and harder to guess.</p>
      <form onSubmit={submit} className="ad-form">
        <label className="field-label" htmlFor="new-password">New password</label>
        <input id="new-password" className="form-control" type="password" autoComplete="new-password" required minLength={MIN}
          value={password} onChange={(e) => setPassword(e.target.value)} />
        <label className="field-label" htmlFor="confirm-password">Confirm password</label>
        <input id="confirm-password" className="form-control" type="password" autoComplete="new-password" required minLength={MIN}
          value={confirm} onChange={(e) => setConfirm(e.target.value)} />
        {error && <p className="ad-msg" data-tone="down" role="alert">{error}</p>}
        <button className="button button-full" disabled={busy || ready === null}>{busy ? "Saving…" : "Save password"}</button>
      </form>
    </section>
  );
}
