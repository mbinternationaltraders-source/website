"use client";
import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { z } from "zod";
import { itemSchema } from "./quote-schema";
const basketSchema = z.array(itemSchema).max(50);
export type BasketItem = z.infer<typeof itemSchema>;
type BasketContext = {
  items: BasketItem[];
  ready: boolean;
  add: (item: BasketItem) => boolean;
  update: (sku: string, unit: string, patch: Partial<BasketItem>) => void;
  remove: (sku: string, unit: string) => void;
  clear: () => void;
  notice: string;
};
const Context = createContext<BasketContext | null>(null);
const KEY = "mb-quote-v1";
export function BasketProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<BasketItem[]>([]);
  const [ready, setReady] = useState(false);
  const [notice, setNotice] = useState("");
  useEffect(() => {
    try {
      const parsed = basketSchema.safeParse(
        JSON.parse(localStorage.getItem(KEY) || "[]"),
      );
      // Hydrate validated browser storage after the empty server snapshot.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      if (parsed.success) setItems(parsed.data);
    } catch {}
    setReady(true);
  }, []);
  useEffect(() => {
    if (ready)
      try {
        localStorage.setItem(KEY, JSON.stringify(items));
      } catch {}
  }, [items, ready]);
  useEffect(() => {
    if (!notice) return;
    const id = setTimeout(() => setNotice(""), 5000);
    return () => clearTimeout(id);
  }, [notice]);
  function add(item: BasketItem) {
    const result = itemSchema.safeParse(item);
    if (!result.success) return false;
    const exists = items.find(
      (i) => i.sku === item.sku && i.unit === item.unit,
    );
    if (!exists && items.length >= 50) {
      setNotice(
        "Your quote has 50 items. Please send this request before adding more.",
      );
      return false;
    }
    if (exists && exists.quantity + item.quantity > 10000000) {
      setNotice("Please reduce this quantity.");
      return false;
    }
    setItems((current) => {
      const match = current.find(
        (i) => i.sku === item.sku && i.unit === item.unit,
      );
      return match
        ? current.map((i) =>
            i === match ? { ...i, quantity: i.quantity + item.quantity } : i,
          )
        : [...current, item];
    });
    setNotice("Added to your quote.");
    return true;
  }
  function update(sku: string, unit: string, patch: Partial<BasketItem>) {
    setItems((current) =>
      current.map((i) => {
        if (i.sku !== sku || i.unit !== unit) return i;
        const p = itemSchema.safeParse({ ...i, ...patch });
        return p.success ? p.data : i;
      }),
    );
  }
  return (
    <Context.Provider
      value={{
        items,
        ready,
        add,
        update,
        remove: (sku, unit) =>
          setItems(items.filter((i) => !(i.sku === sku && i.unit === unit))),
        clear: () => setItems([]),
        notice,
      }}
    >
      {children}
      <div className="toast" role="status" aria-live="polite">
        {notice}
      </div>
    </Context.Provider>
  );
}
export function useBasket() {
  const value = useContext(Context);
  if (!value) throw new Error("Basket provider missing");
  return value;
}
