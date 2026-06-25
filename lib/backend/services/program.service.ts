import { ActionStatus, Priority } from "@/lib/backend/db";
import { prisma } from "../db";
import { HttpError } from "../http";
import {
  buildSubmissionWhere,
  type SubmissionFilters,
} from "../models/submission.model";
import {
  RISK_LABELS,
  classifyRisk,
  explainRisk,
  priorityFromRisk,
} from "../risk";

type SubmissionWithSchool = Awaited<ReturnType<typeof loadSubmissions>>[number];

function monthFromInput(value?: string | Date) {
  if (!value) return undefined;
  if (value instanceof Date) return value;
  const date = new Date(
    value.length === 7 ? `${value}-01T00:00:00.000Z` : value,
  );
  if (Number.isNaN(date.getTime()))
    throw new HttpError(422, "Invalid reportingMonth.");
  return date;
}

function previousMonth(date: Date) {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() - 1, 1));
}

function monthLabel(date: Date) {
  return date.toISOString().slice(0, 7);
}

async function loadSubmissions(filters: SubmissionFilters) {
  return prisma.monthlySubmission.findMany({
    where: buildSubmissionWhere(filters),
    include: { school: true },
  });
}

function summarizeRows(rows: SubmissionWithSchool[]) {
  const schoolIds = new Set(rows.map((row) => row.schoolId));
  const participatingSchoolIds = new Set(
    rows.filter((row) => row.pblConducted).map((row) => row.schoolId),
  );
  const evidenceSchoolIds = new Set(
    rows.filter((row) => row.evidenceSubmitted).map((row) => row.schoolId),
  );
  const totalEnrollment = rows.reduce((sum, row) => sum + row.enrollment, 0);
  const totalAttendance = rows.reduce((sum, row) => sum + row.attendance, 0);
  const totalSchools = schoolIds.size;
  const participatingSchools = participatingSchoolIds.size;
  const schoolsWithEvidence = evidenceSchoolIds.size;
  const participationPercentage = totalSchools
    ? participatingSchools / totalSchools
    : 0;
  const evidenceSubmissionPercentage = participatingSchools
    ? schoolsWithEvidence / participatingSchools
    : 0;
  const attendancePercentage = totalEnrollment
    ? totalAttendance / totalEnrollment
    : 0;

  return {
    totalSchools,
    participatingSchools,
    participationPercentage,
    schoolsWithEvidence,
    evidenceSubmissionPercentage,
    totalEnrollment,
    totalAttendance,
    attendancePercentage,
    risk: {
      participation: explainRisk("Participation", participationPercentage),
      evidenceSubmission: explainRisk(
        "Evidence submission",
        evidenceSubmissionPercentage,
      ),
      attendance: explainRisk("Attendance", attendancePercentage),
    },
  };
}

function movement(current: number, previous: number) {
  return {
    current,
    previous,
    delta: current - previous,
    deltaPercentagePoints: (current - previous) * 100,
  };
}

export async function getFilterOptions() {
  const [months, schools, grades, subjects] = await Promise.all([
    prisma.monthlySubmission.findMany({
      distinct: ["reportingMonth"],
      select: { reportingMonth: true },
      orderBy: { reportingMonth: "asc" },
    }),
    prisma.school.findMany({
      distinct: ["district", "block"],
      select: { district: true, block: true },
      orderBy: [{ district: "asc" }, { block: "asc" }],
    }),
    prisma.monthlySubmission.findMany({
      distinct: ["grade"],
      select: { grade: true },
      orderBy: { grade: "asc" },
    }),
    prisma.monthlySubmission.findMany({
      distinct: ["subject"],
      select: { subject: true },
      orderBy: { subject: "asc" },
    }),
  ]);

  return {
    reportingMonths: months.map((item) => monthLabel(item.reportingMonth)),
    districts: [...new Set(schools.map((school) => school.district))],
    blocksByDistrict: schools.reduce<Record<string, string[]>>(
      (acc, school) => {
        acc[school.district] ??= [];
        if (!acc[school.district].includes(school.block))
          acc[school.district].push(school.block);
        return acc;
      },
      {},
    ),
    grades: grades.map((item) => item.grade),
    subjects: subjects.map((item) => item.subject),
  };
}

export async function getDashboard(filters: {
  reportingMonth?: string;
  district?: string;
  block?: string;
  grade?: string;
  subject?: string;
}) {
  try {
    const reportingMonth =
      monthFromInput(filters.reportingMonth) ??
      (
        await prisma.monthlySubmission.findFirst({
          select: { reportingMonth: true },
          orderBy: { reportingMonth: "desc" },
        })
      )?.reportingMonth;

    if (!reportingMonth) {
      return {
        filters: { ...filters, reportingMonth: null },
        kpis: summarizeRows([]),
        movement: null,
      };
    }

    const scopedFilters = { ...filters, reportingMonth };

    const [currentRows, previousRows] = await Promise.all([
      loadSubmissions(scopedFilters),
      loadSubmissions({
        ...scopedFilters,
        reportingMonth: previousMonth(reportingMonth),
      }),
    ]);

    const current = summarizeRows(currentRows);
    const previous = summarizeRows(previousRows);

    return {
      filters: {
        ...filters,
        reportingMonth: monthLabel(reportingMonth),
      },
      kpis: current,
      movement: {
        participationPercentage: movement(
          current.participationPercentage,
          previous.participationPercentage,
        ),
        evidenceSubmissionPercentage: movement(
          current.evidenceSubmissionPercentage,
          previous.evidenceSubmissionPercentage,
        ),
        attendancePercentage: movement(
          current.attendancePercentage,
          previous.attendancePercentage,
        ),
      },
    };
  } catch (error) {
    console.error("Error in getDashboard:", error);

    if (error instanceof Error) {
      console.error("Message:", error.message);
      console.error("Stack:", error.stack);
    }

    throw error; // Let the API route handle the response
  }
}

