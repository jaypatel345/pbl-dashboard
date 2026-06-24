import type { Prisma } from "@prisma/client";
import { prisma } from "../db";

export function listEvidence(args: {
  limit: number;
  offset: number;
  reportingMonth?: Date;
  grantId?: string;
}) {
  return prisma.evidence.findMany({
    where: {
      reportingMonth: args.reportingMonth,
      grantId: args.grantId,
    },
    include: { grant: true },
    orderBy: [{ reportingMonth: "desc" }, { title: "asc" }],
    skip: args.offset,
    take: args.limit,
  });
}

export function getEvidenceById(id: string) {
  return prisma.evidence.findUnique({ where: { id }, include: { grant: true } });
}

export function createEvidence(data: Prisma.EvidenceUncheckedCreateInput) {
  return prisma.evidence.create({ data });
}

export function updateEvidence(id: string, data: Prisma.EvidenceUncheckedUpdateInput) {
  return prisma.evidence.update({ where: { id }, data });
}

export function deleteEvidence(id: string) {
  return prisma.evidence.delete({ where: { id } });
}
