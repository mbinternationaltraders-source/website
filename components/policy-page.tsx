import Link from "next/link";
import { policies } from "@/lib/policies";
import { site } from "@/lib/site";
import { CookieSettings } from "./preferences";
export function PolicyPage({ slug }: { slug: keyof typeof policies }) {
  const policy = policies[slug];
  return (
    <div className="container policy-layout">
      <nav className="policy-nav" aria-label="Policies">
        {Object.entries(policies).map(([key, value]) => (
          <Link
            key={key}
            href={`/${key}`}
            aria-current={key === slug ? "page" : undefined}
          >
            {value.title}
          </Link>
        ))}
      </nav>
      <article className="policy-content">
        <h1>{policy.title}</h1>
        <p className="effective">Effective {site.policiesEffective}</p>
        <p>{policy.intro}</p>
        {policy.sections.map(([title, body]) => (
          <section key={title}>
            <h2>{title}</h2>
            <p>{body}</p>
          </section>
        ))}
        {slug === "cookies" && (
          <div className="text-link" style={{ marginTop: 25 }}>
            <CookieSettings />
          </div>
        )}
        <section>
          <h2>Talk to our team</h2>
          <p>
            <a href={`mailto:${site.email}`}>{site.email}</a>
            <br />
            <a href={`tel:${site.phoneE164}`}>{site.phoneDisplay}</a>
          </p>
        </section>
      </article>
    </div>
  );
}
