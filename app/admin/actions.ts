"use server";
import { z } from "zod";
import { revalidatePath, updateTag } from "next/cache";
import { redirect } from "next/navigation";
import { requireOwner, requireTeam } from "@/lib/server/owner";
import { serviceClient } from "@/lib/supabase/service";
import { site } from "@/lib/site";
import { imageType } from "@/lib/admin/files";
import { sessionClient } from "@/lib/supabase/server";
import { hasSupabase } from "@/lib/supabase/public";
import { STATUSES } from "@/lib/admin/stats";
const demo = () => !hasSupabase && process.env.NODE_ENV !== "production";
const DEMO = { error: "This is demo data. Connect Supabase to save changes." };

export async function signOut() {
  const db = await sessionClient();
  await db.auth.signOut();
  redirect("/admin/login");
}
export type ActionState = { error?: string; success?: string };
export async function saveStatus(
  _state: ActionState,
  form: FormData,
): Promise<ActionState> {
  if (demo()) return DEMO;
  const { db, user } = await requireTeam();
  const parsed = z
    .object({
      id: z.uuid(),
      status: z.enum(["new", "contacted", "quoted", "won", "lost"]),
    })
    .safeParse(Object.fromEntries(form));
  if (!parsed.success) return { error: "Invalid status." };
  const { error } = await db
    .from("leads")
    .update({
      status: parsed.data.status,
      last_activity_at: new Date().toISOString(),
    })
    .eq("id", parsed.data.id);
  if (error) return { error: "Could not save the status." };
  await db.from("audit_events").insert({
    actor: user.id,
    action: `lead.status.${parsed.data.status}`,
    entity: "leads",
    entity_id: parsed.data.id,
  });
  revalidatePath("/admin");
  revalidatePath(`/admin/leads/${parsed.data.id}`);
  return { success: "Status saved." };
}
// Bulk status change from the leads table. Server actions are public endpoints, so the owner check and
// input validation happen here, not in the UI.
export async function bulkStatus(ids: unknown, status: unknown): Promise<ActionState> {
  if (demo()) return DEMO;
  const { db, user } = await requireTeam();
  const parsed = z
    .object({ ids: z.array(z.uuid()).min(1).max(100), status: z.enum(STATUSES) })
    .safeParse({ ids, status });
  if (!parsed.success) return { error: "Select up to 100 enquiries and a valid status." };
  const { data, error } = await db
    .from("leads")
    .update({ status: parsed.data.status, last_activity_at: new Date().toISOString() })
    .in("id", parsed.data.ids)
    .select("id");
  if (error) return { error: "Could not update the selected enquiries." };
  await db.from("audit_events").insert(
    (data ?? []).map((r) => ({ actor: user.id, action: `lead.status.${parsed.data.status}`, entity: "leads", entity_id: r.id })),
  );
  revalidatePath("/admin");
  revalidatePath("/admin/leads");
  return { success: `${data?.length ?? 0} updated to ${parsed.data.status}.` };
}

