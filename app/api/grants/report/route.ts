import { buildGrantReport } from "@/lib/backend/services/grant.service";
import { handleApiError, ok, getSearchParams } from "@/lib/backend/http";
import { grantReportQuerySchema } from "@/lib/backend/validators";

export async function GET(request: Request) {
  try {
    const params = getSearchParams(request);
    const parsed = grantReportQuerySchema.safeParse({
      grantId: params.get("grantId") ?? undefined,
      grantLabel: params.get("grantLabel") ?? undefined,
      reportingMonth: params.get("reportingMonth") ?? "",
    });

    if (!parsed.success) {
      return handleApiError(parsed.error);
    }

    const report = await buildGrantReport(parsed.data);
    return ok(report);
  } catch (error) {
    return handleApiError(error);
  }
}
