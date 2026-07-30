import { describe, expect, it } from "vitest";
import {
  formatDateBr,
  parseDateBr,
  parseLoteDate,
  toApiDate,
  toDateInputValue,
} from "./date";

describe("date utils", () => {
  it("formats Date and BR/ISO/legacy strings", () => {
    expect(formatDateBr(new Date(2026, 0, 15))).toBe("15/01/2026");
    expect(formatDateBr("15/01/2026")).toBe("15/01/2026");
    expect(formatDateBr("2026-01-15")).toBe("15/01/2026");
    expect(formatDateBr("15-01-2026")).toBe("15/01/2026");
    expect(formatDateBr("")).toBe("");
    expect(formatDateBr("invalid")).toBe("invalid");
  });

  it("parses BR dates and rejects invalid values", () => {
    expect(parseDateBr("31/12/2026")?.getFullYear()).toBe(2026);
    expect(parseDateBr("32/01/2026")).toBeNull();
    expect(parseDateBr("")).toBeNull();
  });

  it("parses API BR datetime with time suffix", () => {
    expect(parseDateBr("15/12/2027 00:00:00")?.getDate()).toBe(15);
    expect(toDateInputValue("15/12/2027 00:00:00")).toBe("2027-12-15");
    expect(formatDateBr("15/12/2027 00:00:00")).toBe("15/12/2027");
  });

  it("converts to API and date-input values", () => {
    expect(toApiDate("15/01/2026")).toBe("2026-01-15");
    expect(toApiDate("2026-02-20T00:00:00")).toBe("2026-02-20");
    expect(toApiDate(new Date(2026, 1, 20))).toBe("2026-02-20");
    expect(toApiDate("")).toBe("");
    expect(toDateInputValue("15/01/2026")).toBe("2026-01-15");
  });

  it("parseLoteDate accepts BR and ISO", () => {
    expect(parseLoteDate("01/01/2026")?.getDate()).toBe(1);
    expect(parseLoteDate("2026-01-01")?.getMonth()).toBe(0);
    expect(parseLoteDate("01-01-2026")?.getFullYear()).toBe(2026);
    expect(parseLoteDate("32-01-2026")).toBeNull();
    expect(parseLoteDate("2026-02-31")).toBeNull();
  });

  it("toApiDate returns trimmed value when parse fails", () => {
    expect(toApiDate("not-a-date")).toBe("not-a-date");
    expect(formatDateBr(new Date(Number.NaN))).toBe("");
  });
});
