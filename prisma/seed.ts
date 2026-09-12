import "dotenv/config";
import { hashPassword } from "better-auth/crypto";
import {
  ChargingMethod,
  EquipmentOwnership,
  Role,
  WalletMethod,
} from "../src/generated/prisma/client";
import { prisma } from "../src/lib/prisma";

const DEMO_PASSWORD = "Password123!";

async function createUser(input: {
  name: string;
  email: string;
  role: Role;
}) {
  const existing = await prisma.user.findUnique({ where: { email: input.email } });
  if (existing) return existing;

  const user = await prisma.user.create({
    data: {
      name: input.name,
      email: input.email,
      emailVerified: true,
      role: input.role,
    },
  });

  await prisma.account.create({
    data: {
      accountId: user.id,
      providerId: "credential",
      userId: user.id,
      password: await hashPassword(DEMO_PASSWORD),
    },
  });

  return user;
}

async function main() {
  const lyd = await prisma.currency.upsert({
    where: { code: "LYD" },
    update: {},
    create: { code: "LYD", name: "دينار ليبي" },
  });

  await prisma.currency.upsert({
    where: { code: "EGP" },
    update: {},
    create: { code: "EGP", name: "جنيه مصري" },
  });

  const accountsManager = await createUser({
    name: "مدير الحسابات",
    email: "accounts@example.com",
    role: Role.ACCOUNTS_MANAGER,
  });

  const managingPartner = await createUser({
    name: "الشريك المدير",
    email: "managing@example.com",
    role: Role.MANAGING_PARTNER,
  });

  const partner = await createUser({
    name: "شريك",
    email: "partner@example.com",
    role: Role.PARTNER,
  });

  const accountant = await createUser({
    name: "محاسب المشروع",
    email: "accountant@example.com",
    role: Role.PROJECT_ACCOUNTANT,
  });

  const supervisor = await createUser({
    name: "مشرف المشروع",
    email: "supervisor@example.com",
    role: Role.PROJECT_SUPERVISOR,
  });

  let project = await prisma.project.findFirst({
    where: { name: "مشروع طريق طرابلس التجريبي" },
  });

  if (!project) {
    project = await prisma.project.create({
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
    await prisma.projectMembership.upsert({
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

  await prisma.partnerShare.upsert({
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

  await prisma.partnerShare.upsert({
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

  if ((await prisma.supplier.count()) === 0) {
    await prisma.supplier.createMany({
      data: [
        { name: "محجر الساحل", contact: "0910000001", type: "محجر" },
        { name: "ناقلات النور", contact: "0910000002", type: "نقل" },
      ],
    });
  }

  const quarry = await prisma.supplier.findFirst({ where: { type: "محجر" } });
  const carrier = await prisma.supplier.findFirst({ where: { type: "نقل" } });

  if ((await prisma.material.count()) === 0) {
    await prisma.material.createMany({
      data: [
        { name: "رمل", unit: "m3", code: "SAND" },
        { name: "حصى", unit: "m3", code: "GRAVEL" },
      ],
    });
  }

  if ((await prisma.truck.count()) === 0) {
    await prisma.truck.createMany({
      data: [
        { plate: "طرابلس-1234", payloadM3: 12, driver: "أحمد" },
        { plate: "طرابلس-5678", payloadM3: 16, driver: "خالد" },
      ],
    });
  }

  if ((await prisma.rateCard.count({ where: { projectId: project.id } })) === 0) {
    await prisma.rateCard.create({
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

  if ((await prisma.equipment.count({ where: { projectId: project.id } })) === 0) {
    await prisma.equipment.create({
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

  const { ensureChartAccounts } = await import("../src/lib/accounting");
  await ensureChartAccounts();

  console.log("Seed complete. Demo password:", DEMO_PASSWORD);
  console.log("Accounts Manager:", accountsManager.email);
  console.log("Supervisor (project-scoped):", supervisor.email);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
