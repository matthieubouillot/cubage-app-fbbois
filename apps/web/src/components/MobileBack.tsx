import { useNavigate } from "react-router-dom";
import { twMerge } from "tailwind-merge";

export default function MobileBack({
  fallback = "/",
  onBack,
  variant = "fixed", // "inline" (dans le flux) ou "fixed" (flottant)
  className = "",
}: {
  /** URL de repli si pas d'historique */
  fallback?: string;
  /** Callback custom */
  onBack?: () => void;
  variant?: "inline" | "fixed";
  className?: string;
}) {
  const nav = useNavigate();

  function goBack() {
    if (onBack) return onBack();
    nav(fallback, { replace: true });
  }

  // Même style/tailles que les autres boutons ronds (30x30)
  const baseBtn =
    "inline-flex items-center justify-center rounded-full bg-white text-gray-900 " +
    "border border-gray-300 w-[36px] h-[36px] shadow-sm active:scale-[0.98]";

  if (variant === "fixed") {
    return (
      <div
        className={twMerge(
          "md:hidden fixed z-40 left-3 top-[calc(env(safe-area-inset-top,0)+56px+8px)]",
          className,
        )}
      >
        <button
          type="button"
          onClick={goBack}
          aria-label="Retour"
          className={baseBtn + " backdrop-blur"}
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
      </div>
    );
  }

  return (
    <div className={twMerge("md:hidden", className)}>
      <button
        type="button"
        onClick={goBack}
        aria-label="Retour"
        className={baseBtn}
      >
        <ChevronLeft className="h-4 w-4" />
      </button>
    </div>
  );
}

function ChevronLeft({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 20 20" fill="none" className={className}>
      <path
        d="M12.5 4.5L7.5 10l5 5.5"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}