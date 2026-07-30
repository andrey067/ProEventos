export type DebouncedFn<T extends (...args: never[]) => void> = ((
  ...args: Parameters<T>
) => void) & {
  cancel: () => void;
};

/** Schedules `fn` after `waitMs` of idle; later calls reset the timer. */
export function debounce<T extends (...args: never[]) => void>(
  fn: T,
  waitMs: number,
): DebouncedFn<T> {
  let timer: ReturnType<typeof setTimeout> | null = null;

  const debounced = ((...args: Parameters<T>) => {
    if (timer != null) clearTimeout(timer);
    timer = setTimeout(() => {
      timer = null;
      fn(...args);
    }, waitMs);
  }) as DebouncedFn<T>;

  debounced.cancel = () => {
    if (timer != null) {
      clearTimeout(timer);
      timer = null;
    }
  };

  return debounced;
}
