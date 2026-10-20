import { z } from "zod";
import { fractionalUnits } from "./catalog/units";

// Shared by React Hook Form (client feedback) and the API route (authoritative check). Spec §11 limits.
const text = (max: number) =>
  z.string().trim().max(max, `Use ${max} characters or fewer.`);
const optional = (max: number) => text(max).optional().or(z.literal(""));

export const phonePattern = /^\+?[0-9 ()-]{7,20}$/;
const digits = (s: string) => s.replace(/\D/g, "").length;

export const itemSchema = z
  .object({
    sku: z.string().regex(/^[A-Za-z0-9._-]{1,60}$/),
    quantity: z
      .number({ error: "Enter a quantity." })
      .positive("Quantity must be more than zero.")
      .max(10_000_000),
    unit: z.enum(["pcs", "kg", "m"]),
    note: optional(400),
  })
  .refine(
    (i) => fractionalUnits.includes(i.unit) || Number.isInteger(i.quantity),
    {
      message: "Use a whole number for pieces.",
      path: ["quantity"],
    },
  );

export const contactFields = z
  .object({
    name: text(100).min(1, "Enter your name."),
    company: optional(160),
    phone: z
      .string()
      .trim()
      .refine(
        (s) =>
          s === "" ||
          (phonePattern.test(s) && digits(s) >= 7 && digits(s) <= 15),
        "Enter a phone number, for example +92 300 1234567.",
      )
      .optional(),
    email: z
      .email("Enter an email address like name@company.com.")
      .max(254)
      .optional()
      .or(z.literal("")),
    preferredContact: z.enum(["whatsapp", "phone", "email"]),
    industry: optional(80),
    deliveryCity: optional(100),
    message: optional(1000),
  })
  .superRefine((v, ctx) => {
    if (v.preferredContact === "email" && !v.email)
      ctx.addIssue({
        code: "custom",
        path: ["email"],
        message: "Enter your email, or choose another contact method.",
      });
    if (v.preferredContact !== "email" && !v.phone)
      ctx.addIssue({
        code: "custom",
        path: ["phone"],
        message: "Enter your phone or WhatsApp number.",
      });
  });

export type ContactFields = z.infer<typeof contactFields>;

function quoteRequirements(fields: ContactFields) {
  return [
    ["company", fields.company, "Enter your company name."],
    ["phone", fields.phone, "Enter your phone or WhatsApp number."],
    ["deliveryCity", fields.deliveryCity, "Enter your delivery city."],
  ] as const;
}
export const quoteFields = contactFields.superRefine((fields, ctx) => {
  for (const [key, value, message] of quoteRequirements(fields))
    if (!value?.trim()) ctx.addIssue({ code: "custom", path: [key], message });
});

export const submissionSchema = z
  .object({
    kind: z.enum(["quote", "contact"]),
    idempotencyKey: z.uuid(),
    turnstileToken: z.string().min(1).max(4096),
    fields: contactFields,
    items: z.array(itemSchema).max(50, "A request can include up to 50 items."),
  })
  .superRefine((v, ctx) => {
    if (v.kind === "quote")
      for (const [key, value, message] of quoteRequirements(v.fields))
        if (!value?.trim())
          ctx.addIssue({ code: "custom", path: ["fields", key], message });
    if (v.kind === "quote" && v.items.length === 0)
      ctx.addIssue({
        code: "custom",
        path: ["items"],
        message: "Add at least one component to your quote.",
      });
    if (v.kind === "contact" && !v.fields.message)
      ctx.addIssue({
        code: "custom",
        path: ["fields", "message"],
        message: "Tell us what you need.",
      });
  });

export type Submission = z.infer<typeof submissionSchema>;
