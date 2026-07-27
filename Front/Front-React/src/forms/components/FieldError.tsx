import type { FieldError as RHFFieldError } from "react-hook-form";

interface FieldErrorProps {
  error?: RHFFieldError;
}

export function FieldError({ error }: FieldErrorProps) {
  if (!error?.message) return null;
  return <span className="text-xs text-danger">{error.message}</span>;
}
