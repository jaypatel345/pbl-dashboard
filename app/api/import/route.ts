import { importAssignmentData } from "@/lib/backend/services/import.service";
import { handleApiError, ok } from "@/lib/backend/http";
import { importAssignmentSchema } from "@/lib/backend/validators";

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const parsed = importAssignmentSchema.safeParse(body);
    const dataDir = parsed.success ? parsed.data.dataDir : undefined;
    return ok(await importAssignmentData(dataDir));
  } catch (error) {
    return handleApiError(error);
  }
}
