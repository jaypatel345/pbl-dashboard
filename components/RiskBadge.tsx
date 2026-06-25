import { RISK_STYLES } from "@/lib/format";
import type { RiskStatus } from "@/lib/types";

export function RiskBadge({ status, label }: { status: RiskStatus; label: string }) {
  const styles = RISK_STYLES[status];
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${styles.bg} ${styles.text} ${styles.border}`}
    >
      {label}
    </span>
  );
}