export async function getGeographyPerformance(filters: {
  reportingMonth?: string;
  district?: string;
  block?: string;
  grade?: string;
  subject?: string;
  level?: "district" | "block";
}) {
  const level = filters.level ?? "district";
  const reportingMonth = monthFromInput(filters.reportingMonth);
  const rows = await loadSubmissions({ ...filters, reportingMonth });
  const groups = new Map<string, SubmissionWithSchool[]>();

  for (const row of rows) {
    const key = level === "district" ? row.school.district : row.school.block;
    groups.set(key, [...(groups.get(key) ?? []), row]);
  }

  const geographies = [...groups.entries()]
    .map(([name, groupRows]) => {
      const metrics = summarizeRows(groupRows);
      const compositeRate =
        metrics.participationPercentage * 0.4 +
        metrics.evidenceSubmissionPercentage * 0.3 +
        metrics.attendancePercentage * 0.3;

      return {
        level,
        name,
        district: level === "block" ? groupRows[0]?.school.district : name,
        metrics,
        compositeRate,
        riskStatus: classifyRisk(compositeRate),
        riskLabel: RISK_LABELS[classifyRisk(compositeRate)],
      };
    })
    .sort((a, b) => b.compositeRate - a.compositeRate);

  return {
    level,
    highPerforming: geographies.slice(0, 5),
    lowPerforming: [...geographies].reverse().slice(0, 5),
    geographies,
  };
}

export async function getProgramSummary(filters: {
  reportingMonth?: string;
  district?: string;
  block?: string;
  grade?: string;
  subject?: string;
}) {
  const dashboard = await getDashboard(filters);
  const geographies = await getGeographyPerformance({
    ...filters,
    level: "block",
  });
  const kpis = dashboard.kpis;
  const weakest = geographies.lowPerforming.slice(0, 3);

  return {
    facts: {
      reportingMonth: dashboard.filters.reportingMonth,
      totalSchools: kpis.totalSchools,
      participationPercentage: kpis.participationPercentage,
      evidenceSubmissionPercentage: kpis.evidenceSubmissionPercentage,
      attendancePercentage: kpis.attendancePercentage,
      priorityBlocks: weakest.map((geo) => geo.name),
    },
    narrative: [
      `For ${dashboard.filters.reportingMonth ?? "the selected period"}, ${kpis.participatingSchools} of ${kpis.totalSchools} schools conducted PBL, a participation rate of ${(kpis.participationPercentage * 100).toFixed(1)}%.`,
      `Evidence submission is ${(kpis.evidenceSubmissionPercentage * 100).toFixed(1)}% and attendance is ${(kpis.attendancePercentage * 100).toFixed(1)}%, both classified with deterministic thresholds.`,
      weakest.length
        ? `Priority follow-up should start with ${weakest.map((geo) => geo.name).join(", ")} because their composite implementation score is lowest in the current filter set.`
        : "No priority geography could be identified from the current filter set.",
    ].join(" "),
    discussionPoints: [
      "Which blocks need immediate support to move evidence submission above threshold?",
      "What operational barrier explains the largest month-over-month decline?",
      "Which high-performing block practices can be reused in priority geographies?",
    ],
  };
}

export async function getRecommendedActions(filters: {
  reportingMonth?: string;
  district?: string;
  block?: string;
  grade?: string;
  subject?: string;
}) {
  const geographies = await getGeographyPerformance({
    ...filters,
    level: "block",
  });
  const candidates = geographies.lowPerforming.slice(0, 5);
  const dueDate = new Date();
  dueDate.setUTCDate(dueDate.getUTCDate() + 14);

  return candidates.map((geo) => {
    const weakestMetric = [
      geo.metrics.risk.participation,
      geo.metrics.risk.evidenceSubmission,
      geo.metrics.risk.attendance,
    ].sort((a, b) => a.rate - b.rate)[0];
    const priority = priorityFromRisk(geo.riskStatus) as Priority;

    return {
      district: geo.district ?? "",
      block: geo.name,
      priority,
      owner:
        priority === Priority.URGENT ? "Program Lead" : "Block Coordinator",
      dueDate,
      status: ActionStatus.OPEN,
      linkedMetric: weakestMetric.metric,
      description: `Follow up on ${weakestMetric.metric.toLowerCase()} in ${geo.name}; current rate is ${(weakestMetric.rate * 100).toFixed(1)}% (${weakestMetric.label}).`,
      source: "generated",
    };
  });
}
