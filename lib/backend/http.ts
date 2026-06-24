import { NextResponse } from "next/server";
import { ZodError, type ZodSchema } from "zod";

export class HttpError extends Error {
  status: number;
  details?: unknown;

  constructor(status: number, message: string, details?: unknown) {
    super(message);
    this.status = status;
    this.details = details;
  }
}

export async function parseJson<T>(request: Request, schema: ZodSchema<T>) {
  let body: unknown;

  try {
    body = await request.json();
  } catch {
    throw new HttpError(400, "Request body must be valid JSON.");
  }

  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    throw new HttpError(422, "Validation failed.", parsed.error.flatten());
  }

  return parsed.data;
}

export function ok(data: unknown, status = 200) {
  return NextResponse.json({ data }, { status });
}

export function created(data: unknown) {
  return ok(data, 201);
}

export function noContent() {
  return new NextResponse(null, { status: 204 });
}

export function handleApiError(error: unknown) {
  if (error instanceof HttpError) {
    return NextResponse.json(
      { error: { message: error.message, details: error.details } },
      { status: error.status },
    );
  }

  if (error instanceof ZodError) {
    return NextResponse.json(
      { error: { message: "Validation failed.", details: error.flatten() } },
      { status: 422 },
    );
  }

  console.error(error);
  return NextResponse.json(
    { error: { message: "Unexpected server error." } },
    { status: 500 },
  );
}

export function getSearchParams(request: Request) {
  return new URL(request.url).searchParams;
}
