"use client";

import { PRIORITY_STYLES } from "@/lib/format";
import type { RecommendedAction } from "@/lib/types";

type Props = { actions: RecommendedAction[] };

export function ActionsPanel({ actions }: Props) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
      <div className="border-b border-slate-200 px-4 py-3">
        <h3 className="text-sm font-semibold text-slate-900">Recommended follow-up actions</h3>
        <p className="text-xs text-slate-500">
          Generated from lowest-performing blocks under current filters.
        </p>
      </div>
      <div className="divide-y divide-slate-100">
        {actions.map((action) => (
          <div key={`${action.block}-${action.linkedMetric}`} className="px-4 py-4">
            <div className="flex flex-wrap items-center gap-2">
              <span
                className={`rounded-full px-2 py-0.5 text-xs font-medium ${PRIORITY_STYLES[action.priority] ?? PRIORITY_STYLES.MEDIUM}`}
              >
                {action.priority}
              </span>
              <span className="text-sm font-medium text-slate-900">
                {action.block} · {action.district}
              </span>
            </div>
            <p className="mt-2 text-sm text-slate-700">{action.description}</p>
            <dl className="mt-3 grid gap-1 text-xs text-slate-500 sm:grid-cols-3">
              <div>
                <dt className="inline">Owner: </dt>
                <dd className="inline text-slate-700">{action.owner}</dd>
              </div>
              <div>
                <dt className="inline">Due: </dt>
                <dd className="inline text-slate-700">
                  {new Date(action.dueDate).toLocaleDateString()}
                </dd>
              </div>
              <div>
                <dt className="inline">Metric: </dt>
                <dd className="inline text-slate-700">{action.linkedMetric}</dd>
              </div>
            </dl>
          </div>
        ))}
        {actions.length === 0 ? (
          <p className="px-4 py-8 text-sm text-slate-500">No actions generated for current filters.</p>
        ) : null}
      </div>
    </div>
  );
}
