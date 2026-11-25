import Link from "next/link";
import { Suspense } from "react";
import { ownerContext, loadAllRows } from "@/lib/server/dashboard";
import { ageLabel, groupCustomers, pkr } from "@/lib/admin/stats";

export default function Customers() {
  return (
    <Suspense fallback={<div className="ad-loading">Loading customers…</div>}>
      <CustomersData />
    </Suspense>
  );
}

async function CustomersData() {
  const ctx = await ownerContext();
  const customers = groupCustomers(await loadAllRows(ctx));
  const repeat = customers.filter((c) => c.enquiries > 1).length;
  return (
    <div className="ad-page">
      <header className="ad-head">
        <div>
          <h1>Customers</h1>
          <p>{customers.length} buyers · {repeat} came back more than once. Grouped by phone, then email, then company.</p>
        </div>
      </header>
      <div className="ad-table-wrap">
        <table className="ad-table">
          <thead>
            <tr>
              <th scope="col">Customer</th>
              <th scope="col">Enquiries</th>
              <th scope="col">Open</th>
              <th scope="col">Won</th>
              <th scope="col">Won value</th>
              <th scope="col">Last enquiry</th>
            </tr>
          </thead>
          <tbody>
            {customers.map((c) => (
              <tr key={c.latest.id}>
                <td>
                  <Link className="ad-row-link" href={`/admin/leads/${c.latest.id}`}>{c.name}</Link>
                  <small>{c.company ?? "Individual"}{c.enquiries > 1 ? " · repeat buyer" : ""}</small>
                </td>
                <td>{c.enquiries}</td>
                <td>{c.open || <span className="ad-muted">0</span>}</td>
                <td>{c.won || <span className="ad-muted">0</span>}</td>
                <td>{c.wonValue ? pkr(c.wonValue) : <span className="ad-muted">—</span>}</td>
                <td><time dateTime={c.last}>{ageLabel(c.last)}</time></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
