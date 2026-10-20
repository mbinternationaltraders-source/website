"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { browserClient } from "@/lib/supabase/browser";
export function LoginForm({ configured }: { configured: boolean }) {
  const [email, setEmail] = useState(""),
    [password, setPassword] = useState(""),
    [code, setCode] = useState(""),
    [factor, setFactor] = useState<string | null>(null),
    [qr, setQr] = useState(""),
    [secret, setSecret] = useState(""),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false),
    [stage, setStage] = useState<"login" | "enroll" | "verify">("login");
  const router = useRouter();
  async function begin(e: React.SubmitEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      const db = browserClient();
      const { error: signIn } = await db.auth.signInWithPassword({
        email,
        password,
      });
      setPassword("");
      if (signIn)
        throw new Error("Sign-in failed. Check your details and try again.");
      const {
        data: { user },
      } = await db.auth.getUser();
      const { data: owner } = await db
        .from("owners")
        .select("user_id")
        .eq("user_id", user?.id ?? "")
        .maybeSingle();
      if (!owner) {
        await db.auth.signOut();
        throw new Error("This account does not have owner access.");
      }
      const { data: level } =
        await db.auth.mfa.getAuthenticatorAssuranceLevel();
      if (level?.currentLevel === "aal2") {
        router.push("/admin");
        router.refresh();
        return;
      }
      const { data: factors, error: factorError } =
        await db.auth.mfa.listFactors();
      if (factorError)
        throw new Error(
          "Unable to load two-step verification. Try signing in again.",
        );
      const verified = factors.totp.find((f) => f.status === "verified");
      if (verified) {
        setFactor(verified.id);
        setStage("verify");
      } else setStage("enroll");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Sign-in unavailable.");
    } finally {
      setBusy(false);
    }
  }
  async function enroll() {
    setBusy(true);
    setError("");
    try {
      const db = browserClient();
      const { data, error } = await db.auth.mfa.enroll({
        factorType: "totp",
        friendlyName: `MB owner ${new Date().toISOString().slice(0, 19)}`,
      });
      if (error)
        throw new Error(
          "Could not start authenticator setup. Try signing in again or contact your administrator.",
        );
      setFactor(data.id);
      setQr(data.totp.qr_code);
      setSecret(data.totp.secret);
      setStage("verify");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Setup unavailable.");
    } finally {
      setBusy(false);
    }
  }
  async function verify(e: React.SubmitEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!factor) return;
    setBusy(true);
    setError("");
    try {
      const { error } = await browserClient().auth.mfa.challengeAndVerify({
        factorId: factor,
        code,
      });
      if (error)
        throw new Error(
          "The code could not be verified. Use the current six-digit code.",
        );
      setCode("");
      setQr("");
      setSecret("");
      router.push("/admin");
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Verification unavailable.");
    } finally {
      setBusy(false);
    }
  }
  if (!configured)
    return (
      <div className="login-panel">
        <span className="eyebrow">OWNER ACCESS</span>
        <h1 style={{ marginTop: 16 }}>Admin setup pending.</h1>
        <p>
          This local preview has no Supabase connection. Add your project
          configuration to the private environment file, apply the migrations
          and allowlist the owner account to enable sign-in.
        </p>
        <p>Never paste secret keys into the public website or a chat.</p>
      </div>
    );
  return (
    <section className="login-panel">
      <span className="eyebrow">MB INTERNATIONAL TRADERS / OWNER</span>
      <h1 style={{ marginTop: 17 }}>
        {stage === "login"
          ? "Welcome back."
          : stage === "enroll"
            ? "Protect your account."
            : "Verify it’s you."}
      </h1>
      {stage === "login" ? (
        <form onSubmit={begin}>
          <label className="field-label" htmlFor="owner-email">
            Email
          </label>
          <input
            id="owner-email"
            className="form-control"
            type="email"
            autoComplete="username"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <label className="field-label" htmlFor="owner-password">
            Password
          </label>
          <input
            id="owner-password"
            className="form-control"
            type="password"
            autoComplete="current-password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <button className="button button-full" disabled={busy}>
            {busy ? "Signing in…" : "Continue"}
          </button>
        </form>
      ) : stage === "enroll" ? (
        <>
          <p>
            Set up an authenticator app before accessing customer enquiries. Use
            the QR code on the next step, then enter the app’s six-digit code.
          </p>
          <button
            className="button button-full"
            onClick={enroll}
            disabled={busy}
          >
            {busy ? "Preparing…" : "Set up two-step login"}
          </button>
        </>
      ) : (
        <form onSubmit={verify}>
          {qr && (
            <>
              <div className="admin-qr">
                {/* Authenticator QR data must remain local and bypass image optimisation. */}
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={qr}
                  width={200}
                  height={200}
                  alt="Scan this QR code with your authenticator app"
                />
              </div>
              <details>
                <summary>Enter the setup key manually</summary>
                <p className="code-display">{secret}</p>
              </details>
            </>
          )}
          <label className="field-label" htmlFor="owner-code">
            Authenticator code
          </label>
          <input
            id="owner-code"
            className="form-control"
            inputMode="numeric"
            autoComplete="one-time-code"
            pattern="[0-9]{6}"
            maxLength={6}
            required
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
          />
          <button className="button button-full" disabled={busy}>
            {busy ? "Verifying…" : "Verify and open dashboard"}
          </button>
        </form>
      )}
      {error && (
        <p className="form-error" role="alert">
          {error}
        </p>
      )}
      {stage !== "login" && (
        <button
          className="text-button"
          onClick={async () => {
            await browserClient().auth.signOut();
            setStage("login");
            setFactor(null);
            setQr("");
            setSecret("");
          }}
        >
          Cancel and sign out
        </button>
      )}
    </section>
  );
}
