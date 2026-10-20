import test from "node:test";
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { existsSync } from "node:fs";
import { clients } from "../lib/proof";

// lib/proof reads NEXT_PUBLIC_LAUNCH_READY at import time, so each mode runs in its own process.
function proofIn(launch: boolean) {
  const out = execFileSync(
    process.execPath,
    ["--import", "tsx", "-e", "import('./lib/proof.ts').then(m => console.log(JSON.stringify(m.testimonials.map(t => t.sample))))"],
    { cwd: process.cwd(), env: { ...process.env, NEXT_PUBLIC_LAUNCH_READY: launch ? "true" : "" } },
  );
  return JSON.parse(out.toString().trim()) as boolean[];
}

test("sample testimonials show in preview and are removed at launch", () => {
  assert.ok(proofIn(false).some(Boolean), "preview shows the marked samples");
  assert.equal(proofIn(true).filter(Boolean).length, 0, "launch build carries no sample testimonials");
});

test("every client has a processed logo file", () => {
  for (const c of clients) assert.ok(existsSync(`public${c.logo}`), `${c.name} logo missing`);
});
