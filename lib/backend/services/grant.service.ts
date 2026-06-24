import { HttpError } from "../http";
import {
  findGrantForReport,
  getGrantEvidence,
  getGrantFinance,
  getGrantReport,
} from "../models/grant.model";
import { RISK_LABELS } from "../risk";

function parseMonth(value: string) {
  const date = new Date(value.length === 7 ? `${value}-01T00:00:00.000Z` : value);
  if (Number.isNaN(date.getTime())) throw new HttpError(422, "Invalid reportingMonth.");
  return date;
}

function pct(value: number) {
  return `${(value * 100).toFixed(1)}%`;
}

export async function buildGrantReport(args: {
  grantId?: string;
  grantLabel?: string;
  reportingMonth: string;
}) {
  if (!args.grantId && !args.grantLabel) {
    throw new HttpError(422, "Provide grantId or grantLabel.");
  }

  const grant = await findGrantForReport(args);
  if (!grant) throw new HttpError(404, "Grant not found.");

  const reportingMonth = parseMonth(args.reportingMonth);
  const [report, financeLines, evidence] = await Promise.all([
    getGrantReport(grant.id, reportingMonth),
    getGrantFinance(grant.id, reportingMonth),
    getGrantEvidence(grant.id, reportingMonth),
  ]);

  if (!report) {
    throw new HttpError(404, "Grant report facts not found for selected month.");
  }

  const approvedBudgetUnits = financeLines.reduce((sum, row) => sum + row.approvedBudgetUnits, 0);
  const monthlyUtilizedUnits = financeLines.reduce(
    (sum, row) => sum + row.monthlyUtilizedUnits,
    0,
  );
  const cumulativeUtilizedUnits = financeLines.reduce(
    (sum, row) => sum + row.cumulativeUtilizedUnits,
    0,
  );
  const cumulativeUtilizationRate = approvedBudgetUnits
    ? cumulativeUtilizedUnits / approvedBudgetUnits
    : 0;

  const facts = {
    grantCode: grant.grantCode,
    grantName: grant.grantName,
    donor: grant.donor,
    reportingMonth: args.reportingMonth,
    coveredDistricts: grant.coveredDistricts,
    reportStatus: report.reportStatus,
    riskStatus: report.riskStatus,
    riskLabel: RISK_LABELS[report.riskStatus],
    pblCompletionRate: report.pblCompletionRate,
    evidenceSubmissionRate: report.evidenceSubmissionRate,
    attendanceRate: report.attendanceRate,
    sampledSchoolRecords: report.sampledSchoolRecords,
    schoolsCompletedPbl: report.schoolsCompletedPbl,
    schoolsWithEvidence: report.schoolsWithEvidence,
    totalEnrollment: report.totalEnrollment,
    totalAttendance: report.totalAttendance,
    finance: {
      approvedBudgetUnits,
      monthlyUtilizedUnits,
      cumulativeUtilizedUnits,
      cumulativeUtilizationRate,
    },
    milestoneSummary: report.milestoneSummary,
    evidenceCount: evidence.length,
  };

  const narrative = [
    `${grant.grantName} (${grant.donor}) report section for ${args.reportingMonth}.`,
    `Computed facts show ${pct(report.pblCompletionRate)} PBL completion, ${pct(report.evidenceSubmissionRate)} evidence submission, and ${pct(report.attendanceRate)} attendance across ${report.sampledSchoolRecords} sampled school records.`,
    `Finance utilization is ${pct(cumulativeUtilizationRate)} cumulatively (${cumulativeUtilizedUnits.toFixed(1)} of ${approvedBudgetUnits.toFixed(1)} approved units), with ${monthlyUtilizedUnits.toFixed(1)} units utilized this month.`,
    `Risk status is ${RISK_LABELS[report.riskStatus]}. Milestones: ${report.milestoneSummary}.`,
    evidence.length
      ? `Linked evidence includes ${evidence.map((item) => item.title).slice(0, 3).join(", ")}.`
      : "No linked evidence assets were found for this month.",
  ].join(" ");

  return {
    facts,
    financeLines,
    evidence,
    sourceDraftText: report.draftReportText,
    reportSection: {
      computedFacts: facts,
      generatedNarrative: narrative,
      traceability: {
        financeLineIds: financeLines.map((row) => row.id),
        evidenceRecordCodes: evidence.map((row) => row.recordCode),
        grantReportId: report.id,
      },
    },
  };
}
