import { describe, expect, it } from "vitest";
import { formatDateBr, parseDateBr, toApiDate, toDateInputValue } from "./date";

describe("date utils", () => {
  it("formats supported date inputs", () => {
    expect(formatDateBr(new Date(2026, 2, 5))).toBe("05/03/2026");
    expect(formatDateBr("05/03/2026")).toBe("05/03/2026");
    expect(formatDateBr("2026-03-05")).toBe("05/03/2026");
    expect(formatDateBr("05-03-2026")).toBe("05/03/2026");
    expect(formatDateBr(null)).toBe("");
  });

  it("parses BR dates", () => {
    expect(parseDateBr("29/02/2024")?.getMonth()).toBe(1);
    expect(parseDateBr("31/02/2024")).toBeNull();
  });

  it("parses API BR datetime with time suffix", () => {
    expect(parseDateBr("15/12/2027 00:00:00")?.getDate()).toBe(15);
    expect(toDateInputValue("15/12/2027 00:00:00")).toBe("2027-12-15");
    expect(formatDateBr("15/12/2027 00:00:00")).toBe("15/12/2027");
  });

  it("converts to API and input values", () => {
    expect(toApiDate("05/03/2026")).toBe("2026-03-05");
    expect(toApiDate("2026-03-05T12:00:00")).toBe("2026-03-05");
    expect(toDateInputValue("05/03/2026")).toBe("2026-03-05");
    expect(toApiDate(new Date(NaN))).toBe("");
  });
});
