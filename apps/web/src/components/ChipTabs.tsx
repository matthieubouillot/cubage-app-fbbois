import { twMerge } from "tailwind-merge";

type Tab = { id: string; label: string; hint?: string };

export default function ChipTabs({
  tabs, activeId, onChange, className = "",
}: { tabs: Tab[]; activeId: string; onChange: (id: string)=>void; className?: string }) {
  return (
    <div className={twMerge("flex gap-2 overflow-x-auto pb-2 -mx-2 px-2 justify-center", className)}>
      {tabs.map(t => {
        const active = t.id === activeId;
        return (
          <button
            key={t.id}
            onClick={() => onChange(t.id)}
            title={t.hint}
            className={twMerge(
              "shrink-0 rounded-full px-3 py-1.5 text-sm border transition focus:outline-none focus-visible:ring-2 focus-visible:ring-black/30",
              active
                ? "bg-black text-white border-black shadow-sm"
                : "bg-white text-gray-800 border-gray-300 hover:border-gray-400"
            )}
          >
            {t.label}
          </button>
        );
      })}
    </div>
  );
}