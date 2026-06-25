import type { Prisma } from "@/lib/backend/db";
import { prisma } from "../db";

export type SubmissionFilters = {
  reportingMonth?: Date;
  district?: string;
  block?: string;
  grade?: string;
  subject?: string;
};

export function buildSubmissionWhere(filters: SubmissionFilters): Prisma.MonthlySubmissionWhereInput {
  return {
    reportingMonth: filters.reportingMonth,
    grade: filters.grade,
    subject: filters.subject,
    school:
      filters.district || filters.block
        ? {
            district: filters.district,
            block: filters.block,
          }
        : undefined,
  };
}

export function listSubmissions(args: SubmissionFilters & { limit: number; offset: number }) {
  return prisma.monthlySubmission.findMany({
    where: buildSubmissionWhere(args),
    include: { school: true },
    orderBy: [{ reportingMonth: "desc" }, { grade: "asc" }, { subject: "asc" }],
    skip: args.offset,
    take: args.limit,
  });
}

export function countSubmissions(filters: SubmissionFilters) {
  return prisma.monthlySubmission.count({ where: buildSubmissionWhere(filters) });
}

export function getSubmissionById(id: string) {
  return prisma.monthlySubmission.findUnique({ where: { id }, include: { school: true } });
}

export function createSubmission(data: Prisma.MonthlySubmissionUncheckedCreateInput) {
  return prisma.monthlySubmission.create({ data });
}

export function updateSubmission(id: string, data: Prisma.MonthlySubmissionUncheckedUpdateInput) {
  return prisma.monthlySubmission.update({ where: { id }, data });
}

export function deleteSubmission(id: string) {
  return prisma.monthlySubmission.delete({ where: { id } });
}
