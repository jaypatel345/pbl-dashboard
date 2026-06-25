import { EvidenceType, type Prisma } from "@/lib/backend/db";
import { readFile } from "fs/promises";
import path from "path";
import { prisma } from "../db";
import { classifyRisk, parseRiskStatus } from "../risk";

const DEFAULT_DATA_DIR = path.resolve(
  process.cwd(),
  "data/Mantra4Change_PBL_AI_Prework_Candidate_Package",
);

type CsvRow = Record<string, string>;

function parseCsv(content: string): CsvRow[] {
  const rows: string[][] = [];
  let field = "";
  let row: string[] = [];
  let inQuotes = false;

  for (let i = 0; i < content.length; i += 1) {
    const char = content[i];
    const next = content[i + 1];

    if (char === '"' && inQuotes && next === '"') {
      field += '"';
      i += 1;
    } else if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === "," && !inQuotes) {
      row.push(field);
      field = "";
    } else if ((char === "\n" || char === "\r") && !inQuotes) {
      if (char === "\r" && next === "\n") i += 1;
      row.push(field);
      if (row.some((value) => value.trim() !== "")) rows.push(row);
      row = [];
      field = "";
    } else {
      field += char;
    }
  }

  if (field || row.length) {
    row.push(field);
    rows.push(row);
  }

  const [headers = [], ...records] = rows;
  return records.map((record) =>
    headers.reduce<CsvRow>((acc, header, index) => {
      acc[header.trim()] = (record[index] ?? "").trim();
      return acc;
    }, {}),
  );
}

async function readCsv(filePath: string) {
  return parseCsv(await readFile(filePath, "utf8"));
}

function month(value: string) {
  return new Date(`${value.slice(0, 7)}-01T00:00:00.000Z`);
}

function asNumber(value: string) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function yes(value: string) {
  return value.trim().toLowerCase() === "yes";
}

function parseGrades(value: string) {
  const matches = [...value.matchAll(/\b(6|7|8)\b/g)].map(
    (match) => `Class ${match[1]}`,
  );
  return matches.length
    ? [...new Set(matches)]
    : ["Class 6", "Class 7", "Class 8"];
}

function parseSubjects(value: string) {
  const lower = value.toLowerCase();
  const subjects = [];
  if (lower.includes("math")) subjects.push("Math");
  if (lower.includes("science")) subjects.push("Science");
  return subjects.length ? subjects : ["Math", "Science"];
}

function attendanceColumn(grade: string, subject: string) {
  const gradeNumber = grade.replace("Class ", "");
  return `Average student attendance during the Class ${gradeNumber} PBL ${subject} session. If you did not teach ${subject} in Class ${gradeNumber}, enter 0.`;
}

function enrollmentColumn(grade: string) {
  const gradeNumber = grade.replace("Class ", "");
  return `Total number of students enrolled in Class ${gradeNumber}, including all sections`;
}

function evidenceType(value: string) {
  const normalized = value.toLowerCase();
  if (normalized.includes("image")) return EvidenceType.IMAGE;
  if (normalized.includes("news")) return EvidenceType.NEWS_CLIPPING;
  if (normalized.includes("video")) return EvidenceType.VIDEO;
  if (normalized.includes("document")) return EvidenceType.DOCUMENT;
  return EvidenceType.OTHER;
}

