"use server";

import {
  canPaySettlement,
  requireProjectAccess,
  requireSession,
  sessionRole,
} from "@/lib/access";
import { postJournal, writeAudit } from "@/lib/accounting";
import { prisma } from "@/lib/prisma";
import {
  BonStatus,
  PayableLineType,
  SettlementStatus,
  WalletMovementKind,
} from "@/generated/prisma/client";
import { revalidatePath } from "next/cache";

export async function listSettlements(projectId: string) {
  await requireProjectAccess(projectId);
  return prisma.settlement.findMany({
    where: { projectId },
    include: {
      supplier: true,
      bons: { include: { bon: true } },
      wallet: true,
    },
    orderBy: { createdAt: "desc" },
  });
}

export async function listPendingPayables(projectId: string, supplierId: string) {
  await requireProjectAccess(projectId);
  return prisma.bonPayableLine.findMany({
    where: {
      supplierId,
      bon: {
        projectId,
        status: BonStatus.PENDING,
        kind: "EXTERNAL",
      },
    },
    include: { bon: true, supplier: true },
    orderBy: { createdAt: "asc" },
  });
}

export async function createSettlement(formData: FormData) {
  const session = await requireSession();
  if (!canPaySettlement(sessionRole(session))) throw new Error("Forbidden");

  const projectId = String(formData.get("projectId") ?? "");
  const supplierId = String(formData.get("supplierId") ?? "");
  await requireProjectAccess(projectId);

  const lineIds = formData.getAll("lineId").map(String);
  if (!supplierId || lineIds.length === 0) throw new Error("اختر بنوداً");

  const lines = await prisma.bonPayableLine.findMany({
    where: { id: { in: lineIds }, supplierId },
    include: { bon: true },
  });
  if (lines.some((l) => l.bon.projectId !== projectId || l.bon.status !== BonStatus.PENDING)) {
    throw new Error("بنود غير صالحة");
  }

  const penaltyAmount = Number(formData.get("penaltyAmount") ?? 0);
  const penaltyReason = String(formData.get("penaltyReason") ?? "").trim();
  if (penaltyAmount > 0 && !penaltyReason) throw new Error("سبب الغرامة مطلوب");

  const settlement = await prisma.$transaction(async (tx) => {
    const s = await tx.settlement.create({
      data: {
        projectId,
        supplierId,
        currencyCode: "LYD",
        status: SettlementStatus.OPEN,
        penaltyAmount,
        penaltyReason: penaltyReason || null,
        bons: {
          create: lines.map((l) => ({
            bonId: l.bonId,
            lineType: l.type,
            amountNative: l.amountNative,
            amountLyd: l.amountLyd,
          })),
        },
      },
    });
    await tx.bon.updateMany({
      where: { id: { in: [...new Set(lines.map((l) => l.bonId))] } },
      data: { status: BonStatus.IN_SETTLEMENT },
    });
    return s;
  });

  await writeAudit({
    userId: session.user.id,
    action: "CREATE",
    entity: "Settlement",
    entityId: settlement.id,
  });

  revalidatePath(`/projects/${projectId}/settlements`);
  revalidatePath(`/projects/${projectId}/bons`);
  return settlement.id;
}

export async function paySettlement(formData: FormData) {
  const session = await requireSession();
  if (!canPaySettlement(sessionRole(session))) throw new Error("Forbidden");

  const projectId = String(formData.get("projectId") ?? "");
  const settlementId = String(formData.get("id") ?? "");
  const walletId = String(formData.get("walletId") ?? "");
  await requireProjectAccess(projectId);

  const settlement = await prisma.settlement.findFirstOrThrow({
    where: { id: settlementId, projectId },
    include: { bons: true },
  });
  if (settlement.status === SettlementStatus.PAID || settlement.status === SettlementStatus.REVERSED) {
    throw new Error("المستخلص مغلق");
  }

  const selected = formData.getAll("settlementBonId").map(String);
  const toPay = settlement.bons.filter((b) => !b.paid && (selected.length === 0 || selected.includes(b.id)));
  if (toPay.length === 0) throw new Error("لا بنود للدفع");

  let gross = toPay.reduce((s, b) => s + Number(b.amountLyd), 0);
  const penalty = Number(settlement.penaltyAmount);
  if (settlement.status === SettlementStatus.OPEN) gross -= penalty;

  const advances = await prisma.supplierAdvance.findMany({
    where: {
      projectId,
      supplierId: settlement.supplierId,
      remainingNative: { gt: 0 },
    },
    orderBy: { date: "asc" },
  });

  let remaining = Math.max(gross, 0);
  const advanceApps: { advanceId: string; amountNative: number }[] = [];
  for (const adv of advances) {
    if (remaining <= 0) break;
    const use = Math.min(Number(adv.remainingNative), remaining);
    advanceApps.push({ advanceId: adv.id, amountNative: use });
    remaining -= use;
  }

  const payAmount = remaining;

  await prisma.$transaction(async (tx) => {
    for (const app of advanceApps) {
      await tx.supplierAdvance.update({
        where: { id: app.advanceId },
        data: { remainingNative: { decrement: app.amountNative } },
      });
      await tx.settlementAdvance.create({
        data: {
          settlementId,
          advanceId: app.advanceId,
          amountNative: app.amountNative,
        },
      });
    }

    await tx.settlementBon.updateMany({
      where: { id: { in: toPay.map((b) => b.id) } },
      data: { paid: true },
    });

    const unpaidLeft = await tx.settlementBon.count({
      where: { settlementId, paid: false },
    });

    if (payAmount > 0) {
      await tx.walletMovement.create({
        data: {
          walletId,
          kind: WalletMovementKind.SETTLEMENT_PAY,
          amountNative: -payAmount,
          fxRate: 1,
          amountLyd: -payAmount,
          note: `مستخلص ${settlementId}`,
          refType: "Settlement",
          refId: settlementId,
        },
      });
    }

    await tx.settlement.update({
      where: { id: settlementId },
      data: {
        walletId,
        paidAmountNative: { increment: payAmount },
        paidAmountLyd: { increment: payAmount },
        paidAt: new Date(),
        status: unpaidLeft === 0 ? SettlementStatus.PAID : SettlementStatus.PARTIALLY_PAID,
      },
    });

    if (unpaidLeft === 0) {
      const bonIds = [...new Set(settlement.bons.map((b) => b.bonId))];
      for (const bonId of bonIds) {
        const lines = await tx.bonPayableLine.findMany({ where: { bonId } });
        const paidLines = await tx.settlementBon.findMany({
          where: { bonId, paid: true },
        });
        const paidKeys = new Set(paidLines.map((p) => `${p.bonId}:${p.lineType}`));
        const allPaid = lines.every((l) => paidKeys.has(`${bonId}:${l.type}`));
        if (allPaid) {
          await tx.bon.update({
            where: { id: bonId },
            data: { status: BonStatus.PAID },
          });
        }
      }
    }

    await tx.ledgerEntry.create({
      data: {
        projectId,
        settlementId,
        kind: "SETTLEMENT_PAY",
        amountLyd: payAmount,
        memo: `دفع مستخلص للمورد`,
      },
    });
  });

  if (payAmount > 0) {
    await postJournal({
      projectId,
      source: "SETTLEMENT",
      refType: "Settlement",
      refId: settlementId,
      memo: "دفع مستخلص",
      lines: [
        { code: "2100", debitLyd: payAmount },
        { code: "1100", creditLyd: payAmount },
      ],
    });
  }

  await writeAudit({
    userId: session.user.id,
    action: "PAY",
    entity: "Settlement",
    entityId: settlementId,
  });

  revalidatePath(`/projects/${projectId}/settlements`);
  revalidatePath(`/projects/${projectId}/bons`);
  revalidatePath(`/projects/${projectId}/wallets`);
}

