"use client";
import { useActionState } from "react";
import {
  saveStatus,
  addNote,
  saveProduct,
  retryEmail,
} from "@/app/admin/actions";
function Result({ state }: { state: { error?: string; success?: string } }) {
  return state.error ? (
    <p className="form-error" role="alert">
      {state.error}
    </p>
  ) : state.success ? (
    <p className="admin-notice" role="status">
      {state.success}
    </p>
  ) : null;
}
export function StatusForm({ id, status }: { id: string; status: string }) {
  const [state, action, pending] = useActionState(saveStatus, {});
  return (
    <form action={action}>
      <input type="hidden" name="id" value={id} />
      <label className="field-label" htmlFor="lead-status">
        Status
      </label>
      <select
        className="form-control"
        id="lead-status"
        name="status"
        defaultValue={status}
      >
        {["new", "contacted", "quoted", "won", "lost"].map((s) => (
          <option key={s} value={s}>
            {s[0].toUpperCase() + s.slice(1)}
          </option>
        ))}
      </select>
      <button className="button button-small" disabled={pending}>
        {pending ? "Saving…" : "Save status"}
      </button>
      <Result state={state} />
    </form>
  );
}
export function NoteForm({ id }: { id: string }) {
  const [state, action, pending] = useActionState(addNote, {});
  return (
    <form action={action}>
      <input type="hidden" name="id" value={id} />
      <label className="field-label" htmlFor="lead-note">
        Add an internal note
      </label>
      <textarea
        className="form-control"
        id="lead-note"
        name="body"
        rows={4}
        maxLength={2000}
        required
      />
      <button className="button button-small" disabled={pending}>
        {pending ? "Saving…" : "Add note"}
      </button>
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
