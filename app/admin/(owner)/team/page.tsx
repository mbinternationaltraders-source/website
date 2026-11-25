import { Suspense } from "react";
import { ownerOnlyContext } from "@/lib/server/dashboard";
import { InviteForm, RemoveMemberButton } from "@/components/admin/team-forms";

export default function Team() {
  return (
    <Suspense fallback={<div className="ad-loading">Loading team…</div>}>
      <TeamData />
    </Suspense>
  );
}

type Member = { user_id: string; role: "owner" | "staff"; email: string | null; created_at: string };

async function TeamData() {
  const ctx = await ownerOnlyContext();
  let members: Member[];
  if (ctx.demo) {
    members = [{ user_id: "demo-owner", role: "owner", email: "owner@example.com", created_at: new Date().toISOString() }];
  } else {
    const { data, error } = await ctx.db.from("owners").select("user_id,role,email,created_at").order("created_at");
    if (error) throw new Error("Could not load the team");
    members = data as Member[];
  }
  const me = ctx.demo ? "demo-owner" : ctx.user.id;
  return (
    <div className="ad-page">
      <header className="ad-head">
        <div>
          <h1>Team</h1>
          <p>Staff can work enquiries. Only owners can export, edit products or manage the team. Everyone signs in with an authenticator code.</p>
        </div>
      </header>
      <div className="ad-grid">
        <section className="ad-card" aria-labelledby="members-title">
          <h2 id="members-title">People with access</h2>
          <ul className="ad-members">
            {members.map((m) => (
              <li key={m.user_id}>
                <span>
                  <strong>{m.email ?? "Owner account"}</strong>
                  <small>{m.user_id === me ? "You" : `Added ${new Date(m.created_at).toLocaleDateString("en-GB")}`}</small>
                </span>
                <span className="ad-pill" data-status={m.role === "owner" ? "quoted" : "new"}>{m.role}</span>
                {m.user_id !== me && <RemoveMemberButton userId={m.user_id} email={m.email ?? "this member"} />}
              </li>
            ))}
          </ul>
        </section>
        <section className="ad-card" aria-labelledby="invite-title">
          <h2 id="invite-title">Invite someone</h2>
          <InviteForm />
        </section>
      </div>
    </div>
  );
}
