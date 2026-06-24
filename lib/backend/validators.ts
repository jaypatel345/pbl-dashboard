import { ActionStatus, EvidenceType, Priority, RiskStatus } from "@prisma/client";
import { z } from "zod";

const dateInput = z
  .string()
  .min(1)
  .transform((value, ctx) => {
    const date = value.length === 7 ? new Date(`${value}-01T00:00:00.000Z`) : new Date(value);
    if (Number.isNaN(date.getTime())) {
      ctx.addIssue({ code: "custom", message: "Invalid date." });
      return z.NEVER;
    }
    return date;
  });

const optionalDateInput = dateInput.optional();

export const filtersSchema = z.object({
  reportingMonth: z.string().optional(),
  district: z.string().optional(),
  block: z.string().optional(),
  grade: z.string().optional(),
  subject: z.string().optional(),
});

export const schoolCreateSchema = z.object({
  schoolCode: z.string().min(1),
  schoolName: z.string().min(1),
  district: z.string().min(1),
  block: z.string().min(1),
});

export const schoolUpdateSchema = schoolCreateSchema.partial();

export const submissionCreateSchema = z.object({
  schoolId: z.string().min(1),
  reportingMonth: dateInput,
  grade: z.string().min(1),
  subject: z.string().min(1),
  pblConducted: z.boolean(),
  evidenceSubmitted: z.boolean(),
  enrollment: z.number().int().nonnegative(),
  attendance: z.number().int().nonnegative(),
  attendancePercentage: z.number().min(0),
  riskStatus: z.nativeEnum(RiskStatus).optional(),
});

export const submissionUpdateSchema = submissionCreateSchema.partial();

export const actionCreateSchema = z.object({
  district: z.string().min(1),
  block: z.string().min(1),
  priority: z.nativeEnum(Priority),
  owner: z.string().min(1),
  dueDate: dateInput,
  status: z.nativeEnum(ActionStatus).default(ActionStatus.OPEN),
  linkedMetric: z.string().min(1),
  description: z.string().min(1),
});

export const actionUpdateSchema = actionCreateSchema.partial();

export const grantCreateSchema = z.object({
  grantCode: z.string().min(1),
  donor: z.string().min(1),
  grantName: z.string().min(1),
  periodStart: dateInput,
  periodEnd: dateInput,
  coveredDistricts: z.string().min(1),
});

export const grantUpdateSchema = grantCreateSchema.partial();

export const evidenceCreateSchema = z.object({
  recordCode: z.string().min(1),
  grantId: z.string().min(1),
  type: z.nativeEnum(EvidenceType),
  donor: z.string().min(1),
  reportingMonth: dateInput,
  district: z.string().min(1),
  title: z.string().min(1),
  summaryOrCaption: z.string().min(1),
  fileName: z.string().min(1),
  relativePath: z.string().min(1),
  usageNote: z.string().optional(),
});

export const evidenceUpdateSchema = evidenceCreateSchema.partial();

export const grantReportQuerySchema = z.object({
  grantId: z.string().optional(),
  grantLabel: z.string().optional(),
  reportingMonth: z.string().min(1),
});

export const importAssignmentSchema = z.object({
  dataDir: z.string().min(1).optional(),
});

export const listQuerySchema = z.object({
  limit: z.coerce.number().int().positive().max(250).default(50),
  offset: z.coerce.number().int().nonnegative().default(0),
  reportingMonth: optionalDateInput,
  district: z.string().optional(),
  block: z.string().optional(),
  grade: z.string().optional(),
  subject: z.string().optional(),
});
