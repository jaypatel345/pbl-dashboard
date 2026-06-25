import type { Prisma } from "@/lib/backend/db";
import { prisma } from "../db";

export function listSchools(args: {
  limit: number;
  offset: number;
  district?: string;
  block?: string;
}) {
  const where: Prisma.SchoolWhereInput = {
    district: args.district,
    block: args.block,
  };

  return prisma.school.findMany({
    where,
    orderBy: [{ district: "asc" }, { block: "asc" }, { schoolName: "asc" }],
    skip: args.offset,
    take: args.limit,
  });
}

export function countSchools(where: Prisma.SchoolWhereInput = {}) {
  return prisma.school.count({ where });
}

export function getSchoolById(id: string) {
  return prisma.school.findUnique({
    where: { id },
    include: { submissions: { orderBy: { reportingMonth: "desc" } } },
  });
}

export function createSchool(data: Prisma.SchoolCreateInput) {
  return prisma.school.create({ data });
}

export function updateSchool(id: string, data: Prisma.SchoolUpdateInput) {
  return prisma.school.update({ where: { id }, data });
}

export function deleteSchool(id: string) {
  return prisma.school.delete({ where: { id } });
}
