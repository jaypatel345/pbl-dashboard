import { filtersSchema } from "./backend/validators";

export function parseFilterParams(searchParams: URLSearchParams) {
  const parsed = filtersSchema.safeParse({
    reportingMonth: searchParams.get("reportingMonth") ?? undefined,
    district: searchParams.get("district") ?? undefined,
    block: searchParams.get("block") ?? undefined,
    grade: searchParams.get("grade") ?? undefined,
    subject: searchParams.get("subject") ?? undefined,
  });

  return parsed.success ? parsed.data : {};
}
