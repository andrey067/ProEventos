import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

describe("motion tokens css", () => {
  it("defines shared motion variables in index.css", () => {
    const css = readFileSync(resolve(__dirname, "../../index.css"), "utf8");
    for (const token of [
      "--motion-fast",
      "--motion-base",
      "--motion-slow",
      "--motion-ease",
      "--motion-ease-exit",
      "--motion-stagger",
    ]) {
      expect(css).toContain(token);
    }
    expect(css).toContain("prefers-reduced-motion");
    expect(css).toContain(".motion-press");
    expect(css).toContain(".motion-skeleton");
  });
});
