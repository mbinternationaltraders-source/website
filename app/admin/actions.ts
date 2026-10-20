"use server";
import { z } from "zod";
import { revalidatePath, updateTag } from "next/cache";
import { redirect } from "next/navigation";
import { requireOwner } from "@/lib/server/owner";
import { sessionClient } from "@/lib/supabase/server";
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
  const { db, user } = await requireOwner();
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
    action: "lead.status",
    entity: "leads",
    entity_id: parsed.data.id,
  });
  revalidatePath("/admin");
  revalidatePath(`/admin/leads/${parsed.data.id}`);
  return { success: "Status saved." };
}
export async function addNote(
  _state: ActionState,
  form: FormData,
): Promise<ActionState> {
  const { db, user } = await requireOwner();
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
