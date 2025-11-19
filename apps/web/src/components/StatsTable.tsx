import React from "react";
import { twMerge } from "tailwind-merge";
import type { SaisieStats } from "../features/saisies/api";



export default function StatsTable({
  stats,
  globalStats,
  userStats,
  className = "",
  todayUser,
  isSupervisor = false,
}: {
  stats: SaisieStats | null;
  globalStats?: SaisieStats | null; // Stats globales (pour "V. total (tous)")
  userStats?: SaisieStats | null; // Stats du bûcheron connecté (pour "V. total")
  className?: string;
  todayUser?: { ltV1: number; between: number; geV2: number; total: number } | null;
  isSupervisor?: boolean;
}) {
  const fmt = (n?: number) =>
    (n ?? 0).toLocaleString("fr-FR", {
      minimumFractionDigits: 3,
      maximumFractionDigits: 3,
    });


  return (
    <div className={twMerge("mx-auto", "w-full md:w-[650px]", className)}>
      <div className="overflow-x-auto bg-white rounded-xl border shadow-sm">
        <table className="w-full text-sm table-fixed">
          {/* colonnes fixes pour garder un rendu propre */}
          <colgroup>
            <col className="w-[22%]" />
            <col className="w-[19.5%]" />
            <col className="w-[19.5%]" />
            <col className="w-[19.5%]" />
            <col className="w-[19.5%]" />
          </colgroup>

          <thead className="bg-gray-50">
            <tr className="text-center">
              <th className="px-3 py-2 border-b border-gray-200 text-black font-medium"></th>
              <th className="px-3 py-2 border-b border-gray-200 text-black font-medium">
                vol. &lt; V1
              </th>
              <th className="px-3 py-2 border-b border-gray-200 text-black font-medium">
                V1 ≤ vol. &lt; V2
              </th>
              <th className="px-3 py-2 border-b border-gray-200 text-black font-medium">
                vol. ≥ V2
              </th>
              <th className="px-3 py-2 border-b border-gray-200 text-black font-medium">
                Total
              </th>
            </tr>
          </thead>

          <tbody>
            {/* Ordre: V. total (tous), V. total, Nb., V. moy, V. jour */}
            {!isSupervisor && (
              <tr className="text-center">
                <td className="px-3 py-2 border-b border-gray-200 text-left">V. total (tous)</td>
                <td className="px-3 py-2 border-b border-gray-200 tabular-nums">{fmt(globalStats?.columns.ltV1.sum ?? stats?.columns.ltV1.sum)} m³</td>
                <td className="px-3 py-2 border-b border-gray-200 tabular-nums">{fmt(globalStats?.columns.between.sum ?? stats?.columns.between.sum)} m³</td>
                <td className="px-3 py-2 border-b border-gray-200 tabular-nums">{fmt(globalStats?.columns.geV2.sum ?? stats?.columns.geV2.sum)} m³</td>
                <td className="px-3 py-2 border-b border-gray-200 tabular-nums">{fmt(globalStats?.total.sum ?? stats?.total.sum)} m³</td>
              </tr>
            )}
            <tr className="text-center">
              <td className="px-3 py-2 border-b border-gray-200 text-left">V. total</td>
              <td className="px-3 py-2 border-b border-gray-200 tabular-nums">
                {fmt(isSupervisor ? stats?.columns.ltV1.sum : (userStats?.columns.ltV1.sum ?? stats?.columns.ltV1.sum))} m³
              </td>
              <td className="px-3 py-2 border-b border-gray-200 tabular-nums">
                {fmt(isSupervisor ? stats?.columns.between.sum : (userStats?.columns.between.sum ?? stats?.columns.between.sum))} m³
              </td>
              <td className="px-3 py-2 border-b border-gray-200 tabular-nums">
                {fmt(isSupervisor ? stats?.columns.geV2.sum : (userStats?.columns.geV2.sum ?? stats?.columns.geV2.sum))} m³
              </td>
              <td className="px-3 py-2 border-b border-gray-200 tabular-nums">
                {fmt(isSupervisor ? stats?.total.sum : (userStats?.total.sum ?? stats?.total.sum))} m³
              </td>
            </tr>
            <tr className="text-center">
              <td className="px-3 py-2 border-b border-gray-200 text-left">Nb.</td>
              <td className="px-3 py-2 border-b border-gray-200">
                {stats?.columns.ltV1.count ?? 0}
              </td>
              <td className="px-3 py-2 border-b border-gray-200">
                {stats?.columns.between.count ?? 0}
              </td>
              <td className="px-3 py-2 border-b border-gray-200">
                {stats?.columns.geV2.count ?? 0}
              </td>
              <td className="px-3 py-2 border-b border-gray-200">{stats?.total.count ?? 0}</td>
            </tr>
            <tr className="text-center">
              <td className="px-3 py-2 border-b border-gray-200 text-left">V. moy</td>
              <td className="px-3 py-2 border-b border-gray-200 tabular-nums">
                {fmt(stats?.columns.ltV1.avg)} m³
              </td>
              <td className="px-3 py-2 border-b border-gray-200 tabular-nums">
                {fmt(stats?.columns.between.avg)} m³
              </td>
              <td className="px-3 py-2 border-b border-gray-200 tabular-nums">
                {fmt(stats?.columns.geV2.avg)} m³
              </td>
              <td className="px-3 py-2 border-b border-gray-200 tabular-nums">
                {fmt(stats?.total.avg)} m³
              </td>
            </tr>
            {!isSupervisor && (
              <tr className="text-center">
                <td className="px-3 py-2 border-b border-gray-200 text-left">V. jour</td>
                <td className="px-3 py-2 border-b border-gray-200 tabular-nums">{fmt(todayUser?.ltV1)} m³</td>
                <td className="px-3 py-2 border-b border-gray-200 tabular-nums">{fmt(todayUser?.between)} m³</td>
                <td className="px-3 py-2 border-b border-gray-200 tabular-nums">{fmt(todayUser?.geV2)} m³</td>
                <td className="px-3 py-2 border-b border-gray-200 tabular-nums">{fmt(todayUser?.total)} m³</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
