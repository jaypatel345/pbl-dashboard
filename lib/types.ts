export type RiskStatus = "ON_TRACK" | "BEHIND" | "AT_RISK" | "CRITICAL";

export type FilterOptions = {
  reportingMonths: string[];
  districts: string[];
  blocksByDistrict: Record<string, string[]>;
  grades: string[];
  subjects: string[];
};

export type DashboardFilters = {
  reportingMonth?: string | null;
  district?: string;
  block?: string;
  grade?: string;
  subject?: string;
};

export type RiskExplanation = {
  metric: string;
  rate: number;
  riskStatus: RiskStatus;
  label: string;
  explanation: string;
};

export type DashboardKpis = {
  totalSchools: number;
  participatingSchools: number;
  participationPercentage: number;
  schoolsWithEvidence: number;
  evidenceSubmissionPercentage: number;
  totalEnrollment: number;
  totalAttendance: number;
  attendancePercentage: number;
  risk: {
    participation: RiskExplanation;
    evidenceSubmission: RiskExplanation;
    attendance: RiskExplanation;
  };
};

export type MetricMovement = {
  current: number;
  previous: number;
  delta: number;
  deltaPercentagePoints: number;
};

export type DashboardData = {
  filters: DashboardFilters;
  kpis: DashboardKpis;
  movement: {
    participationPercentage: MetricMovement;
    evidenceSubmissionPercentage: MetricMovement;
    attendancePercentage: MetricMovement;
  } | null;
};

export type GeographyEntry = {
  level: "district" | "block";
  name: string;
  district?: string;
  metrics: DashboardKpis;
  compositeRate: number;
  riskStatus: RiskStatus;
  riskLabel: string;
};

export type GeographyData = {
  level: "district" | "block";
  highPerforming: GeographyEntry[];
  lowPerforming: GeographyEntry[];
  geographies: GeographyEntry[];
};

export type ProgramSummary = {
  facts: {
    reportingMonth: string | null | undefined;
    totalSchools: number;
    participationPercentage: number;
    evidenceSubmissionPercentage: number;
    attendancePercentage: number;
    priorityBlocks: string[];
  };
  narrative: string;
  discussionPoints: string[];
};

export type RecommendedAction = {
  district: string;
  block: string;
  priority: string;
  owner: string;
  dueDate: string;
  status: string;
  linkedMetric: string;
  description: string;
  source: string;
};

export type GrantListItem = {
  id: string;
  grantCode: string;
  donor: string;
  grantName: string;
  coveredDistricts: string;
  periodStart: string;
  periodEnd: string;
};

export type GrantReportData = {
  facts: Record<string, unknown>;
  financeLines: Array<{
    id: string;
    budgetLine: string;
    approvedBudgetUnits: number;
    monthlyUtilizedUnits: number;
    cumulativeUtilizedUnits: number;
    cumulativeUtilizationRate: number;
    financeNote: string | null;
  }>;
  evidence: Array<{
    id: string;
    recordCode: string;
    type: string;
    title: string;
    summaryOrCaption: string;
    relativePath: string;
    fileName: string;
    district: string;
  }>;
  sourceDraftText: string | null;
  reportSection: {
    computedFacts: Record<string, unknown>;
    generatedNarrative: string;
    traceability: {
      financeLineIds: string[];
      evidenceRecordCodes: string[];
      grantReportId: string;
    };
  };
};

export type ApiResponse<T> = { data: T };

export type DashboardTab = "review" | "summary" | "grant" | "actions";
