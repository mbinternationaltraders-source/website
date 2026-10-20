export type Unit = "pcs" | "kg" | "m";

export type Variant = {
  sku: string;
  name: string;
  units: Unit[];
  minQty: number | null;
};

export type Spec = { label: string; value: string | null };

export type Product = {
  slug: string;
  family: string;
  name: string;
  model: string | null;
  modelNote: string;
  summary: string;
  description: string;
  cardSpecs: string[];
  specs: Spec[];
  specNote: string | null;
  industries: string[];
  variants: Variant[];
  updatedAt: string;
};

export type Industry = {
  slug: string;
  name: string;
  headline: string;
  intro: string;
  guidance: { title: string; body: string }[];
};
