"use server";

import {
  canConfirmNegativeWallet,
  canPaySettlement,
  requireProjectAccess,
  requireSession,
  sessionRole,
} from "@/lib/access";
import { postJournal, walletBalanceLyd, writeAudit } from "@/lib/accounting";
import { prisma } from "@/lib/prisma";
import { WalletMethod, WalletMovementKind } from "@/generated/prisma/client";
import { revalidatePath } from "next/cache";

export async function listWallets(projectId: string) {
  await requireProjectAccess(projectId);
  const wallets = await prisma.wallet.findMany({
    where: { projectId },
    include: { currency: true, movements: { orderBy: { createdAt: "desc" }, take: 20 } },
  });
  return Promise.all(
    wallets.map(async (w) => {
      const [lyd, native] = await Promise.all([
        walletBalanceLyd(w.id),
        prisma.walletMovement.aggregate({
          where: { walletId: w.id },
          _sum: { amountNative: true },
        }),
      ]);
      return {
        ...w,
        balanceLyd: lyd,
        balanceNative: Number(native._sum.amountNative ?? 0),
      };
    }),
  );
}

export async function addOpeningBalance(formData: FormData) {
  const session = await requireSession();
  if (!canPaySettlement(sessionRole(session))) throw new Error("Forbidden");

  const projectId = String(formData.get("projectId") ?? "");
  const walletId = String(formData.get("walletId") ?? "");
  const amount = Number(formData.get("amount") ?? 0);
  await requireProjectAccess(projectId);
  if (!amount) throw new Error("Invalid amount");

  await prisma.walletMovement.create({
    data: {
      walletId,
      kind: WalletMovementKind.OPENING,
      amountNative: amount,
      fxRate: 1,
      amountLyd: amount,
      note: String(formData.get("note") ?? "").trim() || "رصيد افتتاحي",
    },
  });

  await postJournal({
    projectId,
    source: "OPENING",
    refType: "Wallet",
    refId: walletId,
    memo: "رصيد افتتاحي",
    lines: [
      { code: amount > 0 ? "1100" : "2100", debitLyd: Math.abs(amount) },
      { code: amount > 0 ? "4100" : "1100", creditLyd: Math.abs(amount) },
    ],
  });

  revalidatePath(`/projects/${projectId}/wallets`);
}

export async function transferWallet(formData: FormData) {
  const session = await requireSession();
  if (!canPaySettlement(sessionRole(session))) throw new Error("Forbidden");

  const projectId = String(formData.get("projectId") ?? "");
  const fromWalletId = String(formData.get("fromWalletId") ?? "");
  const toWalletId = String(formData.get("toWalletId") ?? "");
  const amountOut = Number(formData.get("amountOut") ?? 0);
  const amountIn = Number(formData.get("amountIn") ?? 0);
  const fxRate = Number(formData.get("fxRate") ?? 1);
  const confirmNegative = formData.get("confirmNegative") === "on";
  await requireProjectAccess(projectId);

  if (amountOut <= 0 || amountIn <= 0) throw new Error("Invalid amounts");

  const fromBal = await walletBalanceLyd(fromWalletId);
  const outLyd = amountOut * (await getWalletFx(fromWalletId));
  if (fromBal - outLyd < 0) {
    if (!confirmNegative || !canConfirmNegativeWallet(sessionRole(session))) {
      throw new Error("الرصيد سيصبح سالباً — يلزم تأكيد الشريك المدير");
    }
  }

  const inLyd = amountIn * fxRate;
  const fxDiff = outLyd - inLyd;

  await prisma.$transaction(async (tx) => {
    await tx.walletMovement.create({
      data: {
        walletId: fromWalletId,
        kind: WalletMovementKind.TRANSFER_OUT,
        amountNative: -amountOut,
        fxRate: await getWalletFx(fromWalletId),
        amountLyd: -outLyd,
        note: "تحويل خارج",
        refType: "Transfer",
        refId: toWalletId,
        confirmedByMp: confirmNegative,
      },
    });
    await tx.walletMovement.create({
      data: {
        walletId: toWalletId,
        kind: WalletMovementKind.TRANSFER_IN,
        amountNative: amountIn,
        fxRate,
        amountLyd: inLyd,
        note: "تحويل وارد",
        refType: "Transfer",
        refId: fromWalletId,
      },
    });
  });

  if (Math.abs(fxDiff) > 0.001) {
    await postJournal({
      projectId,
      source: "FX",
      memo: "فرق تحويل عملة",
      lines:
        fxDiff > 0
          ? [
              { code: "5900", debitLyd: fxDiff },
              { code: "1100", creditLyd: fxDiff },
            ]
          : [
              { code: "1100", debitLyd: -fxDiff },
              { code: "5900", creditLyd: -fxDiff },
            ],
    });
  }

  await writeAudit({
    userId: session.user.id,
    action: "TRANSFER",
    entity: "Wallet",
    entityId: fromWalletId,
  });

  revalidatePath(`/projects/${projectId}/wallets`);
}

