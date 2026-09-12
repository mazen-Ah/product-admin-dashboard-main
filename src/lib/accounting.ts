import { prisma } from "@/lib/prisma";

export async function writeAudit(input: {
  userId?: string | null;
  action: string;
  entity: string;
  entityId?: string | null;
  detail?: string | null;
}) {
  await prisma.auditLog.create({
    data: {
      userId: input.userId ?? null,
      action: input.action,
      entity: input.entity,
      entityId: input.entityId ?? null,
      detail: input.detail ?? null,
    },
  });
}

export async function ensureChartAccounts() {
  const accounts = [
    { code: "1100", nameAr: "نقدية وصناديق", nameEn: "Cash" },
    { code: "1110", nameAr: "بنوك", nameEn: "Bank" },
    { code: "1200", nameAr: "ذمم عملاء (مرجعي)", nameEn: "Client AR memo" },
    { code: "1250", nameAr: "احتجاز (مرجعي)", nameEn: "Retention memo" },
    { code: "2100", nameAr: "ذمم موردين", nameEn: "Supplier AP" },
    { code: "4100", nameAr: "تحصيلات", nameEn: "Collections" },
    { code: "4900", nameAr: "تحميل معدات مملوكة", nameEn: "Owned equipment charge" },
    { code: "5100", nameAr: "تكلفة توريد", nameEn: "Supply cost" },
    { code: "5200", nameAr: "مصروفات", nameEn: "Expenses" },
    { code: "5300", nameAr: "تكلفة معدات", nameEn: "Equipment cost" },
    { code: "5900", nameAr: "فروق عملة", nameEn: "FX difference" },
  ];
  for (const a of accounts) {
    await prisma.chartAccount.upsert({
      where: { code: a.code },
      update: { nameAr: a.nameAr, nameEn: a.nameEn },
      create: a,
    });
  }
}

export async function postJournal(input: {
  projectId: string;
  source: "SETTLEMENT" | "WALLET_TRANSFER" | "EXPENSE" | "FX" | "COLLECTION" | "EQUIPMENT" | "DISTRIBUTION" | "OPENING" | "MANUAL";
  refType?: string;
  refId?: string;
  memo?: string;
  lines: { code: string; debitLyd?: number; creditLyd?: number }[];
}) {
  await ensureChartAccounts();
  const codes = input.lines.map((l) => l.code);
  const accounts = await prisma.chartAccount.findMany({ where: { code: { in: codes } } });
  const byCode = Object.fromEntries(accounts.map((a) => [a.code, a.id]));

  await prisma.journalEntry.create({
    data: {
      projectId: input.projectId,
      source: input.source,
      refType: input.refType,
      refId: input.refId,
      memo: input.memo,
      lines: {
        create: input.lines.map((l) => ({
          accountId: byCode[l.code],
          debitLyd: l.debitLyd ?? 0,
          creditLyd: l.creditLyd ?? 0,
        })),
      },
    },
  });
}

export async function walletBalanceLyd(walletId: string) {
  const agg = await prisma.walletMovement.aggregate({
    where: { walletId },
    _sum: { amountLyd: true },
  });
  return Number(agg._sum.amountLyd ?? 0);
}
