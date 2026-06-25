"use client";

import type { DashboardFilters, FilterOptions } from "@/lib/types";

type Props = {
  options: FilterOptions;
  filters: DashboardFilters;
  onChange: (filters: DashboardFilters) => void;
};

export function FilterBar({ options, filters, onChange }: Props) {
  const blocks = filters.district ? (options.blocksByDistrict[filters.district] ?? []) : [];

  function update(partial: Partial<DashboardFilters>) {
    const next = { ...filters, ...partial };
    if (partial.district !== undefined && partial.district !== filters.district) {
      next.block = undefined;
    }
    onChange(next);
  }

  return (
    <div className="grid gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm md:grid-cols-5">
      <label className="flex flex-col gap-1 text-sm">
        <span className="font-medium text-slate-700">Reporting month</span>
        <select
          className="rounded-lg border border-slate-300 px-3 py-2"
          value={filters.reportingMonth ?? ""}
          onChange={(e) => update({ reportingMonth: e.target.value || undefined })}
        >
          <option value="">Latest</option>
          {options.reportingMonths.map((month) => (
            <option key={month} value={month}>
              {month}
            </option>
          ))}
        </select>
      </label>

      <label className="flex flex-col gap-1 text-sm">
        <span className="font-medium text-slate-700">District</span>
        <select
          className="rounded-lg border border-slate-300 px-3 py-2"
          value={filters.district ?? ""}
          onChange={(e) => update({ district: e.target.value || undefined })}
        >
          <option value="">All districts</option>
          {options.districts.map((district) => (
            <option key={district} value={district}>
              {district}
            </option>
          ))}
        </select>
      </label>

      <label className="flex flex-col gap-1 text-sm">
        <span className="font-medium text-slate-700">Block</span>
        <select
          className="rounded-lg border border-slate-300 px-3 py-2 disabled:bg-slate-50"
          value={filters.block ?? ""}
          disabled={!filters.district}
          onChange={(e) => update({ block: e.target.value || undefined })}
        >
          <option value="">All blocks</option>
          {blocks.map((block) => (
            <option key={block} value={block}>
              {block}
            </option>
          ))}
        </select>
      </label>

      <label className="flex flex-col gap-1 text-sm">
        <span className="font-medium text-slate-700">Grade</span>
        <select
          className="rounded-lg border border-slate-300 px-3 py-2"
          value={filters.grade ?? ""}
          onChange={(e) => update({ grade: e.target.value || undefined })}
        >
          <option value="">All grades</option>
          {options.grades.map((grade) => (
            <option key={grade} value={grade}>
              {grade}
            </option>
          ))}
        </select>
      </label>

      <label className="flex flex-col gap-1 text-sm">
        <span className="font-medium text-slate-700">Subject</span>
        <select
          className="rounded-lg border border-slate-300 px-3 py-2"
          value={filters.subject ?? ""}
          onChange={(e) => update({ subject: e.target.value || undefined })}
        >
          <option value="">All subjects</option>
          {options.subjects.map((subject) => (
            <option key={subject} value={subject}>
              {subject}
            </option>
          ))}
        </select>
      </label>
    </div>
  );
}
