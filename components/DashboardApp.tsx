"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { BarChart3, ClipboardList, FileText, ListChecks, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { ActionsPanel } from "./ActionsPanel";
import { FilterBar } from "./FilterBar";
import { GeographyPanel } from "./GeographyPanel";
import { GrantReportingPanel } from "./GrantReportingPanel";
import { KpiGrid, RiskExplanations } from "./KpiGrid";
import { ReviewSummaryPanel } from "./ReviewSummaryPanel";
import { buildQuery, fetchApi } from "@/lib/format";
import type {
  DashboardData,
  DashboardFilters,
  DashboardTab,
  FilterOptions,
  GeographyData,
  GrantListItem,
  GrantReportData,
  ProgramSummary,
  RecommendedAction,
} from "@/lib/types";

const TABS: { id: DashboardTab; label: string; icon: typeof BarChart3 }[] = [
  { id: "review", label: "Program Review", icon: BarChart3 },
  { id: "summary", label: "Review Summary", icon: ClipboardList },
  { id: "grant", label: "Grant Reporting", icon: FileText },
  { id: "actions", label: "Actions", icon: ListChecks },
];

export function DashboardApp() {
  const [tab, setTab] = useState<DashboardTab>("review");
  const [filters, setFilters] = useState<DashboardFilters>({});
  const [options, setOptions] = useState<FilterOptions | null>(null);
  const [dashboard, setDashboard] = useState<DashboardData | null>(null);
  const [districtGeo, setDistrictGeo] = useState<GeographyData | null>(null);
  const [blockGeo, setBlockGeo] = useState<GeographyData | null>(null);
  const [summary, setSummary] = useState<ProgramSummary | null>(null);
  const [actions, setActions] = useState<RecommendedAction[]>([]);
  const [grants, setGrants] = useState<GrantListItem[]>([]);
  const [grantLabel, setGrantLabel] = useState("");
  const [grantMonth, setGrantMonth] = useState("");
  const [grantReport, setGrantReport] = useState<GrantReportData | null>(null);
  const [loading, setLoading] = useState(true);
  const [grantLoading, setGrantLoading] = useState(false);
  const [importing, setImporting] = useState(false);

  const query = useMemo(
    () =>
      buildQuery({
        reportingMonth: filters.reportingMonth ?? undefined,
        district: filters.district,
        block: filters.block,
        grade: filters.grade,
        subject: filters.subject,
      }),
    [filters],
  );

  const loadCore = useCallback(async () => {
    setLoading(true);
    try {
      const [filterOptions, dashboardData, districtData, blockData, summaryData, actionData] =
        await Promise.all([
          fetchApi<FilterOptions>("/api/filters"),
          fetchApi<DashboardData>(`/api/dashboard${query}`),
          fetchApi<GeographyData>(`/api/geography${query}${query ? "&" : "?"}level=district`),
          fetchApi<GeographyData>(`/api/geography${query}${query ? "&" : "?"}level=block`),
          fetchApi<ProgramSummary>(`/api/summary${query}`),
          fetchApi<RecommendedAction[]>(`/api/actions${query}`),
        ]);

      setOptions(filterOptions);
      setDashboard(dashboardData);
      setDistrictGeo(districtData);
      setBlockGeo(blockData);
      setSummary(summaryData);
      setActions(actionData);

      if (!filters.reportingMonth && dashboardData.filters.reportingMonth) {
        setFilters((prev) => ({ ...prev, reportingMonth: dashboardData.filters.reportingMonth ?? undefined }));
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to load dashboard.");
    } finally {
      setLoading(false);
    }
  }, [query, filters.reportingMonth]);

  const loadGrants = useCallback(async () => {
    try {
      const grantList = await fetchApi<GrantListItem[]>("/api/grants");
      setGrants(grantList);
      if (!grantLabel && grantList[0]) {
        setGrantLabel(grantList[0].grantName);
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to load grants.");
    }
  }, [grantLabel]);

  useEffect(() => {
    void loadCore();
  }, [loadCore]);

  useEffect(() => {
    void loadGrants();
  }, [loadGrants]);

  useEffect(() => {
    if (!grantLabel || !grantMonth) {
      setGrantReport(null);
      return;
    }

    async function loadReport() {
      setGrantLoading(true);
      try {
        const params = new URLSearchParams({ grantLabel, reportingMonth: grantMonth });
        const report = await fetchApi<GrantReportData>(`/api/grants/report?${params}`);
        setGrantReport(report);
      } catch (error) {
        setGrantReport(null);
        toast.error(error instanceof Error ? error.message : "Failed to load grant report.");
      } finally {
        setGrantLoading(false);
      }
    }

    void loadReport();
  }, [grantLabel, grantMonth]);

  useEffect(() => {
    if (options?.reportingMonths.length && !grantMonth) {
      setGrantMonth(options.reportingMonths[options.reportingMonths.length - 1]);
    }
  }, [options, grantMonth]);

  async function handleImport() {
    setImporting(true);
    try {
      const response = await fetch("/api/import", { method: "POST", body: "{}" });
      const json = await response.json();
      if (!response.ok) throw new Error(json?.error?.message ?? "Import failed.");
      toast.success("Assignment data imported successfully.");
      await loadCore();
      await loadGrants();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Import failed.");
    } finally {
      setImporting(false);
    }
  }

  return (
    <div className="min-h-screen bg-slate-100">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-4 py-4 sm:px-6">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-blue-700">
              Mantra4Change · PBL Program Intelligence
            </p>
            <h1 className="text-xl font-semibold text-slate-900">Program Review & Grant Reporting</h1>
          </div>
          <button
            type="button"
            onClick={() => void handleImport()}
            disabled={importing}
            className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
          >
            <RefreshCw className={`h-4 w-4 ${importing ? "animate-spin" : ""}`} />
            {importing ? "Importing…" : "Import assignment data"}
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-7xl space-y-4 px-4 py-6 sm:px-6">
        {options ? (
          <FilterBar options={options} filters={filters} onChange={setFilters} />
        ) : null}

        <nav className="flex flex-wrap gap-2">
          {TABS.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              type="button"
              onClick={() => setTab(id)}
              className={`inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium ${
                tab === id
                  ? "bg-slate-900 text-white"
                  : "bg-white text-slate-700 border border-slate-200 hover:bg-slate-50"
              }`}
            >
              <Icon className="h-4 w-4" />
              {label}
            </button>
          ))}
        </nav>

        {loading ? (
          <div className="rounded-xl border border-slate-200 bg-white p-8 text-center text-sm text-slate-500">
            Loading program data…
          </div>
        ) : null}

        {!loading && tab === "review" && dashboard && districtGeo && blockGeo ? (
          <div className="space-y-4">
            <KpiGrid data={dashboard} />
            <RiskExplanations data={dashboard} />
            <GeographyPanel districtData={districtGeo} blockData={blockGeo} />
          </div>
        ) : null}

        {!loading && tab === "summary" ? (
          <ReviewSummaryPanel summary={summary} dashboard={dashboard} />
        ) : null}

        {!loading && tab === "grant" && options ? (
          <GrantReportingPanel
            grants={grants}
            reportingMonths={options.reportingMonths}
            grantLabel={grantLabel}
            reportingMonth={grantMonth}
            report={grantReport}
            loading={grantLoading}
            onGrantChange={setGrantLabel}
            onMonthChange={setGrantMonth}
          />
        ) : null}

        {!loading && tab === "actions" ? <ActionsPanel actions={actions} /> : null}
      </main>
    </div>
  );
}
