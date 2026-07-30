import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { debounce } from "./debounce";

describe("debounce", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("invokes fn only after waitMs idle", () => {
    const fn = vi.fn();
    const debounced = debounce(fn, 350);

    debounced();
    expect(fn).not.toHaveBeenCalled();

    vi.advanceTimersByTime(349);
    expect(fn).not.toHaveBeenCalled();

    vi.advanceTimersByTime(1);
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it("resets the timer on repeated calls", () => {
    const fn = vi.fn();
    const debounced = debounce(fn, 350);

    debounced();
    vi.advanceTimersByTime(200);
    debounced();
    vi.advanceTimersByTime(200);
    expect(fn).not.toHaveBeenCalled();

    vi.advanceTimersByTime(150);
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it("cancel prevents a pending invocation", () => {
    const fn = vi.fn();
    const debounced = debounce(fn, 350);

    debounced();
    debounced.cancel();
    vi.advanceTimersByTime(350);

    expect(fn).not.toHaveBeenCalled();
  });

  it("forwards the latest arguments", () => {
    const fn = vi.fn();
    const debounced = debounce(fn as (value: string) => void, 350);

    debounced("a");
    debounced("ab");
    vi.advanceTimersByTime(350);

    expect(fn).toHaveBeenCalledWith("ab");
  });
});
