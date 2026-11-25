"use client";
import { useActionState, useState, useTransition } from "react";
import { Plus, Trash2 } from "lucide-react";
import { saveVariants, uploadPhoto, deletePhoto } from "@/app/admin/actions";

type Unit = "pcs" | "kg" | "m";
type Row = { sku: string; name: string; units: Unit[]; min_qty: number | null; status: "draft" | "published" | "archived"; isNew?: boolean };
const UNITS: [Unit, string][] = [["pcs", "Pieces"], ["kg", "Kg"], ["m", "Metres"]];

function Msg({ state }: { state: { error?: string; success?: string } }) {
  if (state.error) return <p className="ad-msg" data-tone="down" role="alert">{state.error}</p>;
  if (state.success) return <p className="ad-msg" data-tone="up" role="status">{state.success}</p>;
  return null;
}

// Existing SKUs are fixed (old quotes point at them); archive a variant to hide it instead of deleting.
export function VariantsEditor({ productId, initial }: { productId: string; initial: Omit<Row, "isNew">[] }) {
  const [rows, setRows] = useState<Row[]>(initial);
  const [state, setState] = useState<{ error?: string; success?: string }>({});
  const [pending, start] = useTransition();
  const set = (i: number, patch: Partial<Row>) => setRows((r) => r.map((row, n) => (n === i ? { ...row, ...patch } : row)));
  const save = () =>
    start(async () => {
      const r = await saveVariants(productId, rows.map(({ isNew: _, ...row }) => row)); // eslint-disable-line @typescript-eslint/no-unused-vars
      setState(r);
      if (r.success) setRows((all) => all.map((row) => ({ ...row, isNew: false })));
    });
  return (
    <div className="ad-form">
      <div className="ad-table-wrap">
        <table className="ad-table">
          <thead>
            <tr><th scope="col">SKU</th><th scope="col">Name</th><th scope="col">Units</th><th scope="col">Min. order</th><th scope="col">Status</th></tr>
          </thead>
          <tbody>
            {rows.map((r, i) => (
              <tr key={i}>
                <td>
                  {r.isNew
                    ? <input className="ad-input" aria-label="SKU" value={r.sku} onChange={(e) => set(i, { sku: e.target.value })} placeholder="e.g. LH1030" />
                    : <span className="ad-mono">{r.sku}</span>}
                </td>
                <td><input className="ad-input" aria-label={`Name for ${r.sku || "new variant"}`} value={r.name} onChange={(e) => set(i, { name: e.target.value })} /></td>
                <td>
                  <span className="ad-checks">
                    {UNITS.map(([u, label]) => (
                      <label key={u}>
                        <input type="checkbox" checked={r.units.includes(u)}
                          onChange={(e) => set(i, { units: e.target.checked ? [...r.units, u] : r.units.filter((x) => x !== u) })} />
                        {label}
                      </label>
                    ))}
                  </span>
                </td>
                <td>
                  <input className="ad-input ad-input-sm" aria-label={`Minimum order for ${r.sku || "new variant"}`} type="number" min={0} value={r.min_qty ?? ""}
                    onChange={(e) => set(i, { min_qty: e.target.value === "" ? null : Number(e.target.value) })} placeholder="—" />
                </td>
                <td>
                  <select className="ad-input" aria-label={`Status for ${r.sku || "new variant"}`} value={r.status} onChange={(e) => set(i, { status: e.target.value as Row["status"] })}>
                    <option value="published">Published</option>
                    <option value="draft">Draft</option>
                    <option value="archived">Archived</option>
                  </select>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="ad-form-row">
        <button type="button" className="ad-btn" onClick={() => setRows((r) => [...r, { sku: "", name: "", units: ["pcs"], min_qty: null, status: "published", isNew: true }])}>
          <Plus size={15} aria-hidden="true" /> Add variant
        </button>
        <button type="button" className="ad-btn ad-btn-dark" onClick={save} disabled={pending}>{pending ? "Saving…" : "Save variants"}</button>
      </div>
      <Msg state={state} />
    </div>
  );
}

export function PhotoManager({ productId, photos }: { productId: string; photos: { id: string; url: string; alt: string }[] }) {
  const [state, action, pending] = useActionState(uploadPhoto, {});
  const [removing, start] = useTransition();
  const [removeMsg, setRemoveMsg] = useState<{ error?: string; success?: string }>({});
  return (
    <div className="ad-form">
      {photos.length ? (
        <ul className="ad-photos">
          {photos.map((p) => (
            <li key={p.id}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={p.url} alt={p.alt} width={160} height={160} loading="lazy" />
              <button type="button" className="ad-icon-btn" aria-label={`Remove photo: ${p.alt}`} disabled={removing}
                onClick={() => confirm("Remove this photo from the website?") && start(async () => setRemoveMsg(await deletePhoto(p.id)))}>
                <Trash2 size={15} />
              </button>
            </li>
          ))}
        </ul>
      ) : <p className="ad-empty">No uploaded photos yet. They appear after the built-in photos on the product page.</p>}
      <Msg state={removeMsg} />
      <form action={action} className="ad-form">
        <input type="hidden" name="productId" value={productId} />
        <div className="ad-fields">
          <label>
            <span>Photo (JPEG, PNG or WebP, up to 5 MB)</span>
            <input className="ad-input" type="file" name="photo" accept="image/jpeg,image/png,image/webp" required />
          </label>
          <label>
            <span>Describe the photo</span>
            <input className="ad-input" name="alt" required minLength={3} maxLength={200} placeholder="e.g. LH1020 pump, side view with cable" />
          </label>
        </div>
        <div className="ad-form-row">
          <span className="ad-muted">The description helps blind visitors and Google.</span>
          <button className="ad-btn ad-btn-dark" disabled={pending}>{pending ? "Uploading…" : "Upload photo"}</button>
        </div>
        <Msg state={state} />
      </form>
    </div>
  );
}
