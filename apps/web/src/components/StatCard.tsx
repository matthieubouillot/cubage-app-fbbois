import { twMerge } from "tailwind-merge";

type Props = {
  label: string;
  value: string;
  suffix?: string;
  tone?: "default" | "soft";
};

export function StatCard({ label, value, suffix, tone = "default" }: Props) {
  return (
    <div
      className={twMerge(
        "p-3 rounded-lg border text-center",
        tone === "soft" ? "bg-gray-50 border-gray-200" : "bg-white border-gray-300"
      )}
    >
      <div className="text-xs text-gray-500">{label}</div>
      <div className="text-lg font-semibold">
        {value} {suffix}
      </div>
    </div>
  );
}