import { getProgramSummary } from "@/lib/backend/services/program.service";
import { handleApiError, ok, getSearchParams } from "@/lib/backend/http";
import { parseFilterParams } from "@/lib/filters";

export async function GET(request: Request) {
  try {
    const filters = parseFilterParams(getSearchParams(request));
    return ok(await getProgramSummary(filters));
  } catch (error) {
    return handleApiError(error);
  }
}
