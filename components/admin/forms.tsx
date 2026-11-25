"use client";
import { useActionState } from "react";
import {
  saveStatus,
  addNote,
  saveProduct,
  retryEmail,
  saveDeal,
} from "@/app/admin/actions";
import { SOURCES, sourceLabel } from "@/lib/admin/stats";
function Result({ state }: { state: { error?: string; success?: string } }) {
  return state.error ? (
    <p className="ad-msg" data-tone="down" role="alert">
      {state.error}
    </p>
  ) : state.success ? (
    <p className="ad-msg" data-tone="up" role="status">
      {state.success}
    </p>
  ) : null;
}
// One click per stage: each button submits its own status, so there is no "select then save" step.
export function StatusForm({ id, status }: { id: string; status: string }) {
  const [state, action, pending] = useActionState(saveStatus, {});
  return (
    <form action={action} className="ad-form">
      <input type="hidden" name="id" value={id} />
      <div className="ad-stages" role="group" aria-label="Move enquiry to stage">
        {["new", "contacted", "quoted", "won", "lost"].map((s) => (
          <button key={s} name="status" value={s} data-status={s} aria-pressed={s === status} disabled={pending}>
            {s[0].toUpperCase() + s.slice(1)}
          </button>
        ))}
      </div>
      <Result state={state} />
    </form>
  );
}
export function NoteForm({ id }: { id: string }) {
  const [state, action, pending] = useActionState(addNote, {});
  return (
    <form action={action} className="ad-form">
      <input type="hidden" name="id" value={id} />
      <label className="sr-only" htmlFor="lead-note">Add an internal note</label>
      <textarea className="ad-input" id="lead-note" name="body" rows={3} maxLength={2000} required
        placeholder="e.g. Called, sending 10 samples on Monday. Wants delivery to Lahore." />
      <div className="ad-form-row">
        <span className="ad-muted">Only visible to you.</span>
        <button className="ad-btn ad-btn-dark" disabled={pending}>{pending ? "Saving…" : "Add note"}</button>
      </div>
      <Result state={state} />
    </form>
  );
}
export function DealForm({ id, value, followUp, source }: { id: string; value: number | null; followUp: string | null; source: string }) {
  const [state, action, pending] = useActionState(saveDeal, {});
  // The date input works in Pakistan time, matching how reminders are shown.
  const day = followUp ? new Date(followUp).toLocaleDateString("en-CA", { timeZone: "Asia/Karachi" }) : "";
  return (
    <form action={action} className="ad-form">
      <input type="hidden" name="id" value={id} />
      <div className="ad-fields">
        <label>
          <span>Deal value (Rs)</span>
          <input className="ad-input" name="deal_value" type="number" min={0} step={1} inputMode="numeric" defaultValue={value ?? ""} placeholder="e.g. 250000" />
        </label>
        <label>
          <span>Follow up on</span>
          <input className="ad-input" name="follow_up_at" type="date" defaultValue={day} />
        </label>
        <label>
          <span>Source</span>
          <select className="ad-input" name="source" defaultValue={source}>
            {SOURCES.map((s) => <option key={s} value={s}>{sourceLabel[s]}</option>)}
          </select>
        </label>
      </div>
      <div className="ad-form-row">
        <span className="ad-muted">Clear the date to remove the reminder.</span>
        <button className="ad-btn ad-btn-dark" disabled={pending}>{pending ? "Saving…" : "Save deal"}</button>
      </div>
      <Result state={state} />
    </form>
  );
}
export function RetryForm({ id }: { id: string }) {
  const [state, action, pending] = useActionState(retryEmail, {});
  return (
    <form action={action}>
      <input type="hidden" name="id" value={id} />
      <button className="text-button" disabled={pending}>
        Retry email
      </button>
      <Result state={state} />
    </form>
  );
}
type EditableProduct = {
  id: string;
  name: string;
  summary: string;
  description: string;
  model: string | null;
  status: string;
  specs: unknown;
};
export function ProductEditForm({ product }: { product: EditableProduct }) {
  const [state, action, pending] = useActionState(saveProduct, {});
  return (
    <form action={action} className="admin-card">
      <input type="hidden" name="id" value={product.id} />
      <div className="form-grid">
        {(
          [
            ["name", "Product name", 120],
            ["model", "Model", 60],
            ["summary", "Summary", 300],
          ] as const
        ).map(([key, label, max]) => (
          <label key={key} className={key === "summary" ? "field-wide" : ""}>
            <span className="field-label">{label}</span>
            <input
              className="form-control"
              name={key}
              defaultValue={product[key] ?? ""}
              maxLength={max}
              required={key !== "model"}
            />
          </label>
        ))}
        <label className="field-wide">
          <span className="field-label">Description</span>
          <textarea
            className="form-control"
            name="description"
            defaultValue={product.description}
            maxLength={4000}
            rows={5}
          />
        </label>
        <label className="field-wide">
          <span className="field-label">
            Specifications (JSON; null means not confirmed)
          </span>
          <textarea
            className="form-control code-display"
            name="specs"
            defaultValue={JSON.stringify(product.specs, null, 2)}
            maxLength={10000}
            rows={12}
          />
        </label>
        <label>
          <span className="field-label">Publication</span>
          <select
            name="status"
            className="form-control"
            defaultValue={product.status}
          >
            <option value="draft">Draft</option>
            <option value="published">Published</option>
            <option value="archived">Archived</option>
          </select>
        </label>
      </div>
      <button className="button" disabled={pending}>
        {pending ? "Saving…" : "Save product"}
      </button>
      <Result state={state} />
    </form>
  );
}
