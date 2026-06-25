import { RiskStatus } from "@/lib/backend/db";

export const RISK_LABELS: Record<RiskStatus, string> = {
  ON_TRACK: "On Track",
  BEHIND: "Behind",
  AT_RISK: "At Risk",
  CRITICAL: "Critical",
};

export const RISK_ORDER: Record<RiskStatus, number> = {
  ON_TRACK: 1,
  BEHIND: 2,
  AT_RISK: 3,
  CRITICAL: 4,
};

export function classifyRisk(rate: number): RiskStatus {
  if (rate >= 0.75) return RiskStatus.ON_TRACK;
  if (rate >= 0.6) return RiskStatus.BEHIND;
  if (rate >= 0.35) return RiskStatus.AT_RISK;
  return RiskStatus.CRITICAL;
}

export function parseRiskStatus(value: string | null | undefined): RiskStatus {
  const normalized = (value ?? "")
    .trim()
    .replace(/[-\s]+/g, "_")
    .toUpperCase();

  if (normalized === "ON_TRACK") return RiskStatus.ON_TRACK;
  if (normalized === "BEHIND") return RiskStatus.BEHIND;
  if (normalized === "AT_RISK") return RiskStatus.AT_RISK;
  if (normalized === "CRITICAL") return RiskStatus.CRITICAL;

  return RiskStatus.CRITICAL;
}

export function explainRisk(metric: string, rate: number) {
  const riskStatus = classifyRisk(rate);
  return {
    metric,
    rate,
    riskStatus,
    label: RISK_LABELS[riskStatus],
    explanation: `${metric} is ${(rate * 100).toFixed(1)}%, classified as ${RISK_LABELS[riskStatus]} using thresholds: On Track >= 75%, Behind 60-74.9%, At Risk 35-59.9%, Critical < 35%.`,
  };
}

export function priorityFromRisk(status: RiskStatus) {
  if (status === RiskStatus.CRITICAL) return "URGENT";
  if (status === RiskStatus.AT_RISK) return "HIGH";
  if (status === RiskStatus.BEHIND) return "MEDIUM";
  return "LOW";
}
