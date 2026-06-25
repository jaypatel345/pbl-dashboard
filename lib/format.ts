import type { RiskStatus } from "./types";

export function pct(value: number, digits = 1) {
  return `${(value * 100).toFixed(digits)}%`;
}

export function pctPoints(value: number, digits = 1) {
  const sign = value > 0 ? "+" : "";
  return `${sign}${(value * 100).toFixed(digits)} pp`;
}

export function formatMonth(value?: string | null) {
  if (!value) return "—";
  const date = new Date(`${value.slice(0, 7)}-01T00:00:00.000Z`);
  return date.toLocaleDateString("en-US", { month: "long", year: "numeric", timeZone: "UTC" });
}

export const RISK_STYLES: Record<RiskStatus, { bg: string; text: string; border: string }> = {
  ON_TRACK: { bg: "bg-emerald-50", text: "text-emerald-800", border: "border-emerald-200" },
  BEHIND: { bg: "bg-amber-50", text: "text-amber-800", border: "border-amber-200" },
  AT_RISK: { bg: "bg-orange-50", text: "text-orange-800", border: "border-orange-200" },
  CRITICAL: { bg: "bg-red-50", text: "text-red-800", border: "border-red-200" },
};

export const PRIORITY_STYLES: Record<string, string> = {
  URGENT: "bg-red-100 text-red-800",
  HIGH: "bg-orange-100 text-orange-800",
  MEDIUM: "bg-amber-100 text-amber-800",
  LOW: "bg-slate-100 text-slate-700",
};

export async function fetchApi<T>(path: string): Promise<T> {
  const response = await fetch(path);
  const json = await response.json();
  if (!response.ok) {
    throw new Error(json?.error?.message ?? "Request failed.");
  }
  return json.data as T;
}

export function buildQuery(filters: Record<string, string | undefined>) {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(filters)) {
    if (value) params.set(key, value);
  }
  const query = params.toString();
  return query ? `?${query}` : "";
}
