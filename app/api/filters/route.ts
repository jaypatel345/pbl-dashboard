import { getFilterOptions } from "@/lib/backend/services/program.service";
import { handleApiError, ok } from "@/lib/backend/http";

export async function GET() {
  try {
    return ok(await getFilterOptions());
  } catch (error) {
    return handleApiError(error);
  }
}
