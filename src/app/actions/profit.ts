"use server";

import {
  canCloseProject,
  canPaySettlement,
  requireProjectAccess,
  requireSession,
  sessionRole,
} from "@/lib/access";
import { postJournal, writeAudit } from "@/lib/accounting";
import { prisma } from "@/lib/prisma";
import { ProjectStatus, WalletMovementKind } from "@/generated/prisma/client";
import { revalidatePath } from "next/cache";

export async function listCollections(projectId: string) {
  await requireProjectAccess(projectId);
  return prisma.collection.findMany({
    where: { projectId },
    include: { wallet: true },
    orderBy: { date: "desc" },
  });
}

export async function createCollection(formData: FormData) {
  const session = await requireSession();
  if (!canPaySettlement(sessionRole(session))) throw new Error("Forbidden");

  const projectId = String(formData.get("projectId") ?? "");
  const walletId = String(formData.get("walletId") ?? "");
  const amount = Number(formData.get("amount") ?? 0);
  await requireProjectAccess(projectId);
  if (amount <= 0) throw new Error("Invalid amount");

  const collection = await prisma.$transaction(async (tx) => {
    const c = await tx.collection.create({
      data: {
        projectId,
        walletId,
        date: new Date(String(formData.get("date") ?? "")),
        amountNative: amount,
        fxRate: 1,
        amountLyd: amount,
        note: String(formData.get("note") ?? "").trim() || null,
      },
    });
    await tx.walletMovement.create({
      data: {
        walletId,
        kind: WalletMovementKind.COLLECTION,
        amountNative: amount,
        fxRate: 1,
        amountLyd: amount,
        note: "تحصيل عميل",
        refType: "Collection",
        refId: c.id,
      },
    });
    return c;
  });

  await postJournal({
    projectId,
    source: "COLLECTION",
    refType: "Collection",
    refId: collection.id,
    memo: "تحصيل",
    lines: [
      { code: "1100", debitLyd: amount },
      { code: "4100", creditLyd: amount },
    ],
  });

  revalidatePath(`/projects/${projectId}/profitability`);
  revalidatePath(`/projects/${projectId}/wallets`);
}

export async function computeSurplus(projectId: string) {
  await requireProjectAccess(projectId);
  const project = await prisma.project.findUniqueOrThrow({ where: { id: projectId } });
  const [collections, expenses, equipmentLogs, unpaidLines, advances, shares, withdrawals] =
    await Promise.all([
      prisma.collection.aggregate({ where: { projectId }, _sum: { amountLyd: true } }),
      prisma.expense.aggregate({ where: { projectId }, _sum: { amountLyd: true } }),
      prisma.equipmentLog.findMany({ where: { projectId } }),
      prisma.bonPayableLine.findMany({
        where: {
          bon: {
            projectId,
            status: { in: ["PENDING", "IN_SETTLEMENT"] },
          },
        },
      }),
      prisma.supplierAdvance.aggregate({
        where: { projectId },
        _sum: { remainingNative: true },
      }),
      prisma.partnerShare.findMany({ where: { projectId } }),
      prisma.partnerDistribution.aggregate({
        where: { projectId },
        _sum: { totalSurplusLyd: true },
      }),
    ]);

  const collected = Number(collections._sum.amountLyd ?? 0);
  const cashCosts =
    Number(expenses._sum.amountLyd ?? 0) +
    equipmentLogs.reduce((s, e) => s + Number(e.cashCostLyd), 0) +
    (
      await prisma.bonPayableLine.findMany({
        where: { bon: { projectId, status: "PAID" } },
      })
    ).reduce((s, l) => s + Number(l.amountLyd), 0);

  const unpaidPayables = unpaidLines.reduce((s, l) => s + Number(l.amountLyd), 0);
  const unclearedAdvances = Number(advances._sum.remainingNative ?? 0);
  const retention =
    (Number(project.contractValue) * Number(project.retentionPercent)) / 100;
  const unpaidLoans = shares.reduce((s, p) => s + Number(p.loanBalance), 0);
  const priorWithdrawals = Number(withdrawals._sum.totalSurplusLyd ?? 0);

  const surplus =
    collected -
    cashCosts -
    unpaidPayables -
    unclearedAdvances -
    retention -
    unpaidLoans -
    priorWithdrawals;

  return {
    collected,
    cashCosts,
    unpaidPayables,
    unclearedAdvances,
    retention,
    unpaidLoans,
    priorWithdrawals,
    surplus,
    shares,
  };
}

