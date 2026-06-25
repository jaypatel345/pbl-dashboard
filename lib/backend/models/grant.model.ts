import type { Prisma } from "@/lib/backend/db";
import { prisma } from "../db";

export function listGrants(args: { limit: number; offset: number; reportingMonth?: Date }) {
  return prisma.grant.findMany({
    include: {
      reports: args.reportingMonth ? { where: { reportingMonth: args.reportingMonth } } : true,
      financeLines: args.reportingMonth ? { where: { reportingMonth: args.reportingMonth } } : false,
    },
    orderBy: [{ donor: "asc" }, { grantName: "asc" }],
    skip: args.offset,
    take: args.limit,
  });
}

export function getGrantById(id: string) {
  return prisma.grant.findUnique({
    where: { id },
    include: {
      reports: { orderBy: { reportingMonth: "desc" } },
      financeLines: { orderBy: [{ reportingMonth: "desc" }, { budgetLine: "asc" }] },
      evidences: { orderBy: { reportingMonth: "desc" } },
    },
  });
}

export function findGrantForReport(args: { grantId?: string; grantLabel?: string }) {
  return prisma.grant.findFirst({
    where: args.grantId
      ? { id: args.grantId }
      : {
          OR: [
            { grantCode: args.grantLabel },
            { grantName: args.grantLabel },
            { donor: args.grantLabel },
          ],
        },
  });
}

export function createGrant(data: Prisma.GrantCreateInput) {
  return prisma.grant.create({ data });
}

export function updateGrant(id: string, data: Prisma.GrantUpdateInput) {
  return prisma.grant.update({ where: { id }, data });
}

export function deleteGrant(id: string) {
  return prisma.grant.delete({ where: { id } });
}

export function getGrantReport(grantId: string, reportingMonth: Date) {
  return prisma.grantReport.findUnique({
    where: { grantId_reportingMonth: { grantId, reportingMonth } },
    include: { grant: true },
  });
}

export function getGrantFinance(grantId: string, reportingMonth: Date) {
  return prisma.grantFinanceLine.findMany({
    where: { grantId, reportingMonth },
    orderBy: { budgetLine: "asc" },
  });
}

export function getGrantEvidence(grantId: string, reportingMonth: Date) {
  return prisma.evidence.findMany({
    where: { grantId, reportingMonth },
    orderBy: [{ type: "asc" }, { title: "asc" }],
  });
}
