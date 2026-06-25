import { getDashboard } from "@/lib/backend/services/program.service";
import { handleApiError, ok } from "@/lib/backend/http";
import { parseFilterParams } from "@/lib/filters";
import { getSearchParams } from "@/lib/backend/http";

export async function GET(request: Request) {
  try {
    const filters = parseFilterParams(getSearchParams(request));
    return ok(await getDashboard(filters));
  } catch (error) {
    return handleApiError(error);
  }
}
