"use client";
import { useActionState, useState, useTransition } from "react";
import { inviteMember, removeMember } from "@/app/admin/actions";

export function InviteForm() {
  const [state, action, pending] = useActionState(inviteMember, {});
  return (
    <form action={action} className="ad-form">
      <div className="ad-fields">
        <label>
          <span>Email</span>
          <input className="ad-input" name="email" type="email" required autoComplete="off" placeholder="name@company.com" />
        </label>
        <label>
          <span>Role</span>
          <select className="ad-input" name="role" defaultValue="staff">
            <option value="staff">Staff: enquiries only</option>
            <option value="owner">Owner: full access</option>
          </select>
        </label>
      </div>
      <div className="ad-form-row">
        <span className="ad-muted">They get an email to set a password, then add an authenticator app.</span>
        <button className="ad-btn ad-btn-dark" disabled={pending}>{pending ? "Sending…" : "Send invite"}</button>
      </div>
      {state.error && <p className="ad-msg" data-tone="down" role="alert">{state.error}</p>}
      {state.success && <p className="ad-msg" data-tone="up" role="status">{state.success}</p>}
    </form>
  );
}

export function RemoveMemberButton({ userId, email }: { userId: string; email: string }) {
  const [pending, start] = useTransition();
  const [msg, setMsg] = useState("");
  return (
    <span>
      <button type="button" className="ad-btn" disabled={pending}
        onClick={() => confirm(`Remove access for ${email}?`) && start(async () => setMsg((await removeMember(userId)).error ?? ""))}>
        {pending ? "Removing…" : "Remove"}
      </button>
      {msg && <small className="ad-msg" data-tone="down">{msg}</small>}
    </span>
  );
}