async function getWalletFx(_walletId: string) {
  return 1;
}

export async function listCustodies(projectId: string) {
  await requireProjectAccess(projectId);
  return prisma.custody.findMany({
    where: { projectId },
    include: { person: true, currency: true },
  });
}

export async function upsertCustody(formData: FormData) {
  const session = await requireSession();
  if (!canPaySettlement(sessionRole(session))) throw new Error("Forbidden");

  const projectId = String(formData.get("projectId") ?? "");
  const personId = String(formData.get("personId") ?? "");
  const currencyId = String(formData.get("currencyId") ?? "");
  const amount = Number(formData.get("amount") ?? 0);
  const walletId = String(formData.get("walletId") ?? "");
  await requireProjectAccess(projectId);

  await prisma.$transaction(async (tx) => {
    await tx.custody.upsert({
      where: {
        projectId_personId_currencyId: { projectId, personId, currencyId },
      },
      create: {
        projectId,
        personId,
        currencyId,
        balanceNative: amount,
        balanceLyd: amount,
      },
      update: {
        balanceNative: { increment: amount },
        balanceLyd: { increment: amount },
      },
    });
    if (walletId && amount !== 0) {
      await tx.walletMovement.create({
        data: {
          walletId,
          kind: amount > 0 ? WalletMovementKind.CUSTODY_OUT : WalletMovementKind.CUSTODY_IN,
          amountNative: -amount,
          fxRate: 1,
          amountLyd: -amount,
          note: "عهدة",
          refType: "Custody",
          refId: personId,
        },
      });
    }
  });

  revalidatePath(`/projects/${projectId}/wallets`);
}

export async function getPartnerView(projectId: string) {
  await requireProjectAccess(projectId);
  const [shares, wallets, bons, expenses, equipmentLogs, collections] = await Promise.all([
    prisma.partnerShare.findMany({
      where: { projectId },
      include: { user: true },
    }),
    listWallets(projectId),
    prisma.bon.findMany({
      where: { projectId, status: { not: "CANCELLED" } },
      include: { payableLines: true },
    }),
    prisma.expense.findMany({ where: { projectId } }),
    prisma.equipmentLog.findMany({ where: { projectId } }),
    prisma.collection.findMany({ where: { projectId } }),
  ]);

  const supplyCost = bons.reduce(
    (s, b) => s + b.payableLines.reduce((x, l) => x + Number(l.amountLyd), 0),
    0,
  );
  const expenseCost = expenses.reduce((s, e) => s + Number(e.amountLyd), 0);
  const equipCash = equipmentLogs.reduce((s, e) => s + Number(e.cashCostLyd), 0);
  const collected = collections.reduce((s, c) => s + Number(c.amountLyd), 0);

  return {
    shares,
    wallets,
    costs: {
      supply: supplyCost,
      expenses: expenseCost,
      equipmentCash: equipCash,
      totalCash: supplyCost + expenseCost + equipCash,
    },
    collected,
  };
}

export async function ensureProjectWallets(projectId: string) {
  const lyd = await prisma.currency.findUniqueOrThrow({ where: { code: "LYD" } });
  for (const method of [WalletMethod.CASH, WalletMethod.BANK] as const) {
    await prisma.wallet.upsert({
      where: {
        projectId_method_currencyId: {
          projectId,
          method,
          currencyId: lyd.id,
        },
      },
      update: {},
      create: {
        projectId,
        method,
        currencyId: lyd.id,
        label: method === "CASH" ? "صندوق نقدي" : "حساب مصرفي",
      },
    });
  }
}