export async function createDistribution(formData: FormData) {
  const session = await requireSession();
  if (!canCloseProject(sessionRole(session))) throw new Error("Forbidden");

  const projectId = String(formData.get("projectId") ?? "");
  await requireProjectAccess(projectId);
  const calc = await computeSurplus(projectId);
  if (calc.surplus <= 0) throw new Error("لا فائض للتوزيع");

  const lines = calc.shares.map((s) => {
    const gross = (calc.surplus * Number(s.sharePercent)) / 100;
    const management = (gross * Number(s.managementPercent)) / 100;
    const loan = Math.min(Number(s.loanBalance), Math.max(gross - management, 0));
    const net = gross - management - loan;
    return {
      userId: s.userId,
      sharePercent: s.sharePercent,
      grossLyd: gross,
      managementLyd: management,
      loanRecoveryLyd: loan,
      netLyd: net,
    };
  });

  const dist = await prisma.$transaction(async (tx) => {
    const d = await tx.partnerDistribution.create({
      data: {
        projectId,
        totalSurplusLyd: calc.surplus,
        note: String(formData.get("note") ?? "").trim() || null,
        lines: { create: lines },
      },
    });
    for (const line of lines) {
      if (line.loanRecoveryLyd > 0) {
        await tx.partnerShare.update({
          where: {
            projectId_userId: { projectId, userId: line.userId },
          },
          data: { loanBalance: { decrement: line.loanRecoveryLyd } },
        });
      }
    }
    return d;
  });

  await postJournal({
    projectId,
    source: "DISTRIBUTION",
    refType: "PartnerDistribution",
    refId: dist.id,
    memo: "توزيع فائض",
    lines: [
      { code: "4100", debitLyd: calc.surplus },
      { code: "2100", creditLyd: calc.surplus },
    ],
  });

  await writeAudit({
    userId: session.user.id,
    action: "DISTRIBUTE",
    entity: "PartnerDistribution",
    entityId: dist.id,
  });

  revalidatePath(`/projects/${projectId}/profitability`);
  revalidatePath(`/projects/${projectId}/partner`);
  return dist.id;
}

export async function listCloseout(projectId: string) {
  await requireProjectAccess(projectId);
  let items = await prisma.closeoutItem.findMany({ where: { projectId } });
  if (items.length === 0) {
    const defaults = [
      "تصفية البونات المعلقة",
      "تصفية المستخلصات",
      "تسوية العهد",
      "مطابقة المحافظ",
      "احتساب الاحتجاز",
      "توزيع الشركاء",
      "قفل المشروع",
    ];
    await prisma.closeoutItem.createMany({
      data: defaults.map((labelAr) => ({ projectId, labelAr })),
    });
    items = await prisma.closeoutItem.findMany({ where: { projectId } });
  }
  return items;
}

export async function toggleCloseoutItem(formData: FormData) {
  const session = await requireSession();
  if (!canCloseProject(sessionRole(session))) throw new Error("Forbidden");

  const projectId = String(formData.get("projectId") ?? "");
  const id = String(formData.get("id") ?? "");
  await requireProjectAccess(projectId);

  const item = await prisma.closeoutItem.findFirstOrThrow({ where: { id, projectId } });
  await prisma.closeoutItem.update({
    where: { id },
    data: { done: !item.done, doneAt: !item.done ? new Date() : null },
  });
  revalidatePath(`/projects/${projectId}/closeout`);
}

export async function lockProject(formData: FormData) {
  const session = await requireSession();
  if (!canCloseProject(sessionRole(session))) throw new Error("Forbidden");

  const projectId = String(formData.get("projectId") ?? "");
  await requireProjectAccess(projectId);

  const items = await prisma.closeoutItem.findMany({ where: { projectId } });
  if (items.length && items.some((i) => !i.done)) {
    throw new Error("أكمل قائمة الإغلاق أولاً");
  }

  await prisma.project.update({
    where: { id: projectId },
    data: { status: ProjectStatus.CLOSED, closedAt: new Date() },
  });

  await writeAudit({
    userId: session.user.id,
    action: "CLOSE",
    entity: "Project",
    entityId: projectId,
  });

  revalidatePath(`/projects/${projectId}`);
  revalidatePath(`/projects/${projectId}/closeout`);
}
