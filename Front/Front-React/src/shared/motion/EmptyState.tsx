import { AnimatePresence, motion } from "motion/react";
import type { ReactNode } from "react";
import { usePrefersReducedMotion } from "./usePrefersReducedMotion";

type Props = { show: boolean; children: ReactNode; className?: string };

export function EmptyState({ show, children, className }: Props) {
  const reduced = usePrefersReducedMotion();
  return (
    <AnimatePresence>
      {show ? (
        <motion.div
          className={className}
          initial={reduced ? false : { opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={reduced ? undefined : { opacity: 0 }}
          transition={{ duration: reduced ? 0 : 0.22 }}
        >
          {children}
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
