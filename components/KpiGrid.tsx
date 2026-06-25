"use client";

import { TrendingDown, TrendingUp, Minus } from "lucide-react";
import { RiskBadge } from "./RiskBadge";
import { pct, pctPoints } from "@/lib/format";
import type { DashboardData } from "@/lib/types";

type Props = { data: DashboardData };

function MovementChip({ delta }: { delta: number }) {
  if (Math.abs(delta) < 0.001) {
    return (
      <span className="inline-flex items-center gap-1 text-xs text-slate-500">
        <Minus className="h-3 w-3" /> No change
      </span>
    );
  }
  const up = delta > 0;
  return (
    <span
      className={`inline-flex items-center gap-1 text-xs font-medium ${up ? "text-emerald-700" : "text-red-700"}`}
    >
      {up ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
      {pctPoints(delta)} vs prior month
    </span>
  );
}

export function KpiGrid({ data }: Props) {
  const { kpis, movement } = data;

  const cards = [
    {
      label: "Total schools",
      value: kpis.totalSchools.toLocaleString(),
      sub: `${kpis.participatingSchools} participating`,
      movement: null,
      risk: kpis.risk.participation,
    },
    {
      label: "Participation",
      value: pct(kpis.participationPercentage),
      sub: `${kpis.participatingSchools} / ${kpis.totalSchools} schools`,
      movement: movement?.participationPercentage.delta,
      risk: kpis.risk.participation,
    },
    {
      label: "Evidence submission",
      value: pct(kpis.evidenceSubmissionPercentage),
      sub: `${kpis.schoolsWithEvidence} schools with evidence`,
      movement: movement?.evidenceSubmissionPercentage.delta,
      risk: kpis.risk.evidenceSubmission,
    },
    {
      label: "Enrollment",
      value: kpis.totalEnrollment.toLocaleString(),
      sub: "Students in scope",
      movement: null,
      risk: null,
    },
    {
      label: "Attendance",
      value: pct(kpis.attendancePercentage),
      sub: `${kpis.totalAttendance.toLocaleString()} students attended`,
      movement: movement?.attendancePercentage.delta,
      risk: kpis.risk.attendance,
    },
  ];

  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
      {cards.map((card) => (
        <div key={card.label} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex items-start justify-between gap-2">
            <p className="text-sm font-medium text-slate-600">{card.label}</p>
            {card.risk ? (
              <RiskBadge status={card.risk.riskStatus} label={card.risk.label} />
            ) : null}
          </div>
          <p className="mt-2 text-2xl font-semibold text-slate-900">{card.value}</p>
          <p className="mt-1 text-sm text-slate-500">{card.sub}</p>
          {card.movement != null ? (
            <div className="mt-2">
              <MovementChip delta={card.movement} />
            </div>
          ) : null}
        </div>
      ))}
    </div>
  );
}

export function RiskExplanations({ data }: Props) {
  const risks = [
    data.kpis.risk.participation,
    data.kpis.risk.evidenceSubmission,
    data.kpis.risk.attendance,
  ];

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <h3 className="text-sm font-semibold text-slate-900">Deterministic risk explanations</h3>
      <ul className="mt-3 space-y-2">
        {risks.map((risk) => (
          <li key={risk.metric} className="flex flex-wrap items-center gap-2 text-sm text-slate-700">
            <RiskBadge status={risk.riskStatus} label={risk.label} />
            <span>{risk.explanation}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
