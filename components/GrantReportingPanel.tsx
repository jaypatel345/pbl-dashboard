"use client";

import { Copy, FileText } from "lucide-react";
import { toast } from "sonner";
import { RiskBadge } from "./RiskBadge";
import { pct, formatMonth } from "@/lib/format";
import type { GrantListItem, GrantReportData } from "@/lib/types";

type Props = {
  grants: GrantListItem[];
  reportingMonths: string[];
  grantLabel: string;
  reportingMonth: string;
  report: GrantReportData | null;
  loading: boolean;
  onGrantChange: (value: string) => void;
  onMonthChange: (value: string) => void;
};

export function GrantReportingPanel({
  grants,
  reportingMonths,
  grantLabel,
  reportingMonth,
  report,
  loading,
  onGrantChange,
  onMonthChange,
}: Props) {
  async function copyReport() {
    if (!report) return;
    const text = [
      "=== COMPUTED FACTS ===",
      JSON.stringify(report.reportSection.computedFacts, null, 2),
      "",
      "=== GENERATED NARRATIVE ===",
      report.reportSection.generatedNarrative,
      "",
      "=== TRACEABILITY ===",
      JSON.stringify(report.reportSection.traceability, null, 2),
    ].join("\n");
    await navigator.clipboard.writeText(text);
    toast.success("Grant report copied to clipboard.");
  }

  return (
    <div className="space-y-4">
      <div className="grid gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm md:grid-cols-2">
        <label className="flex flex-col gap-1 text-sm">
          <span className="font-medium text-slate-700">Grant</span>
          <select
            className="rounded-lg border border-slate-300 px-3 py-2"
            value={grantLabel}
            onChange={(e) => onGrantChange(e.target.value)}
          >
            <option value="">Select grant</option>
            {grants.map((grant) => (
              <option key={grant.id} value={grant.grantName}>
                {grant.grantName} ({grant.donor})
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1 text-sm">
          <span className="font-medium text-slate-700">Reporting month</span>
          <select
            className="rounded-lg border border-slate-300 px-3 py-2"
            value={reportingMonth}
            onChange={(e) => onMonthChange(e.target.value)}
          >
            <option value="">Select month</option>
            {reportingMonths.map((month) => (
              <option key={month} value={month}>
                {formatMonth(month)}
              </option>
            ))}
          </select>
        </label>
      </div>

      {loading ? (
        <p className="text-sm text-slate-500">Loading grant report…</p>
      ) : !report ? (
        <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center text-sm text-slate-600">
          Select a grant and reporting month to assemble a report-ready section from structured facts.
        </div>
      ) : (
        <>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={copyReport}
              className="inline-flex items-center gap-2 rounded-lg bg-slate-900 px-3 py-2 text-sm font-medium text-white hover:bg-slate-800"
            >
              <Copy className="h-4 w-4" />
              Copy report section
            </button>
          </div>

          <div className="grid gap-4 xl:grid-cols-2">
            <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-blue-600" />
                <h3 className="text-sm font-semibold text-slate-900">Computed facts</h3>
              </div>
              <dl className="mt-4 grid gap-3 text-sm">
                <Fact label="Grant" value={`${report.facts.grantName as string} (${report.facts.donor as string})`} />
                <Fact label="Reporting month" value={formatMonth(report.facts.reportingMonth as string)} />
                <Fact label="PBL completion" value={pct(report.facts.pblCompletionRate as number)} />
                <Fact
                  label="Evidence submission"
                  value={pct(report.facts.evidenceSubmissionRate as number)}
                />
                <Fact label="Attendance" value={pct(report.facts.attendanceRate as number)} />
                <Fact
                  label="Finance utilization"
                  value={pct((report.facts.finance as { cumulativeUtilizationRate: number }).cumulativeUtilizationRate)}
                />
                <Fact label="Report status" value={report.facts.reportStatus as string} />
                <div className="flex items-center gap-2">
                  <dt className="text-slate-500">Risk status</dt>
                  <dd>
                    <RiskBadge
                      status={report.facts.riskStatus as "ON_TRACK" | "BEHIND" | "AT_RISK" | "CRITICAL"}
                      label={report.facts.riskLabel as string}
                    />
                  </dd>
                </div>
                <Fact label="Milestones" value={report.facts.milestoneSummary as string} />
              </dl>
            </div>

            <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
              <h3 className="text-sm font-semibold text-slate-900">Generated narrative (rule-based)</h3>
              <p className="mt-3 text-sm leading-6 text-slate-700">
                {report.reportSection.generatedNarrative}
              </p>
              <p className="mt-4 text-xs text-slate-500">
                Narrative is assembled from computed facts only. Works without any LLM call.
              </p>
            </div>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <h3 className="text-sm font-semibold text-slate-900">Finance lines</h3>
            <div className="mt-3 overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-200 text-left text-slate-500">
                    <th className="py-2 pr-4">Budget line</th>
                    <th className="py-2 pr-4">Approved</th>
                    <th className="py-2 pr-4">Monthly</th>
                    <th className="py-2 pr-4">Cumulative</th>
                    <th className="py-2">Note</th>
                  </tr>
                </thead>
                <tbody>
                  {report.financeLines.map((line) => (
                    <tr key={line.id} className="border-b border-slate-100">
                      <td className="py-2 pr-4">{line.budgetLine}</td>
                      <td className="py-2 pr-4">{line.approvedBudgetUnits.toFixed(1)}</td>
                      <td className="py-2 pr-4">{line.monthlyUtilizedUnits.toFixed(1)}</td>
                      <td className="py-2 pr-4">
                        {line.cumulativeUtilizedUnits.toFixed(1)} ({pct(line.cumulativeUtilizationRate)})
                      </td>
                      <td className="py-2 text-slate-600">{line.financeNote ?? "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <h3 className="text-sm font-semibold text-slate-900">Linked evidence & media</h3>
            <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {report.evidence.map((item) => (
                <div key={item.id} className="overflow-hidden rounded-lg border border-slate-200">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={`/api/evidence/${item.relativePath}`}
                    alt={item.title}
                    className="h-40 w-full object-cover bg-slate-100"
                  />
                  <div className="p-3">
                    <p className="text-sm font-medium text-slate-900">{item.title}</p>
                    <p className="mt-1 text-xs text-slate-500">{item.type.replace("_", " ")} · {item.district}</p>
                    <p className="mt-2 text-xs text-slate-600">{item.summaryOrCaption}</p>
                  </div>
                </div>
              ))}
            </div>
            {report.evidence.length === 0 ? (
              <p className="mt-2 text-sm text-slate-500">No evidence assets for this month.</p>
            ) : null}
          </div>

          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-xs text-slate-600">
            <p className="font-medium text-slate-800">Traceability</p>
            <p className="mt-1">Grant report ID: {report.reportSection.traceability.grantReportId}</p>
            <p>Finance line IDs: {report.reportSection.traceability.financeLineIds.join(", ")}</p>
            <p>Evidence records: {report.reportSection.traceability.evidenceRecordCodes.join(", ")}</p>
          </div>
        </>
      )}
    </div>
  );
}

function Fact({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-slate-500">{label}</dt>
      <dd className="font-medium text-slate-900">{value}</dd>
    </div>
  );
}