export async function importAssignmentData(
  dataDir = process.env.ASSIGNMENT_DATA_DIR ?? DEFAULT_DATA_DIR,
) {
  console.log("Data directory:", dataDir);
  const pblDir = path.join(dataDir, "02_Primary_PBL_Data", "csv_exports");
  const grantDir = path.join(dataDir, "03_Grant_Reporting_Evidence", "csv");
  console.log("PBL directory:", pblDir);
  console.log("Grant directory:", grantDir);

  const pblFiles = [
    "PBL_School_Response_Data_August_2025.csv",
    "PBL_School_Response_Data_July_2025.csv",
    "PBL_School_Response_Data_September_2025.csv",
  ];

  const counts = {
    schools: 0,
    submissions: 0,
    grants: 0,
    financeLines: 0,
    grantReports: 0,
    evidence: 0,
  };

  console.log("Starting PBL data import...");

  for (const file of pblFiles) {
    console.log("Processing file:", file);
    const rows = await readCsv(path.join(pblDir, file));
    console.log("Read", rows.length, "rows from", file);

    for (const row of rows) {
      const school = await prisma.school.upsert({
        where: {
          schoolCode: row["What is your school's synthetic school code?"],
        },
        create: {
          schoolCode: row["What is your school's synthetic school code?"],
          schoolName: row["What is the name of your school?"],
          district: row["What is the name of your district?"],
          block: row["Block Details"],
        },
        update: {
          schoolName: row["What is the name of your school?"],
          district: row["What is the name of your district?"],
          block: row["Block Details"],
        },
      });
      counts.schools += 1;

      const reportingMonth = month(row["Reporting Month"]);
      const pblConducted = yes(
        row["Was the PBL project conducted in your school this month?"],
      );
      const evidenceSubmitted = yes(
        row["Was evidence submitted for the completed PBL project?"],
      );

      for (const grade of parseGrades(
        row["In which class/classes did you conduct the PBL project?"],
      )) {
        for (const subject of parseSubjects(
          row["Which subject do you teach?"],
        )) {
          const enrollment = asNumber(row[enrollmentColumn(grade)]);
          const attendance = asNumber(row[attendanceColumn(grade, subject)]);
          const attendancePercentage = enrollment ? attendance / enrollment : 0;

          await prisma.monthlySubmission.upsert({
            where: {
              schoolId_reportingMonth_grade_subject: {
                schoolId: school.id,
                reportingMonth,
                grade,
                subject,
              },
            },
            create: {
              schoolId: school.id,
              reportingMonth,
              grade,
              subject,
              pblConducted,
              evidenceSubmitted: pblConducted && evidenceSubmitted,
              enrollment,
              attendance,
              attendancePercentage,
              riskStatus: classifyRisk(attendancePercentage),
            },
            update: {
              pblConducted,
              evidenceSubmitted: pblConducted && evidenceSubmitted,
              enrollment,
              attendance,
              attendancePercentage,
              riskStatus: classifyRisk(attendancePercentage),
            },
          });
          counts.submissions += 1;
        }
      }
    }
  }
  console.log(
    "PBL data import complete. Schools:",
    counts.schools,
    "Submissions:",
    counts.submissions,
  );

  console.log("Starting grant finance data import...");
  const financeRows = await readCsv(
    path.join(grantDir, "01_Grant_Profile_and_Finance.csv"),
  );
  for (const row of financeRows) {
    const grant = await prisma.grant.upsert({
      where: { grantCode: row.grant_id },
      create: {
        grantCode: row.grant_id,
        donor: row.donor,
        grantName: row.grant_name,
        periodStart: new Date(`${row.period_start}T00:00:00.000Z`),
        periodEnd: new Date(`${row.period_end}T00:00:00.000Z`),
        coveredDistricts: row.covered_districts,
      },
      update: {
        donor: row.donor,
        grantName: row.grant_name,
        periodStart: new Date(`${row.period_start}T00:00:00.000Z`),
        periodEnd: new Date(`${row.period_end}T00:00:00.000Z`),
        coveredDistricts: row.covered_districts,
      },
    });
    counts.grants += 1;

    await prisma.grantFinanceLine.upsert({
      where: {
        grantId_reportingMonth_budgetLine: {
          grantId: grant.id,
          reportingMonth: month(row.reporting_month),
          budgetLine: row.budget_line,
        },
      },
      create: grantFinanceData(grant.id, row),
      update: grantFinanceData(grant.id, row),
    });
    counts.financeLines += 1;
  }

  const reportRows = await readCsv(
    path.join(grantDir, "02_Grant_Performance_and_Report_Material.csv"),
  );
  for (const row of reportRows) {
    const grant = await prisma.grant.findUnique({
      where: { grantCode: row.grant_id },
    });
    if (!grant) continue;

    await prisma.grantReport.upsert({
      where: {
        grantId_reportingMonth: {
          grantId: grant.id,
          reportingMonth: month(row.reporting_month),
        },
      },
      create: grantReportData(grant.id, row),
      update: grantReportData(grant.id, row),
    });
    counts.grantReports += 1;
  }

  const evidenceRows = await readCsv(
    path.join(grantDir, "03_Evidence_and_Media_Index.csv"),
  );
  for (const row of evidenceRows) {
    const grant = await prisma.grant.findUnique({
      where: { grantCode: row.grant_id },
    });
    if (!grant) continue;

    await prisma.evidence.upsert({
      where: { recordCode: row.record_id },
      create: evidenceData(grant.id, row),
      update: evidenceData(grant.id, row),
    });
    counts.evidence += 1;
  }

  return { dataDir, counts };
}

function grantFinanceData(
  grantId: string,
  row: CsvRow,
): Prisma.GrantFinanceLineUncheckedCreateInput {
  return {
    grantId,
    reportingMonth: month(row.reporting_month),
    budgetLine: row.budget_line,
    approvedBudgetUnits: asNumber(row.approved_budget_units),
    monthlyUtilizedUnits: asNumber(row.monthly_utilized_units),
    cumulativeUtilizedUnits: asNumber(row.cumulative_utilized_units),
    cumulativeUtilizationRate: asNumber(row.cumulative_utilization_rate),
    financeNote: row.finance_note || null,
  };
}

function grantReportData(
  grantId: string,
  row: CsvRow,
): Prisma.GrantReportUncheckedCreateInput {
  return {
    grantId,
    reportingMonth: month(row.reporting_month),
    periodEndDate: new Date(`${row.period_end_date}T00:00:00.000Z`),
    reportDueDate: new Date(`${row.report_due_date}T00:00:00.000Z`),
    reportStatus: row.report_status,
    sampledSchoolRecords: asNumber(row.sampled_school_records),
    schoolsCompletedPbl: asNumber(row.schools_completed_pbl),
    pblCompletionRate: asNumber(row.pbl_completion_rate),
    schoolsWithEvidence: asNumber(row.schools_with_evidence),
    evidenceSubmissionRate: asNumber(row.evidence_submission_rate),
    totalEnrollment: asNumber(row.total_enrollment),
    totalAttendance: asNumber(row.total_attendance),
    attendanceRate: asNumber(row.attendance_rate),
    riskStatus: parseRiskStatus(row.risk_status),
    milestoneSummary: row.milestone_summary,
    draftReportText: row.draft_report_text || null,
  };
}

function evidenceData(
  grantId: string,
  row: CsvRow,
): Prisma.EvidenceUncheckedCreateInput {
  return {
    recordCode: row.record_id,
    grantId,
    type: evidenceType(row.record_type),
    donor: row.donor,
    reportingMonth: month(row.reporting_month),
    district: row.district,
    title: row.title,
    summaryOrCaption: row.summary_or_caption,
    fileName: row.file_name,
    relativePath: row.relative_path,
    usageNote: row.usage_note || null,
  };
}
