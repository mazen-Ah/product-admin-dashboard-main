import { hashPassword } from "better-auth/crypto";
import {
  ChargingMethod,
  EquipmentOwnership,
  PrismaClient,
  Role,
  WalletMethod,
} from "@/generated/prisma/client";
import { ensureChartAccounts } from "@/lib/accounting";

export const DEMO_PASSWORD = "Password123!";

async function createUser(
  db: PrismaClient,
  input: { name: string; email: string; role: Role },
) {
  const existing = await db.user.findUnique({ where: { email: input.email } });
  if (existing) {
    const account = await db.account.findFirst({
      where: { userId: existing.id, providerId: "credential" },
    });
    if (!account) {
      await db.account.create({
        data: {
          accountId: existing.id,
          providerId: "credential",
          userId: existing.id,
          password: await hashPassword(DEMO_PASSWORD),
        },
      });
    }
    return existing;
  }

  const user = await db.user.create({
    data: {
      name: input.name,
      email: input.email,
      emailVerified: true,
      role: input.role,
    },
  });

  await db.account.create({
    data: {
      accountId: user.id,
      providerId: "credential",
      userId: user.id,
      password: await hashPassword(DEMO_PASSWORD),
    },
  });

  return user;
}

export async function seedDemoData(db: PrismaClient) {
  const lyd = await db.currency.upsert({
    where: { code: "LYD" },
    update: {},
    create: { code: "LYD", name: "دينار ليبي" },
  });

  await db.currency.upsert({
    where: { code: "EGP" },
    update: {},
    create: { code: "EGP", name: "جنيه مصري" },
  });

  const accountsManager = await createUser(db, {
    name: "مدير الحسابات",
    email: "accounts@example.com",
    role: Role.ACCOUNTS_MANAGER,
  });

  const managingPartner = await createUser(db, {
    name: "الشريك المدير",
    email: "managing@example.com",
    role: Role.MANAGING_PARTNER,
  });

  const partner = await createUser(db, {
    name: "شريك",
    email: "partner@example.com",
    role: Role.PARTNER,
  });

  const accountant = await createUser(db, {
    name: "محاسب المشروع",
    email: "accountant@example.com",
    role: Role.PROJECT_ACCOUNTANT,
  });

  const supervisor = await createUser(db, {
    name: "مشرف المشروع",
    email: "supervisor@example.com",
    role: Role.PROJECT_SUPERVISOR,
  });

  let project = await db.project.findFirst({
    where: { name: "مشروع طريق طرابلس التجريبي" },
  });

  if (!project) {
    project = await db.project.create({
      data: {
        name: "مشروع طريق طرابلس التجريبي",
        tradeName: "طريق الساحل",
        location: "طرابلس",
        contractValue: 2500000,
        taxable: false,
        client: {
          create: {
            name: "هيئة الطرق والجسور",
            contact: "info@roads.ly",
          },
        },
        wallets: {
          create: [
            { method: WalletMethod.CASH, currencyId: lyd.id, label: "صندوق نقدي" },
            { method: WalletMethod.BANK, currencyId: lyd.id, label: "حساب مصرفي" },
          ],
        },
      },
    });
  }

  const memberships: { userId: string; role: Role }[] = [
    { userId: managingPartner.id, role: Role.MANAGING_PARTNER },
    { userId: partner.id, role: Role.PARTNER },
    { userId: accountant.id, role: Role.PROJECT_ACCOUNTANT },
    { userId: supervisor.id, role: Role.PROJECT_SUPERVISOR },
  ];

  for (const m of memberships) {
    await db.projectMembership.upsert({
      where: {
        userId_projectId: { userId: m.userId, projectId: project.id },
      },
      update: { role: m.role },
      create: {
        userId: m.userId,
        projectId: project.id,
        role: m.role,
      },
    });
  }

  await db.partnerShare.upsert({
    where: {
      projectId_userId: { projectId: project.id, userId: partner.id },
    },
    update: { sharePercent: 40, managementPercent: 10, capital: 100000, loanBalance: 0 },
    create: {
      projectId: project.id,
      userId: partner.id,
      sharePercent: 40,
      managementPercent: 10,
      capital: 100000,
      loanBalance: 0,
    },
  });

  await db.partnerShare.upsert({
    where: {
      projectId_userId: { projectId: project.id, userId: managingPartner.id },
    },
    update: { sharePercent: 60, managementPercent: 0, capital: 150000, loanBalance: 0 },
    create: {
      projectId: project.id,
      userId: managingPartner.id,
      sharePercent: 60,
      managementPercent: 0,
      capital: 150000,
      loanBalance: 0,
    },
  });

  if ((await db.supplier.count()) === 0) {
    await db.supplier.createMany({
      data: [
        { name: "محجر الساحل", contact: "0910000001", type: "محجر" },
        { name: "ناقلات النور", contact: "0910000002", type: "نقل" },
      ],
    });
  }

  const quarry = await db.supplier.findFirst({ where: { type: "محجر" } });
  const carrier = await db.supplier.findFirst({ where: { type: "نقل" } });

  if ((await db.material.count()) === 0) {
    await db.material.createMany({
      data: [
        { name: "رمل", unit: "m3", code: "SAND" },
        { name: "حصى", unit: "m3", code: "GRAVEL" },
      ],
    });
  }

  if ((await db.truck.count()) === 0) {
    await db.truck.createMany({
      data: [
        { plate: "طرابلس-1234", payloadM3: 12, driver: "أحمد" },
        { plate: "طرابلس-5678", payloadM3: 16, driver: "خالد" },
      ],
    });
  }

  if ((await db.rateCard.count({ where: { projectId: project.id } })) === 0) {
    await db.rateCard.create({
      data: {
        projectId: project.id,
        materialName: "رمل",
        materialPrice: 45,
        haulagePrice: 30,
        quarrySupplierId: quarry?.id,
        carrierSupplierId: carrier?.id,
        effectiveFrom: new Date("2026-01-01"),
      },
    });
  }

  if ((await db.equipment.count({ where: { projectId: project.id } })) === 0) {
    await db.equipment.create({
      data: {
        projectId: project.id,
        name: "مدحلة",
        ownership: EquipmentOwnership.OWNED,
        chargingMethod: ChargingMethod.BY_HOUR,
        hoursPerDay: 8,
        monthlyRate: 12000,
      },
    });
  }

  await ensureChartAccounts();
}

let ensurePromise: Promise<void> | null = null;

export async function ensureDemoReady(db: PrismaClient) {
  if (!ensurePromise) {
    ensurePromise = (async () => {
      try {
        const users = await db.user.count();
        if (users === 0) await seedDemoData(db);
      } catch {
        await seedDemoData(db).catch(() => undefined);
      }
    })();
  }
  await ensurePromise;
}
