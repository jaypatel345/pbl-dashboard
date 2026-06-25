"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { RiskBadge } from "./RiskBadge";
import { pct } from "@/lib/format";
import type { GeographyData } from "@/lib/types";

type Props = {
  districtData: GeographyData;
  blockData: GeographyData;
};

function GeographyTable({
  title,
  rows,
  variant,
}: {
  title: string;
  rows: GeographyData["geographies"];
  variant: "high" | "low";
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <h3 className="text-sm font-semibold text-slate-900">{title}</h3>
      <div className="mt-3 overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="border-b border-slate-200 text-left text-slate-500">
              <th className="py-2 pr-4">Name</th>
              <th className="py-2 pr-4">Participation</th>
              <th className="py-2 pr-4">Evidence</th>
              <th className="py-2 pr-4">Attendance</th>
              <th className="py-2">Risk</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.name} className="border-b border-slate-100">
                <td className="py-2 pr-4 font-medium text-slate-800">{row.name}</td>
                <td className="py-2 pr-4">{pct(row.metrics.participationPercentage)}</td>
                <td className="py-2 pr-4">{pct(row.metrics.evidenceSubmissionPercentage)}</td>
                <td className="py-2 pr-4">{pct(row.metrics.attendancePercentage)}</td>
                <td className="py-2">
                  <RiskBadge status={row.riskStatus} label={row.riskLabel} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {rows.length === 0 ? (
          <p className="py-4 text-sm text-slate-500">No geographies match the current filters.</p>
        ) : null}
      </div>
      <p className="mt-2 text-xs text-slate-500">
        {variant === "low"
          ? "Low performers ranked by composite score (40% participation + 30% evidence + 30% attendance)."
          : "Top performers by composite score."}
      </p>
    </div>
  );
}

export function GeographyPanel({ districtData, blockData }: Props) {
  const chartData = blockData.geographies.slice(0, 8).map((row) => ({
    name: row.name.replace(/District [A-Z]+ - /, ""),
    participation: Number((row.metrics.participationPercentage * 100).toFixed(1)),
    evidence: Number((row.metrics.evidenceSubmissionPercentage * 100).toFixed(1)),
    attendance: Number((row.metrics.attendancePercentage * 100).toFixed(1)),
  }));

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <h3 className="text-sm font-semibold text-slate-900">Block performance comparison</h3>
        <div className="mt-4 h-72">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 8, right: 8, left: 0, bottom: 48 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="name" angle={-25} textAnchor="end" height={60} tick={{ fontSize: 11 }} />
              <YAxis domain={[0, 100]} tickFormatter={(v) => `${v}%`} />
              <Tooltip formatter={(value) => `${value}%`} />
              <Bar dataKey="participation" name="Participation" fill="#2563eb" radius={[4, 4, 0, 0]} />
              <Bar dataKey="evidence" name="Evidence" fill="#7c3aed" radius={[4, 4, 0, 0]} />
              <Bar dataKey="attendance" name="Attendance" fill="#059669" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <GeographyTable
          title="High-performing districts"
          rows={districtData.highPerforming}
          variant="high"
        />
        <GeographyTable
          title="Priority districts (follow-up needed)"
          rows={districtData.lowPerforming}
          variant="low"
        />
        <GeographyTable
          title="High-performing blocks"
          rows={blockData.highPerforming}
          variant="high"
        />
        <GeographyTable
          title="Priority blocks (follow-up needed)"
          rows={blockData.lowPerforming}
          variant="low"
        />
      </div>
    </div>
  );
}
