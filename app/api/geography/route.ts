import { getGeographyPerformance } from "@/lib/backend/services/program.service";
import { handleApiError, ok, getSearchParams } from "@/lib/backend/http";
import { parseFilterParams } from "@/lib/filters";

export async function GET(request: Request) {
  try {
    const params = getSearchParams(request);
    const filters = parseFilterParams(params);
    const level = params.get("level") === "block" ? "block" : "district";
    return ok(await getGeographyPerformance({ ...filters, level }));
  } catch (error) {
    return handleApiError(error);
  }
}
