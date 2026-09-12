"use server";

import { requireProjectAccess } from "@/lib/access";
import { ensureChartAccounts } from "@/lib/accounting";
import { prisma } from "@/lib/prisma";

export async function getCostReport(projectId: string) {
  await requireProjectAccess(projectId);
  const [bons, expenses, equipmentLogs, fxLines, project] = await Promise.all([
    prisma.bon.findMany({
      where: { projectId, status: { not: "CANCELLED" } },
      include: { payableLines: true },
    }),
    prisma.expense.findMany({ where: { projectId } }),
    prisma.equipmentLog.findMany({ where: { projectId }, include: { equipment: true } }),
    prisma.journalLine.findMany({
      where: { entry: { projectId }, account: { code: "5900" } },
    }),
    prisma.project.findUniqueOrThrow({ where: { id: projectId } }),
  ]);

  const supply = bons.reduce(
    (s, b) => s + b.payableLines.reduce((x, l) => x + Number(l.amountLyd), 0),
    0,
  );
  const expenseTotal = expenses.reduce((s, e) => s + Number(e.amountLyd), 0);
  const equipmentCash = equipmentLogs.reduce((s, e) => s + Number(e.cashCostLyd), 0);
  const equipmentBooks = equipmentLogs.reduce((s, e) => s + Number(e.booksChargeLyd), 0);
  const fx = fxLines.reduce((s, l) => s + Number(l.debitLyd) - Number(l.creditLyd), 0);

  return {
    project,
    supply,
    expenses: expenseTotal,
    equipmentCash,
    equipmentBooks,
    fx,
    totalCashCost: supply + expenseTotal + equipmentCash,
    byExpenseType: Object.entries(
      expenses.reduce<Record<string, number>>((acc, e) => {
        acc[e.type] = (acc[e.type] ?? 0) + Number(e.amountLyd);
        return acc;
      }, {}),
    ),
  };
}

export async function getAgingReport(projectId: string) {
  await requireProjectAccess(projectId);
  const project = await prisma.project.findUniqueOrThrow({ where: { id: projectId } });
  const collected = await prisma.collection.aggregate({
    where: { projectId },
    _sum: { amountLyd: true },
  });
  const contract = Number(project.contractValue);
  const retention = (contract * Number(project.retentionPercent)) / 100;
  const collectedLyd = Number(collected._sum.amountLyd ?? 0);
  return {
    contractValue: contract,
    retentionPercent: Number(project.retentionPercent),
    retentionReserve: retention,
    collected: collectedLyd,
    outstanding: Math.max(contract - collectedLyd, 0),
  };
}

export async function listJournals(projectId: string) {
  await requireProjectAccess(projectId);
  await ensureChartAccounts();
  return prisma.journalEntry.findMany({
    where: { projectId },
    include: { lines: { include: { account: true } } },
    orderBy: { date: "desc" },
    take: 100,
  });
}

export async function listAuditLogs(projectId: string) {
  await requireProjectAccess(projectId);
  return prisma.auditLog.findMany({
    orderBy: { createdAt: "desc" },
    take: 100,
    include: { user: true },
  });
}
