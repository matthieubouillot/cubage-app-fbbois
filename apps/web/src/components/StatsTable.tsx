import React from "react";
import { twMerge } from "tailwind-merge";
import type { SaisieStats } from "../features/saisies/api";

export default function StatsTable({
  stats,
  className = "",
}: {
  stats: SaisieStats | null;
  className?: string;
}) {
  // largeur commune desktop (même que SaisieTab)
  const widthClass = "w-full md:w-[850px]";

  const fmt = (n?: number) =>
    (n ?? 0).toLocaleString("fr-FR", {
      minimumFractionDigits: 3,
      maximumFractionDigits: 3,
    });

  return (
    <div className={twMerge("mx-auto", widthClass, className)}>
      <div className="overflow-x-auto bg-white rounded-xl border shadow-sm">
        <table className="w-full text-sm table-fixed">
          {/* Même largeur pour chaque colonne (y compris la 1ère étiquette) */}
          <colgroup>
            <col className="w-[22%]" />
            <col className="w-[19.5%]" />
            <col className="w-[19.5%]" />
            <col className="w-[19.5%]" />
            <col className="w-[19.5%]" />
          </colgroup>

          <thead className="bg-gray-50">
            <tr className="text-center">
              <th className="px-3 py-2 border-b text-gray-600 font-medium"></th>
              <th className="px-3 py-2 border-b text-gray-600 font-medium">
                vol. &lt; V1
              </th>
              <th className="px-3 py-2 border-b text-gray-600 font-medium">
                V1 ≤ vol. &lt; V2
              </th>
              <th className="px-3 py-2 border-b text-gray-600 font-medium">
                vol. ≥ V2
              </th>
              <th className="px-3 py-2 border-b text-gray-600 font-medium">
                Total
              </th>
            </tr>
          </thead>

          <tbody>
            <tr className="text-center">
              <td className="px-3 py-2 border-b text-left">V. total</td>
              <td className="px-3 py-2 border-b tabular-nums">
                {fmt(stats?.columns.ltV1.sum)} m³
              </td>
              <td className="px-3 py-2 border-b tabular-nums">
                {fmt(stats?.columns.between.sum)} m³
              </td>
              <td className="px-3 py-2 border-b tabular-nums">
                {fmt(stats?.columns.geV2.sum)} m³
              </td>
              <td className="px-3 py-2 border-b tabular-nums">
                {fmt(stats?.total.sum)} m³
              </td>
            </tr>
            <tr className="text-center">
              <td className="px-3 py-2 border-b text-left">Nb.</td>
              <td className="px-3 py-2 border-b">
                {stats?.columns.ltV1.count ?? 0}
              </td>
              <td className="px-3 py-2 border-b">
                {stats?.columns.between.count ?? 0}
              </td>
              <td className="px-3 py-2 border-b">
                {stats?.columns.geV2.count ?? 0}
              </td>
              <td className="px-3 py-2 border-b">{stats?.total.count ?? 0}</td>
            </tr>
            <tr className="text-center">
              <td className="px-3 py-2 text-left">V. moy</td>
              <td className="px-3 py-2 tabular-nums">
                {fmt(stats?.columns.ltV1.avg)} m³
              </td>
              <td className="px-3 py-2 tabular-nums">
                {fmt(stats?.columns.between.avg)} m³
              </td>
              <td className="px-3 py-2 tabular-nums">
                {fmt(stats?.columns.geV2.avg)} m³
              </td>
              <td className="px-3 py-2 tabular-nums">
                {fmt(stats?.total.avg)} m³
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