export async function addNote(
  _state: ActionState,
  form: FormData,
): Promise<ActionState> {
  if (demo()) return DEMO;
  const { db, user } = await requireTeam();
  const parsed = z
    .object({ id: z.uuid(), body: z.string().trim().min(1).max(2000) })
    .safeParse(Object.fromEntries(form));
  if (!parsed.success) return { error: "Enter a note of 1–2,000 characters." };
  const { error } = await db.from("lead_notes").insert({
    lead_id: parsed.data.id,
    author: user.id,
    body: parsed.data.body,
  });
  if (error) return { error: "Could not add the note." };
  await db
    .from("leads")
    .update({ last_activity_at: new Date().toISOString() })
    .eq("id", parsed.data.id);
  revalidatePath(`/admin/leads/${parsed.data.id}`);
  return { success: "Note saved." };
}
export async function saveProduct(
  _state: ActionState,
  form: FormData,
): Promise<ActionState> {
  const { db, user } = await requireOwner();
  const parsed = z
    .object({
      id: z.uuid(),
      name: z.string().trim().min(1).max(120),
      summary: z.string().trim().min(1).max(300),
      description: z.string().trim().max(4000),
      model: z.string().trim().max(60),
      status: z.enum(["draft", "published", "archived"]),
      specs: z.string().max(10000),
    })
    .safeParse(Object.fromEntries(form));
  if (!parsed.success)
    return { error: "Check the name, summary and field lengths." };
  let specs: unknown;
  try {
    specs = JSON.parse(parsed.data.specs);
  } catch {
    return { error: "Specifications must be valid JSON." };
  }
  const validated = z
    .array(
      z.object({
        label: z.string().min(1).max(100),
        value: z.string().max(300).nullable(),
      }),
    )
    .max(40)
    .safeParse(specs);
  if (!validated.success)
    return {
      error:
        "Use a list of specification labels with text values, or null for unknown values.",
    };
  const { id, ...values } = parsed.data;
  const { error } = await db
    .from("products")
    .update({
      ...values,
      model: values.model || null,
      specs: validated.data,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id);
  if (error) return { error: "Could not save the product." };
  await db.from("audit_events").insert({
    actor: user.id,
    action: "product.update",
    entity: "products",
    entity_id: id,
  });
  updateTag("catalog");
  revalidatePath("/admin/products");
  return { success: "Product saved. Public catalog refreshed." };
}
export async function retryEmail(
  _state: ActionState,
  form: FormData,
): Promise<ActionState> {
  const { db, user } = await requireOwner();
  const id = z.uuid().safeParse(form.get("id"));
  if (!id.success) return { error: "Invalid email job." };
  const { error } = await db
    .from("email_outbox")
    .update({
      status: "queued",
      attempts: 0,
      next_attempt_at: new Date().toISOString(),
      last_error: null,
    })
    .eq("id", id.data)
    .eq("status", "failed");
  if (error) return { error: "Could not retry this email." };
  await db.from("audit_events").insert({
    actor: user.id,
    action: "email.retry",
    entity: "email_outbox",
    entity_id: id.data,
  });
  revalidatePath("/admin");
  return { success: "Email queued for retry." };
}

// Deal value (PKR), follow-up reminder and lead source. Team members may set these.
export async function saveDeal(_state: ActionState, form: FormData): Promise<ActionState> {
  if (demo()) return DEMO;
  const { db, user } = await requireTeam();
  const parsed = z
    .object({
      id: z.uuid(),
      deal_value: z.union([z.literal(""), z.coerce.number().min(0).max(1_000_000_000)]),
      follow_up_at: z.union([z.literal(""), z.iso.date()]),
      source: z.enum(["website", "google", "whatsapp", "facebook", "referral", "repeat", "walk_in", "other"]),
    })
    .safeParse(Object.fromEntries(form));
  if (!parsed.success) return { error: "Check the value, date and source." };
  const { id, deal_value, follow_up_at, source } = parsed.data;
  const { error } = await db
    .from("leads")
    .update({
      deal_value: deal_value === "" ? null : deal_value,
      // Reminder at 9:00 Pakistan time on the chosen day.
      follow_up_at: follow_up_at ? `${follow_up_at}T09:00:00+05:00` : null,
      source,
      last_activity_at: new Date().toISOString(),
    })
    .eq("id", id);
  if (error) return { error: "Could not save the deal details." };
  await db.from("audit_events").insert({ actor: user.id, action: "lead.deal", entity: "leads", entity_id: id });
  revalidatePath("/admin");
  revalidatePath(`/admin/leads/${id}`);
  return { success: "Deal details saved." };
}

const variantRow = z.object({
  sku: z.string().trim().regex(/^[A-Za-z0-9._-]{1,60}$/, "SKU: letters, digits, dot, dash or underscore"),
  name: z.string().trim().min(1).max(120),
  units: z.array(z.enum(["pcs", "kg", "m"])).min(1).max(3),
  min_qty: z.union([z.null(), z.number().positive().max(10_000_000)]),
  status: z.enum(["draft", "published", "archived"]),
});

// Owner edits and adds variants. Existing SKUs are matched by SKU; nothing is deleted, so old
// quotes keep their links (archive a variant instead).
export async function saveVariants(productId: unknown, rows: unknown): Promise<ActionState> {
  if (demo()) return DEMO;
  const { db, user } = await requireOwner();
  const parsed = z.object({ productId: z.uuid(), rows: z.array(variantRow).min(1).max(30) }).safeParse({ productId, rows });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Check the variants." };
  const skus = parsed.data.rows.map((r) => r.sku);
  if (new Set(skus).size !== skus.length) return { error: "Each SKU must be unique." };
  const { error } = await db.from("variants").upsert(
    parsed.data.rows.map((r, sort) => ({ ...r, product_id: parsed.data.productId, sort })),
    { onConflict: "sku" },
  );
  if (error) return { error: error.code === "23505" ? "That SKU already belongs to another product." : "Could not save the variants." };
  await db.from("audit_events").insert({ actor: user.id, action: "product.variants", entity: "products", entity_id: parsed.data.productId });
  updateTag("catalog");
  revalidatePath(`/admin/products/${parsed.data.productId}`);
  return { success: "Variants saved. Public catalog refreshed." };
}

const MAX_PHOTO = 5 * 1024 * 1024;

// Owner uploads a product photo to Supabase Storage. The file's real bytes decide the type, not its name.
export async function uploadPhoto(_state: ActionState, form: FormData): Promise<ActionState> {
  if (demo()) return DEMO;
  const { db, user } = await requireOwner();
  const productId = z.uuid().safeParse(form.get("productId"));
  const alt = z.string().trim().min(3).max(200).safeParse(form.get("alt"));
  const file = form.get("photo");
  if (!productId.success || !alt.success) return { error: "Describe the photo in a few words (used for accessibility)." };
  if (!(file instanceof File) || file.size === 0) return { error: "Choose a photo to upload." };
  if (file.size > MAX_PHOTO) return { error: "Photos must be 5 MB or smaller." };
  const bytes = new Uint8Array(await file.arrayBuffer());
  const type = imageType(bytes);
  if (!type) return { error: "Use a JPEG, PNG or WebP photo." };
  const path = `${productId.data}/${crypto.randomUUID()}.${type.ext}`;
  const up = await db.storage.from("product-media").upload(path, bytes, { contentType: type.mime, upsert: false });
  if (up.error) return { error: "Upload failed. Check the storage bucket is set up (migration 0006)." };
  const url = db.storage.from("product-media").getPublicUrl(path).data.publicUrl;
  const { error } = await db.from("product_media").insert({ product_id: productId.data, kind: "photo", url, alt: alt.data, approved: true, sort: 100 });
  if (error) {
    await db.storage.from("product-media").remove([path]);
    return { error: "Could not save the photo." };
  }
  await db.from("audit_events").insert({ actor: user.id, action: "product.photo.add", entity: "products", entity_id: productId.data });
  updateTag("catalog");
  revalidatePath(`/admin/products/${productId.data}`);
  return { success: "Photo added to the product gallery." };
}

export async function deletePhoto(mediaId: unknown): Promise<ActionState> {
  if (demo()) return DEMO;
  const { db, user } = await requireOwner();
  const id = z.uuid().safeParse(mediaId);
  if (!id.success) return { error: "Invalid photo." };
  const { data } = await db.from("product_media").delete().eq("id", id.data).select("product_id,url").maybeSingle();
  if (!data) return { error: "Photo not found." };
  const path = data.url.split("/product-media/")[1];
  if (path) await db.storage.from("product-media").remove([path]);
  await db.from("audit_events").insert({ actor: user.id, action: "product.photo.remove", entity: "products", entity_id: data.product_id });
  updateTag("catalog");
  revalidatePath(`/admin/products/${data.product_id}`);
  return { success: "Photo removed." };
}

// Owner invites a staff member or co-owner. Supabase emails them a link to set a password; they then
// add an authenticator app at first sign-in. Requires the server secret key, which never reaches the browser.
export async function inviteMember(_state: ActionState, form: FormData): Promise<ActionState> {
  if (demo()) return DEMO;
  const { db, user } = await requireOwner();
  const parsed = z
    .object({ email: z.email().max(254).transform((e) => e.toLowerCase()), role: z.enum(["owner", "staff"]) })
    .safeParse(Object.fromEntries(form));
  if (!parsed.success) return { error: "Enter a valid email and role." };
  const admin = serviceClient();
  const { data, error } = await admin.auth.admin.inviteUserByEmail(parsed.data.email, {
    redirectTo: `${site.url}/admin/auth/callback?next=/admin/reset`,
  });
  if (error || !data.user) return { error: "Could not send the invite. The address may already have an account." };
  const { error: rowError } = await admin.from("owners").upsert({ user_id: data.user.id, role: parsed.data.role, email: parsed.data.email });
  if (rowError) return { error: "Invite sent, but access could not be granted. Try again." };
  await db.from("audit_events").insert({ actor: user.id, action: `team.invite.${parsed.data.role}`, entity: "owners", entity_id: data.user.id });
  revalidatePath("/admin/team");
  return { success: `Invite sent to ${parsed.data.email}.` };
}

export async function removeMember(userId: unknown): Promise<ActionState> {
  if (demo()) return DEMO;
  const { db, user } = await requireOwner();
  const id = z.uuid().safeParse(userId);
  if (!id.success) return { error: "Invalid member." };
  if (id.data === user.id) return { error: "You cannot remove your own access." };
  const { error } = await serviceClient().from("owners").delete().eq("user_id", id.data);
  if (error) return { error: "Could not remove access." };
  await db.from("audit_events").insert({ actor: user.id, action: "team.remove", entity: "owners", entity_id: id.data });
  revalidatePath("/admin/team");
  return { success: "Access removed." };
}
