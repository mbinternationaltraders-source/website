"use client";
import { Printer } from "lucide-react";

// The browser's print dialog also offers "Save as PDF".
export function PrintButton() {
  return (
    <button type="button" className="ad-btn ad-btn-dark" onClick={() => window.print()}>
      <Printer size={15} aria-hidden="true" /> Print or save PDF
    </button>
  );
}
