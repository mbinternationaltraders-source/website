"use client";
import Script from "next/script";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import {
  contactFields,
  quoteFields,
  type ContactFields,
} from "@/lib/quote-schema";
import type { BasketItem } from "@/lib/basket";
import { whatsappLink } from "@/lib/site";
import { industries } from "@/lib/catalog/seed";
type Turnstile = {
  render: (el: HTMLElement, options: Record<string, unknown>) => string;
  reset: (id: string) => void;
  remove: (id: string) => void;
};
declare global {
  interface Window {
    turnstile?: Turnstile;
  }
}
export function EnquiryForm({
  kind,
  items = [],
  onSaved,
}: {
  kind: "quote" | "contact";
  items?: BasketItem[];
  onSaved?: () => void;
}) {
  const router = useRouter();
  const {
    register,
    handleSubmit,
    setError,
    control,
    formState: { errors, isSubmitting },
  } = useForm<ContactFields>({
    resolver: zodResolver(kind === "quote" ? quoteFields : contactFields),
    defaultValues: {
      name: "",
      company: "",
      email: "",
      phone: "",
      preferredContact: "whatsapp",
      industry: "",
      deliveryCity: "",
      message: "",
    },
  });
  const [error, setFormError] = useState(""),
    [token, setToken] = useState(""),
    [loaded, setLoaded] = useState(false);
  const container = useRef<HTMLDivElement>(null),
    widget = useRef<string | null>(null),
    key = useRef<string | null>(null),
    lastBody = useRef<string | null>(null),
    hp = useRef<HTMLInputElement>(null);
  const siteKey =
    process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY ||
    (process.env.NODE_ENV !== "production" ? "1x00000000000000000000AA" : "");
  const preferred = useWatch({ control, name: "preferredContact" });
  useEffect(() => {
    if (!loaded || !container.current || !window.turnstile || !siteKey) return;
    widget.current = window.turnstile.render(container.current, {
      sitekey: siteKey,
      action: kind,
      theme: "light",
      size: "flexible",
      callback: (value: string) => setToken(value),
      "expired-callback": () => setToken(""),
      "error-callback": () => {
        setToken("");
        setFormError(
          "The security check couldn’t load. Please try again or contact us on WhatsApp.",
        );
      },
    });
    return () => {
      if (widget.current) window.turnstile?.remove(widget.current);
    };
  }, [loaded, siteKey, kind]);
  async function submit(fields: ContactFields) {
    setFormError("");
    if (kind === "contact" && !fields.message?.trim()) {
      setError(
        "message",
        { message: "Tell us what you need." },
        { shouldFocus: true },
      );
      return;
    }
    if (!token && siteKey) {
      setFormError("Please complete the security check, then try again.");
      return;
    }
    const signature = JSON.stringify({ fields, items });
    if (!key.current || lastBody.current !== signature) {
      key.current = crypto.randomUUID();
      lastBody.current = signature;
    }
    try {
      const response = await fetch(
        kind === "quote" ? "/api/quote/submit" : "/api/enquiries",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            kind,
            fields,
            items,
            idempotencyKey: key.current,
            turnstileToken: token || "unconfigured",
            website: hp.current?.value ?? "",
          }),
          signal: AbortSignal.timeout(15000),
        },
      );
      const data = await response.json();
      if (!response.ok) {
        setFormError(
          data.error || "We couldn’t save your request. Please try again.",
        );
        if (data.fieldErrors)
          for (const [field, messages] of Object.entries(data.fieldErrors))
            setError(field as keyof ContactFields, {
              message: String((messages as string[])[0]),
            });
        return;
      }
      try {
        sessionStorage.setItem(
          "mb-confirmation",
          JSON.stringify({ reference: data.reference, kind }),
        );
      } catch {}
      onSaved?.();
      router.push(kind === "quote" ? "/quote/thank-you" : "/thank-you");
    } catch {
      setFormError(
        "We couldn’t confirm the request. Please try again; an unchanged retry won’t create a duplicate.",
      );
    } finally {
      setToken("");
      if (widget.current) window.turnstile?.reset(widget.current);
    }
  }
  const examples: Partial<Record<keyof ContactFields, string>> = {
    name: "e.g. Ahmed Raza",
    company: "e.g. Raza Appliances",
    phone: "+92 300 1234567",
    email: "name@company.com",
    deliveryCity: "e.g. Lahore",
  };
  const field = (
    name: keyof ContactFields,
    label: string,
    type = "text",
    autocomplete?: string,
    wide = false,
  ) => (
    // Placeholders show an example answer; the visible label stays the field's name.
    <div className={`form-field ${wide ? "field-wide" : ""}`}>
      <label className="field-label" htmlFor={`${kind}-${name}`}>
        {label}
      </label>
      <input
        id={`${kind}-${name}`}
        type={type}
        autoComplete={autocomplete}
        className="form-control"
        placeholder={examples[name]}
        {...register(name)}
        aria-invalid={!!errors[name]}
        aria-describedby={errors[name] ? `${kind}-${name}-error` : undefined}
        maxLength={
          name === "email"
            ? 254
            : name === "company"
              ? 160
              : name === "phone"
                ? 20
                : 100
        }
      />
      {errors[name] && (
        <span className="field-error" id={`${kind}-${name}-error`}>
          {errors[name]?.message}
        </span>
      )}
    </div>
  );
  return (
    <form noValidate onSubmit={(event) => void handleSubmit(submit)(event)}>
      <div className="form-grid">
        {field("name", "Your name *", "text", "name")}
        {field(
          "company",
          kind === "quote" ? "Company *" : "Company",
          "text",
          "organization",
        )}
        <div className="form-field field-wide">
          <label className="field-label" htmlFor={`${kind}-preferred`}>
            How should we reply? *
          </label>
          <select
            className="form-control"
            id={`${kind}-preferred`}
            {...register("preferredContact")}
          >
            <option value="whatsapp">WhatsApp</option>
            <option value="phone">Phone call</option>
            <option value="email">Email</option>
          </select>
          <span className="field-hint">Pick the channel you check most often.</span>
        </div>
        {field(
          "phone",
          `Phone / WhatsApp${kind === "quote" || preferred !== "email" ? " *" : ""}`,
          "tel",
          "tel",
        )}
        {field(
          "email",
          `Email${preferred === "email" ? " *" : ""}`,
          "email",
          "email",
        )}
        {kind === "quote" && (
          <>
            {field("deliveryCity", "Delivery city *", "text", "address-level2")}
            <div className="form-field">
              <label className="field-label" htmlFor={`${kind}-industry`}>
                Industry
              </label>
              <select
                className="form-control"
                id={`${kind}-industry`}
                {...register("industry")}
              >
                <option value="">Select industry</option>
                {industries.map((i) => (
                  <option key={i.slug} value={i.slug}>
                    {i.name}
                  </option>
                ))}
                <option value="other">Other</option>
              </select>
            </div>
          </>
        )}
        <div className="form-field field-wide">
          <label className="field-label" htmlFor={`${kind}-message`}>
            {kind === "contact"
              ? "How can we help? *"
              : "Anything else we should know?"}
          </label>
          <textarea
            className="form-control"
            id={`${kind}-message`}
            {...register("message")}
            maxLength={1000}
            rows={4}
            placeholder={
              kind === "quote"
                ? "e.g. We assemble 2,000 coolers a month and need pumps by 15 November. Current part: LH1020."
                : "Tell us about your company, the part you need (model, rating or a photo you can share) and the quantity."
            }
            aria-invalid={!!errors.message}
            aria-describedby={
              errors.message ? `${kind}-message-error` : undefined
            }
          />
          {errors.message && (
            <span className="field-error" id={`${kind}-message-error`}>
              {errors.message.message}
            </span>
          )}
        </div>
      </div>
      <div className="hp-field" aria-hidden="true">
        <label>
          Website
          <input ref={hp} name="website" autoComplete="off" tabIndex={-1} />
        </label>
      </div>
      <p className="form-privacy">
        We’ll use these details to respond to your enquiry. No promotional
        sign-up. Read our <Link href="/privacy">Privacy policy</Link> and{" "}
        <Link href="/terms">Terms & conditions</Link>.
      </p>
      {siteKey && (
        <>
          <Script
            src="https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit"
            strategy="afterInteractive"
            onReady={() => setLoaded(true)}
            onError={() =>
              setFormError(
                "The security check is unavailable. You can contact us on WhatsApp instead.",
              )
            }
          />
          <div ref={container} className="turnstile-widget" />
        </>
      )}
      {error && (
        <div className="form-error" role="alert">
          {error}{" "}
          <a href={whatsappLink()} target="_blank" rel="noopener noreferrer">
            Contact us on WhatsApp
          </a>
        </div>
      )}
      <button
        type="submit"
        className="button button-full"
        disabled={isSubmitting}
        style={{ marginTop: 16 }}
      >
        {isSubmitting
          ? "Sending your request…"
          : kind === "quote"
            ? "Submit quote request"
            : "Send enquiry"}
      </button>
      <p className="form-privacy" style={{ marginBottom: 0 }}>
        A request starts a conversation. It does not place an order.
      </p>
    </form>
  );
}
