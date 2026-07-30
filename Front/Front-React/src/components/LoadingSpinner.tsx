import { ClipLoader } from "react-spinners";

type LoadingSpinnerProps = {
  loading: boolean;
  variant?: "page" | "inline" | "button";
  label?: string;
  size?: number;
};

const accentColor = "#6366f1";

export function LoadingSpinner({
  loading,
  variant = "page",
  label = "Carregando...",
  size,
}: LoadingSpinnerProps) {
  if (!loading) return null;

  const loaderSize =
    size ?? (variant === "button" ? 16 : variant === "inline" ? 28 : 40);

  if (variant === "button") {
    return (
      <ClipLoader
        color={accentColor}
        size={loaderSize}
        aria-label={label}
        data-testid="loading-spinner"
      />
    );
  }

  return (
    <div
      className={variant === "inline" ? "py-4" : "flex justify-center py-12"}
      aria-busy="true"
      data-testid="loading-spinner"
    >
      <ClipLoader color={accentColor} size={loaderSize} aria-label={label} />
      <span className="sr-only">{label}</span>
    </div>
  );
}
