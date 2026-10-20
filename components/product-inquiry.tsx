"use client";
import {
  createContext,
  useContext,
  useState,
  type Dispatch,
  type SetStateAction,
  type ReactNode,
} from "react";
type Inquiry = { name: string; sku: string; specifications: string[] } | null;
const Context = createContext<{
  product: Inquiry;
  setProduct: Dispatch<SetStateAction<Inquiry>>;
} | null>(null);
export function ProductInquiryProvider({ children }: { children: ReactNode }) {
  const [product, setProduct] = useState<Inquiry>(null);
  return (
    <Context.Provider value={{ product, setProduct }}>
      {children}
    </Context.Provider>
  );
}
export function useProductInquiry() {
  const value = useContext(Context);
  if (!value) throw new Error("Product inquiry provider missing");
  return value;
}
