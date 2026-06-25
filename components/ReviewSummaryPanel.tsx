"use client";

import { Copy, MessageSquare } from "lucide-react";
import { toast } from "sonner";
import { pct, formatMonth } from "@/lib/format";
import type { DashboardData, ProgramSummary } from "@/lib/types";

type Props = {
  summary: ProgramSummary | null;
  dashboard: DashboardData | null;
};

export function ReviewSummaryPanel({ summary, dashboard }: Props) {
  if (!summary || !dashboard) {
    return (
      <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center text-sm text-slate-600">
        Loading review summary…
      </div>
    );
  }

  const exportText = [
    `Program Review Summary — ${formatMonth(summary.facts.reportingMonth)}`,
    "",
    "ACHIEVEMENTS & METRICS",
    `- Total schools in scope: ${summary.facts.totalSchools}`,
    `- Participation: ${pct(summary.facts.participationPercentage)}`,
    `- Evidence submission: ${pct(summary.facts.evidenceSubmissionPercentage)}`,
    `- Attendance: ${pct(summary.facts.attendancePercentage)}`,
    "",
    "MONTH-OVER-MONTH CHANGES",
    dashboard.movement
      ? `- Participation: ${formatDelta(dashboard.movement.participationPercentage.delta)}`
      : "- No prior month data",
    dashboard.movement
      ? `- Evidence: ${formatDelta(dashboard.movement.evidenceSubmissionPercentage.delta)}`
      : "",
    dashboard.movement
      ? `- Attendance: ${formatDelta(dashboard.movement.attendancePercentage.delta)}`
      : "",
    "",
    "PRIORITY GEOGRAPHIES",
    summary.facts.priorityBlocks.length
      ? summary.facts.priorityBlocks.map((b) => `- ${b}`).join("\n")
      : "- None identified",
    "",
    "NARRATIVE",
    summary.narrative,
    "",
    "DISCUSSION POINTS",
    ...summary.discussionPoints.map((p) => `- ${p}`),
  ]
    .filter(Boolean)
    .join("\n");

  async function copySummary() {
    await navigator.clipboard.writeText(exportText);
    toast.success("Review summary copied to clipboard.");
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={copySummary}
          className="inline-flex items-center gap-2 rounded-lg bg-slate-900 px-3 py-2 text-sm font-medium text-white hover:bg-slate-800"
        >
          <Copy className="h-4 w-4" />
          Copy review summary
        </button>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <h3 className="text-sm font-semibold text-slate-900">Key facts</h3>
          <ul className="mt-3 space-y-2 text-sm text-slate-700">
            <li>Reporting period: {formatMonth(summary.facts.reportingMonth)}</li>
            <li>Schools in scope: {summary.facts.totalSchools}</li>
            <li>Participation: {pct(summary.facts.participationPercentage)}</li>
            <li>Evidence submission: {pct(summary.facts.evidenceSubmissionPercentage)}</li>
            <li>Attendance: {pct(summary.facts.attendancePercentage)}</li>
          </ul>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <h3 className="text-sm font-semibold text-slate-900">Month-over-month movement</h3>
          {dashboard.movement ? (
            <ul className="mt-3 space-y-2 text-sm text-slate-700">
              <li>Participation: {formatDelta(dashboard.movement.participationPercentage.delta)}</li>
              <li>
                Evidence submission:{" "}
                {formatDelta(dashboard.movement.evidenceSubmissionPercentage.delta)}
              </li>
              <li>Attendance: {formatDelta(dashboard.movement.attendancePercentage.delta)}</li>
            </ul>
          ) : (
            <p className="mt-3 text-sm text-slate-500">No prior month available for comparison.</p>
          )}
        </div>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <h3 className="text-sm font-semibold text-slate-900">Priority blocks</h3>
        {summary.facts.priorityBlocks.length ? (
          <ul className="mt-3 list-disc pl-5 text-sm text-slate-700">
            {summary.facts.priorityBlocks.map((block) => (
              <li key={block}>{block}</li>
            ))}
          </ul>
        ) : (
          <p className="mt-3 text-sm text-slate-500">No priority blocks identified.</p>
        )}
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <h3 className="text-sm font-semibold text-slate-900">Review narrative</h3>
        <p className="mt-3 text-sm leading-6 text-slate-700">{summary.narrative}</p>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex items-center gap-2">
          <MessageSquare className="h-4 w-4 text-violet-600" />
          <h3 className="text-sm font-semibold text-slate-900">Discussion prompts for leadership review</h3>
        </div>
        <ul className="mt-3 list-disc pl-5 text-sm text-slate-700">
          {summary.discussionPoints.map((point) => (
            <li key={point}>{point}</li>
          ))}
        </ul>
      </div>
    </div>
  );
}

function formatDelta(delta: number) {
  const sign = delta > 0 ? "+" : "";
  return `${sign}${(delta * 100).toFixed(1)} percentage points vs prior month`;
}
