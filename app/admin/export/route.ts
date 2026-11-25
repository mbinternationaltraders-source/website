import { requireOwner } from "@/lib/server/owner";
import { csvDocument } from "@/lib/csv";
import { z } from "zod";
export async function GET(request: Request) {
  const { db, user } = await requireOwner();
  // Optional ?ids=a,b for "Export selected"; anything that is not a list of UUIDs is rejected.
  const raw = new URL(request.url).searchParams.get("ids");
  const ids = raw ? z.array(z.uuid()).max(100).safeParse(raw.split(",")) : null;
  if (ids && !ids.success)
    return new Response("Invalid selection", { status: 400, headers: { "Cache-Control": "no-store" } });
  let query = db
    .from("leads")
    .select(
      "reference,name,company,email,phone,preferred_contact,industry,delivery_city,status,created_at",
    )
    .order("created_at", { ascending: false })
    .limit(1000);
  if (ids?.success) query = query.in("id", ids.data);
  const { data, error } = await query;
  if (error)
    return new Response("Export unavailable", {
      status: 503,
      headers: { "Cache-Control": "no-store" },
    });
  await db
    .from("audit_events")
    .insert({ actor: user.id, action: "leads.export", entity: "leads" });
  const headers = [
    "Reference",
    "Name",
    "Company",
    "Email",
    "Phone",
    "Preferred contact",
    "Industry",
    "Delivery city",
    "Status",
    "Received",
  ];
  return new Response(
    csvDocument(
      headers,
      data.map((x) => [
        x.reference,
        x.name,
        x.company,
        x.email,
        x.phone,
        x.preferred_contact,
        x.industry,
        x.delivery_city,
        x.status,
        x.created_at,
      ]),
    ),
    {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition":
          'attachment; filename="mb-enquiries-latest-1000.csv"',
        "Cache-Control": "private, no-store",
        "X-Content-Type-Options": "nosniff",
      },
    },
  );
}
