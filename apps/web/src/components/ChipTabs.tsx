import { useEffect, useRef } from "react";
import { twMerge } from "tailwind-merge";

type Tab = { id: string; label: string; hint?: string };

export default function ChipTabs({
  tabs,
  activeId,
  onChange,
  className = "",
}: {
  tabs: Tab[];
  activeId: string;
  onChange: (id: string) => void;
  className?: string;
}) {
  // pour que le chip actif soit bien aligné en vue desktop (snap)
  const rowRef = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    const el = rowRef.current;
    if (!el) return;
    const active = el.querySelector<HTMLButtonElement>(
      'button[data-active="true"]',
    );
    if (active) {
      // scrollIntoView doux, évite le "glitch initial"
      active.scrollIntoView({ inline: "center", block: "nearest" });
    }
  }, [activeId, tabs.length]);

  return (
    <>
      {/* MOBILE: un seul bouton (onglet actif) + feuille pour choisir */}
      <MobileCompact
        tabs={tabs}
        activeId={activeId}
        onChange={onChange}
        className={className}
      />

      {/* DESKTOP: rangée de chips centrées, sans scrollbar visible */}
      <div
        className={twMerge(
          "hidden md:flex overflow-x-auto no-scrollbar snap-x snap-mandatory",
          "px-2",
          className,
        )}
        ref={rowRef}
        role="tablist"
        aria-label="Qualités"
      >
        <div className="mx-auto flex flex-nowrap gap-2">
          {tabs.map((t) => {
            const active = t.id === activeId;
            return (
              <button
                key={t.id}
                data-active={active ? "true" : "false"}
                onClick={() => onChange(t.id)}
                title={t.hint}
                role="tab"
                aria-selected={active}
                className={twMerge(
                  "shrink-0 rounded-full px-3 py-1.5 text-sm border transition",
                  "focus:outline-none focus-visible:ring-2 focus-visible:ring-black/30",
                  "snap-center",
                  active
                    ? "bg-black text-white border-black shadow-sm"
                    : "bg-white text-gray-800 border-gray-300 hover:border-gray-400",
                )}
              >
                {t.label}
              </button>
            );
          })}
        </div>
      </div>
    </>
  );
}

/* ───────────────── MOBILE COMPACT ──────────────── */
function MobileCompact({
  tabs,
  activeId,
  onChange,
  className = "",
}: {
  tabs: Tab[];
  activeId: string;
  onChange: (id: string) => void;
  className?: string;
}) {
  const active = tabs.find((t) => t.id === activeId) ?? tabs[0];
  const dialogRef = useRef<HTMLDivElement | null>(null);

  function open() {
    dialogRef.current?.classList.remove("pointer-events-none", "opacity-0");
  }
  function close() {
    dialogRef.current?.classList.add("pointer-events-none", "opacity-0");
  }

  return (
    <div className={twMerge("md:hidden", className)}>
      {/* Bouton affichant uniquement l’onglet actif */}
      <button
        type="button"
        onClick={open}
        className={twMerge(
          "mx-auto flex items-center gap-2 rounded-full border px-3 py-1.5 text-sm",
          "bg-white text-gray-900 border-gray-300 shadow-sm active:scale-[0.99]",
        )}
        aria-haspopup="dialog"
        aria-expanded="false"
        aria-label="Changer de qualité"
        title={active?.hint}
      >
        <span className="truncate max-w-[60vw]">{active?.label}</span>
        <ChevronDown className="h-4 w-4" />
      </button>

      {/* Feuille (bottom-sheet) */}
      <div
        ref={dialogRef}
        className={twMerge(
          "fixed inset-0 z-40 opacity-0 pointer-events-none transition-opacity",
        )}
        aria-hidden
      >
        <div className="absolute inset-0 bg-black/40" onClick={close} />
        <div className="absolute left-0 right-0 bottom-0 rounded-t-2xl bg-white shadow-2xl p-4">
          <div className="mx-auto h-1 w-10 rounded-full bg-gray-300 mb-3" />
          <h3 className="text-center text-sm font-medium mb-2">
            Choisir une qualité
          </h3>
          <div className="grid grid-cols-1 gap-2 max-h-[60vh] overflow-auto px-1">
            {tabs.map((t) => {
              const active = t.id === activeId;
              return (
                <button
                  key={t.id}
                  onClick={() => {
                    onChange(t.id);
                    close();
                  }}
                  className={twMerge(
                    "w-full text-left rounded-xl border px-3 py-2",
                    active
                      ? "border-black bg-black text-white"
                      : "border-gray-300 bg-white text-gray-900 hover:bg-gray-50",
                  )}
                >
                  <div className="text-sm">{t.label}</div>
                  {t.hint && (
                    <div className="text-xs text-gray-500 mt-0.5">{t.hint}</div>
                  )}
                </button>
              );
            })}
          </div>
          <div className="mt-3 flex justify-end">
            <button
              onClick={close}
              className="rounded-full border px-4 py-1.5 text-sm hover:bg-gray-50"
            >
              Fermer
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ───────── petites icônes ───────── */
function ChevronDown({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 20 20" className={className} fill="none">
      <path
        d="M5 7.5l5 5 5-5"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/* Hide scrollbar util (Chrome/Safari/Firefox) */
declare global {
  interface CSSStyleSheet {}
}
// CSS util à mettre une fois dans ton global.css si tu préfères :
// .no-scrollbar::-webkit-scrollbar { display: none; }
// .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