export async function reverseSettlement(formData: FormData) {
  const session = await requireSession();
  if (!canPaySettlement(sessionRole(session))) throw new Error("Forbidden");

  const projectId = String(formData.get("projectId") ?? "");
  const settlementId = String(formData.get("id") ?? "");
  await requireProjectAccess(projectId);

  const settlement = await prisma.settlement.findFirstOrThrow({
    where: { id: settlementId, projectId },
    include: { bons: true, advancesApplied: true },
  });

  if (settlement.status === SettlementStatus.REVERSED) throw new Error("معكوس مسبقاً");

  await prisma.$transaction(async (tx) => {
    if (settlement.walletId && Number(settlement.paidAmountLyd) > 0) {
      await tx.walletMovement.create({
        data: {
          walletId: settlement.walletId,
          kind: WalletMovementKind.REVERSAL,
          amountNative: Number(settlement.paidAmountLyd),
          fxRate: 1,
          amountLyd: Number(settlement.paidAmountLyd),
          note: `عكس مستخلص ${settlementId}`,
          refType: "Settlement",
          refId: settlementId,
        },
      });
    }

    for (const app of settlement.advancesApplied) {
      await tx.supplierAdvance.update({
        where: { id: app.advanceId },
        data: { remainingNative: { increment: app.amountNative } },
      });
    }

    const bonIds = [...new Set(settlement.bons.map((b) => b.bonId))];
    await tx.bon.updateMany({
      where: { id: { in: bonIds } },
      data: { status: BonStatus.PENDING },
    });

    await tx.settlement.update({
      where: { id: settlementId },
      data: { status: SettlementStatus.REVERSED },
    });
  });

  await writeAudit({
    userId: session.user.id,
    action: "REVERSE",
    entity: "Settlement",
    entityId: settlementId,
    detail: String(formData.get("reason") ?? "").trim() || null,
  });

  revalidatePath(`/projects/${projectId}/settlements`);
  revalidatePath(`/projects/${projectId}/bons`);
}

export async function createAdvance(formData: FormData) {
  const session = await requireSession();
  if (!canPaySettlement(sessionRole(session))) throw new Error("Forbidden");

  const projectId = String(formData.get("projectId") ?? "");
  await requireProjectAccess(projectId);
  const amount = Number(formData.get("amount") ?? 0);
  if (amount <= 0) throw new Error("Invalid amount");

  await prisma.supplierAdvance.create({
    data: {
      projectId,
      supplierId: String(formData.get("supplierId") ?? ""),
      currencyCode: "LYD",
      amountNative: amount,
      amountLyd: amount,
      remainingNative: amount,
      note: String(formData.get("note") ?? "").trim() || null,
    },
  });

  revalidatePath(`/projects/${projectId}/settlements`);
}

export async function supplierStatement(projectId: string, supplierId: string) {
  await requireProjectAccess(projectId);
  const [lines, advances, settlements] = await Promise.all([
    prisma.bonPayableLine.findMany({
      where: { supplierId, bon: { projectId, status: { not: "CANCELLED" } } },
      include: { bon: true },
    }),
    prisma.supplierAdvance.findMany({ where: { projectId, supplierId } }),
    prisma.settlement.findMany({
      where: { projectId, supplierId },
      include: { bons: true },
    }),
  ]);
  return { lines, advances, settlements };
}
