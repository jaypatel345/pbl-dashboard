import { listGrants } from "@/lib/backend/models/grant.model";
import { handleApiError, ok, getSearchParams } from "@/lib/backend/http";

export async function GET(request: Request) {
  try {
    const params = getSearchParams(request);
    const reportingMonth = params.get("reportingMonth");
    const month =
      reportingMonth && reportingMonth.length >= 7
        ? new Date(`${reportingMonth.slice(0, 7)}-01T00:00:00.000Z`)
        : undefined;

    const grants = await listGrants({ limit: 50, offset: 0, reportingMonth: month });
    return ok(
      grants.map((g: (typeof grants)[number]) => ({
        id: g.id,
        grantCode: g.grantCode,
        donor: g.donor,
        grantName: g.grantName,
        coveredDistricts: g.coveredDistricts,
        periodStart: g.periodStart.toISOString().slice(0, 10),
        periodEnd: g.periodEnd.toISOString().slice(0, 10),
      })),
    );
  } catch (error) {
    return handleApiError(error);
  }
}
