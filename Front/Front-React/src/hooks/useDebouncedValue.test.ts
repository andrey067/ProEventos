import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useDebouncedValue } from "./useDebouncedValue";

describe("useDebouncedValue", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("returns the initial value immediately", () => {
    const { result } = renderHook(() => useDebouncedValue("a", 350));
    expect(result.current).toBe("a");
  });

  it("updates only after the delay", () => {
    const { result, rerender } = renderHook(
      ({ value }) => useDebouncedValue(value, 350),
      { initialProps: { value: "" } },
    );

    rerender({ value: "react" });
    expect(result.current).toBe("");

    act(() => {
      vi.advanceTimersByTime(349);
    });
    expect(result.current).toBe("");

    act(() => {
      vi.advanceTimersByTime(1);
    });
    expect(result.current).toBe("react");
  });

  it("resets the timer when value changes before delay elapses", () => {
    const { result, rerender } = renderHook(
      ({ value }) => useDebouncedValue(value, 350),
      { initialProps: { value: "" } },
    );

    rerender({ value: "r" });
    act(() => {
      vi.advanceTimersByTime(200);
    });
    rerender({ value: "re" });
    act(() => {
      vi.advanceTimersByTime(200);
    });
    expect(result.current).toBe("");

    act(() => {
      vi.advanceTimersByTime(150);
    });
    expect(result.current).toBe("re");
  });

  it("uses 350ms by default", () => {
    const { result, rerender } = renderHook(
      ({ value }) => useDebouncedValue(value),
      { initialProps: { value: "a" } },
    );

    rerender({ value: "ab" });
    act(() => {
      vi.advanceTimersByTime(349);
    });
    expect(result.current).toBe("a");
    act(() => {
      vi.advanceTimersByTime(1);
    });
    expect(result.current).toBe("ab");
  });
});
