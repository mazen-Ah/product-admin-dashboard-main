"use server";

import {
  canManageExpenses,
  canMutateMasterData,
  requireProjectAccess,
  requireSession,
  sessionRole,
} from "@/lib/access";
import { postJournal, writeAudit } from "@/lib/accounting";
import { prisma } from "@/lib/prisma";
import { ExpenseType, WalletMovementKind } from "@/generated/prisma/client";
import { revalidatePath } from "next/cache";

export async function listExpenses(projectId: string) {
  await requireProjectAccess(projectId);
  return prisma.expense.findMany({
    where: { projectId },
    include: { wallet: true },
    orderBy: { date: "desc" },
  });
}

export async function createExpense(formData: FormData) {
  const session = await requireSession();
  if (!canManageExpenses(sessionRole(session))) throw new Error("Forbidden");

  const projectId = String(formData.get("projectId") ?? "");
  await requireProjectAccess(projectId);
  const amount = Number(formData.get("amount") ?? 0);
  const walletId = String(formData.get("walletId") ?? "");
  if (amount <= 0 || !walletId) throw new Error("Invalid input");

  const type = String(formData.get("type") ?? "OTHER") as ExpenseType;

  const expense = await prisma.$transaction(async (tx) => {
    const e = await tx.expense.create({
      data: {
        projectId,
        type,
        date: new Date(String(formData.get("date") ?? "")),
        description: String(formData.get("description") ?? "").trim(),
        amountNative: amount,
        fxRate: 1,
        amountLyd: amount,
        currencyCode: "LYD",
        walletId,
      },
    });
    await tx.walletMovement.create({
      data: {
        walletId,
        kind: WalletMovementKind.EXPENSE,
        amountNative: -amount,
        fxRate: 1,
        amountLyd: -amount,
        note: e.description,
        refType: "Expense",
        refId: e.id,
      },
    });
    return e;
  });

  await postJournal({
    projectId,
    source: "EXPENSE",
    refType: "Expense",
    refId: expense.id,
    memo: expense.description,
    lines: [
      { code: "5200", debitLyd: amount },
      { code: "1100", creditLyd: amount },
    ],
  });

  await writeAudit({
    userId: session.user.id,
    action: "CREATE",
    entity: "Expense",
    entityId: expense.id,
  });

  revalidatePath(`/projects/${projectId}/expenses`);
  revalidatePath(`/projects/${projectId}/wallets`);
}

export async function listEquipmentLogs(projectId: string) {
  await requireProjectAccess(projectId);
  return prisma.equipmentLog.findMany({
    where: { projectId },
    include: { equipment: true },
    orderBy: { periodStart: "desc" },
  });
}

export async function createEquipmentLog(formData: FormData) {
  const session = await requireSession();
  if (!canMutateMasterData(sessionRole(session)) && !canManageExpenses(sessionRole(session))) {
    throw new Error("Forbidden");
  }

  const projectId = String(formData.get("projectId") ?? "");
  const equipmentId = String(formData.get("equipmentId") ?? "");
  await requireProjectAccess(projectId);

  const equipment = await prisma.equipment.findFirstOrThrow({
    where: { id: equipmentId, projectId },
  });

  const actualHours = Number(formData.get("actualHours") ?? 0);
  const hoursPerDay = Number(equipment.hoursPerDay ?? 8);
  const standardHours = 26 * hoursPerDay;
  const unitRate =
    Number(formData.get("unitRate") ?? 0) ||
    Number(equipment.hourlyRate ?? 0) ||
    (equipment.monthlyRate ? Number(equipment.monthlyRate) / standardHours : 0);

  const cashCostLyd = actualHours * unitRate;
  const booksChargeLyd =
    equipment.ownership === "OWNED" ? actualHours * unitRate : 0;

  const log = await prisma.equipmentLog.create({
    data: {
      projectId,
      equipmentId,
      periodStart: new Date(String(formData.get("periodStart") ?? "")),
      periodEnd: new Date(String(formData.get("periodEnd") ?? "")),
      actualHours,
      standardHours,
      unitRate,
      cashCostLyd: equipment.ownership === "RENTED" ? cashCostLyd : 0,
      booksChargeLyd,
      note: String(formData.get("note") ?? "").trim() || null,
    },
  });

  if (equipment.ownership === "OWNED" && booksChargeLyd > 0) {
    await postJournal({
      projectId,
      source: "EQUIPMENT",
      refType: "EquipmentLog",
      refId: log.id,
      memo: `تحميل ${equipment.name}`,
      lines: [
        { code: "5300", debitLyd: booksChargeLyd },
        { code: "4900", creditLyd: booksChargeLyd },
      ],
    });
  }

  if (equipment.ownership === "RENTED" && cashCostLyd > 0) {
    await postJournal({
      projectId,
      source: "EQUIPMENT",
      refType: "EquipmentLog",
      refId: log.id,
      memo: `إيجار ${equipment.name}`,
      lines: [
        { code: "5300", debitLyd: cashCostLyd },
        { code: "2100", creditLyd: cashCostLyd },
      ],
    });
  }

  revalidatePath(`/projects/${projectId}/equipment`);
}
