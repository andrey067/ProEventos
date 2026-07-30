import { usePrefersReducedMotion } from "./usePrefersReducedMotion";

type Props = { rows?: number; className?: string };

export function SkeletonShimmer({ rows = 4, className }: Props) {
  const reduced = usePrefersReducedMotion();
  return (
    <div className={className ?? "flex flex-col gap-3"} aria-hidden="true">
      {Array.from({ length: rows }, (_, i) => (
        <div
          key={i}
          className={
            reduced
              ? "h-10 rounded-[length:var(--radius-control)] bg-line"
              : "motion-skeleton h-10 rounded-[length:var(--radius-control)]"
          }
        />
      ))}
    </div>
  );
}
