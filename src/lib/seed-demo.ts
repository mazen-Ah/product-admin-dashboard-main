import { hashPassword } from "better-auth/crypto";
import {
  BonKind,
  BonStatus,
  ChargingMethod,
  EquipmentOwnership,
  ExpenseType,
  PayableLineType,
  PrismaClient,
  ProjectStatus,
  Role,
  SettlementStatus,
  WalletMethod,
  WalletMovementKind,
} from "@/generated/prisma/client";
import { ensureChartAccounts } from "@/lib/accounting";

export const DEMO_PASSWORD = "Password123!";

export const DEMO_USER_IDS = {
  accounts: "demo-user-accounts",
  managing: "demo-user-managing",
  partner: "demo-user-partner",
  accountant: "demo-user-accountant",
  supervisor: "demo-user-supervisor",
} as const;

export const DEMO_PROJECT_IDS = {
  tripoli: "demo-project-tripoli",
  misrata: "demo-project-misrata",
  benghazi: "demo-project-benghazi",
} as const;

function d(y: number, m: number, day: number) {
  return new Date(Date.UTC(y, m - 1, day, 10, 0, 0));
}

function addDays(base: Date, days: number) {
  const x = new Date(base);
  x.setUTCDate(x.getUTCDate() + days);
  return x;
}

async function createUser(
  db: PrismaClient,
  input: { id: string; name: string; email: string; role: Role },
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
      id: input.id,
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

async function ensureMembership(
  db: PrismaClient,
  projectId: string,
  userId: string,
  role: Role,
) {
  await db.projectMembership.upsert({
    where: { userId_projectId: { userId, projectId } },
    update: { role },
    create: { userId, projectId, role },
  });
}

async function seedYearActivity(
  db: PrismaClient,
  ctx: {
    projectId: string;
    cashWalletId: string;
    bankWalletId: string;
    quarryId: string;
    carrierId: string;
    materials: { id: string; name: string; price: number; haul: number }[];
    trucks: { id: string; plate: string; payload: number }[];
    equipmentIds: string[];
    partnerId: string;
    managingPartnerId: string;
    accountantId: string;
    supervisorId: string;
    lydId: string;
    months: { y: number; m: number }[];
    workDaysPerMonth: number;
    bonsPerDay: number;
    seqStart: number;
    paperPrefix: string;
    openingCash: number;
    openingBank: number;
    collectionEachQuarter: number;
  },
) {
  const {
    projectId,
    cashWalletId,
    bankWalletId,
    quarryId,
    carrierId,
    materials,
    trucks,
    equipmentIds,
    partnerId,
    managingPartnerId,
    accountantId,
    supervisorId,
    lydId,
    months,
    workDaysPerMonth,
    bonsPerDay,
    paperPrefix,
    openingCash,
    openingBank,
    collectionEachQuarter,
  } = ctx;

  if ((await db.walletMovement.count({ where: { walletId: cashWalletId } })) === 0) {
    await db.walletMovement.createMany({
      data: [
        {
          walletId: cashWalletId,
          kind: WalletMovementKind.OPENING,
          amountNative: openingCash,
          amountLyd: openingCash,
          note: "رصيد افتتاحي نقدي",
          createdAt: d(months[0].y, months[0].m, 1),
        },
        {
          walletId: bankWalletId,
          kind: WalletMovementKind.OPENING,
          amountNative: openingBank,
          amountLyd: openingBank,
          note: "رصيد افتتاحي مصرفي",
          createdAt: d(months[0].y, months[0].m, 1),
        },
      ],
    });
  }

  await db.custody.upsert({
    where: {
      projectId_personId_currencyId: {
        projectId,
        personId: accountantId,
        currencyId: lydId,
      },
    },
    update: { balanceNative: 8500, balanceLyd: 8500 },
    create: {
      projectId,
      personId: accountantId,
      currencyId: lydId,
      balanceNative: 8500,
      balanceLyd: 8500,
    },
  });

  let seq = ctx.seqStart;
  const pendingBons: {
    id: string;
    supplierId: string;
    lineType: PayableLineType;
    amount: number;
    monthKey: string;
  }[] = [];

  for (const { y, m } of months) {
    const monthKey = `${y}-${m}`;
    for (let w = 0; w < workDaysPerMonth; w++) {
      const day = 3 + w * 3;
      if (day > 27) continue;
      const date = d(y, m, day);
      const signedTrips = bonsPerDay + (w % 2);
      const tally = await db.tally.create({
        data: {
          projectId,
          date,
          signedTrips,
          notes: `تالي يوم ${day}/${m}/${y}`,
        },
      });

      for (let b = 0; b < bonsPerDay; b++) {
        const mat = materials[(seq + b) % materials.length];
        const truck = trucks[(seq + b) % trucks.length];
        const trips = 1;
        const qty = Number(truck.payload);
        const net = qty;
        const matAmt = net * mat.price;
        const haulAmt = net * mat.haul;
        const kind = b % 7 === 0 ? BonKind.INTERNAL : BonKind.EXTERNAL;
        const status =
          m >= 8 && w === workDaysPerMonth - 1 && b >= bonsPerDay - 2
            ? BonStatus.PENDING
            : BonStatus.PAID;

        const currentSeq = seq++;
        const bon = await db.bon.create({
          data: {
            projectId,
            kind,
            status,
            seq: currentSeq,
            paperSerial: `${paperPrefix}-${y}${String(m).padStart(2, "0")}-${String(currentSeq).padStart(4, "0")}`,
            issuerSupplierId: kind === BonKind.EXTERNAL ? quarryId : null,
            date,
            materialId: mat.id,
            materialName: mat.name,
            truckId: truck.id,
            truckPlate: truck.plate,
            trips,
            qtyM3: qty,
            deductionM3: 0,
            netM3: net,
            materialPrice: mat.price,
            haulagePrice: mat.haul,
            tallyId: tally.id,
            payableLines:
              kind === BonKind.EXTERNAL
                ? {
                    create: [
                      {
                        type: PayableLineType.MATERIAL,
                        supplierId: quarryId,
                        unitPrice: mat.price,
                        amountNative: matAmt,
                        amountLyd: matAmt,
                      },
                      {
                        type: PayableLineType.HAULAGE,
                        supplierId: carrierId,
                        unitPrice: mat.haul,
                        amountNative: haulAmt,
                        amountLyd: haulAmt,
                      },
                    ],
                  }
                : undefined,
          },
          include: { payableLines: true },
        });

        for (const line of bon.payableLines) {
          pendingBons.push({
            id: bon.id,
            supplierId: line.supplierId,
            lineType: line.type,
            amount: Number(line.amountLyd),
            monthKey,
          });
        }
      }
    }

    const expenseRows: {
      type: ExpenseType;
      description: string;
      amount: number;
      day: number;
      walletId: string;
    }[] = [
      {
        type: ExpenseType.DIESEL,
        description: `ديزل معدات — ${m}/${y}`,
        amount: 4200 + m * 80,
        day: 5,
        walletId: cashWalletId,
      },
      {
        type: ExpenseType.SUBSISTENCE,
        description: `إعاشة موقع — ${m}/${y}`,
        amount: 1800,
        day: 12,
        walletId: cashWalletId,
      },
      {
        type: ExpenseType.PAYROLL,
        description: `أجور عمال — ${m}/${y}`,
        amount: 15000,
        day: 28,
        walletId: bankWalletId,
      },
      {
        type: ExpenseType.GRATUITY,
        description: `إكراميات ميدانية — ${m}/${y}`,
        amount: 350 + (m % 3) * 50,
        day: 18,
        walletId: cashWalletId,
      },
      {
        type: ExpenseType.TRANSFER_COMMISSION,
        description: `عمولة تحويل بنكي — ${m}/${y}`,
        amount: 75,
        day: 20,
        walletId: bankWalletId,
      },
      {
        type: ExpenseType.OTHER,
        description: `مصروفات متنوعة — ${m}/${y}`,
        amount: 600 + m * 20,
        day: 22,
        walletId: cashWalletId,
      },
    ];

    for (const e of expenseRows) {
      const amount = e.amount;
      const date = d(y, m, e.day);
      const expense = await db.expense.create({
        data: {
          projectId,
          type: e.type,
          date,
          description: e.description,
          amountNative: amount,
          amountLyd: amount,
          walletId: e.walletId,
        },
      });
      await db.walletMovement.create({
        data: {
          walletId: e.walletId,
          kind: WalletMovementKind.EXPENSE,
          amountNative: -amount,
          amountLyd: -amount,
          note: e.description,
          refType: "Expense",
          refId: expense.id,
          createdAt: date,
        },
      });
    }

    for (const eqId of equipmentIds) {
      const start = d(y, m, 1);
      const end = d(y, m, 28);
      const actualHours = 140 + (m % 5) * 8;
      const unitRate = 45;
      await db.equipmentLog.create({
        data: {
          projectId,
          equipmentId: eqId,
          periodStart: start,
          periodEnd: end,
          actualHours,
          standardHours: 176,
          unitRate,
          cashCostLyd: actualHours * unitRate * 0.35,
          booksChargeLyd: actualHours * unitRate,
          note: `تشغيل شهري ${m}/${y}`,
        },
      });
    }

    if (m % 3 === 0) {
      const amount = collectionEachQuarter;
      const date = d(y, m, 25);
      const collection = await db.collection.create({
        data: {
          projectId,
          walletId: bankWalletId,
          date,
          amountNative: amount,
          amountLyd: amount,
          note: `دفعة تحصيل ربع سنوية ${m}/${y}`,
        },
      });
      await db.walletMovement.create({
        data: {
          walletId: bankWalletId,
          kind: WalletMovementKind.COLLECTION,
          amountNative: amount,
          amountLyd: amount,
          note: collection.note,
          refType: "Collection",
          refId: collection.id,
          createdAt: date,
        },
      });
    }

    if (m === 3 || m === 9) {
      const amount = 20000;
      const date = d(y, m, 10);
      await db.walletMovement.createMany({
        data: [
          {
            walletId: bankWalletId,
            kind: WalletMovementKind.TRANSFER_OUT,
            amountNative: -amount,
            amountLyd: -amount,
            note: `تحويل إلى الصندوق ${m}/${y}`,
            createdAt: date,
          },
          {
            walletId: cashWalletId,
            kind: WalletMovementKind.TRANSFER_IN,
            amountNative: amount,
            amountLyd: amount,
            note: `تحويل من المصرف ${m}/${y}`,
            createdAt: date,
          },
        ],
      });
    }

    if (m === 6) {
      const amount = 5000;
      const date = d(y, m, 8);
      await db.walletMovement.create({
        data: {
          walletId: cashWalletId,
          kind: WalletMovementKind.CUSTODY_OUT,
          amountNative: -amount,
          amountLyd: -amount,
          note: "عهدة محاسب المشروع",
          createdAt: date,
        },
      });
    }
  }

  const bySupplierMonth = new Map<string, typeof pendingBons>();
  for (const row of pendingBons) {
    const key = `${row.supplierId}|${row.monthKey}`;
    const list = bySupplierMonth.get(key) ?? [];
    list.push(row);
    bySupplierMonth.set(key, list);
  }

  let settleIdx = 0;
  for (const [, lines] of bySupplierMonth) {
    settleIdx += 1;
    const total = lines.reduce((s, l) => s + l.amount, 0);
    const [yStr, mStr] = lines[0].monthKey.split("-");
    const y = Number(yStr);
    const m = Number(mStr);
    const paidAt = d(y, m, 27);
    const isRecent = settleIdx > bySupplierMonth.size - 4;
    const isPartial = isRecent && settleIdx % 2 === 0;
    const paidAmount = isPartial ? Math.round(total * 0.55) : isRecent && settleIdx % 3 === 0 ? 0 : total;
    const status =
      paidAmount === 0
        ? SettlementStatus.OPEN
        : paidAmount < total
          ? SettlementStatus.PARTIALLY_PAID
          : SettlementStatus.PAID;

    const settlement = await db.settlement.create({
      data: {
        projectId,
        supplierId: lines[0].supplierId,
        status,
        walletId: bankWalletId,
        paidAmountNative: paidAmount,
        paidAmountLyd: paidAmount,
        paidAt: paidAmount > 0 ? paidAt : null,
        penaltyAmount: settleIdx % 11 === 0 ? 200 : 0,
        penaltyReason: settleIdx % 11 === 0 ? "تأخير تسليم" : null,
        bons: {
          create: lines.map((l) => ({
            bonId: l.id,
            lineType: l.lineType,
            amountNative: l.amount,
            amountLyd: l.amount,
            paid: status === SettlementStatus.PAID,
          })),
        },
      },
    });

    if (paidAmount > 0) {
      await db.walletMovement.create({
        data: {
          walletId: bankWalletId,
          kind: WalletMovementKind.SETTLEMENT_PAY,
          amountNative: -paidAmount,
          amountLyd: -paidAmount,
          note: `سداد مستخلص ${settlement.id.slice(0, 8)}`,
          refType: "Settlement",
          refId: settlement.id,
          createdAt: paidAt,
        },
      });
    }

    for (const l of lines) {
      await db.bon.update({
        where: { id: l.id },
        data: {
          status:
            status === SettlementStatus.PAID
              ? BonStatus.PAID
              : status === SettlementStatus.OPEN
                ? BonStatus.IN_SETTLEMENT
                : BonStatus.IN_SETTLEMENT,
        },
      });
    }
  }

  if ((await db.supplierAdvance.count({ where: { projectId } })) === 0) {
    await db.supplierAdvance.create({
      data: {
        projectId,
        supplierId: quarryId,
        amountNative: 25000,
        amountLyd: 25000,
        remainingNative: 12000,
        date: d(months[2].y, months[2].m, 4),
        note: "سلفة محجر — جزء مستهلك",
      },
    });
  }

  if ((await db.partnerDistribution.count({ where: { projectId } })) === 0) {
    for (const dist of [
      { y: months[5].y, m: months[5].m, total: 80000 },
      { y: months[months.length - 1].y, m: months[months.length - 1].m, total: 120000 },
    ]) {
      const date = d(dist.y, dist.m, 26);
      const mpGross = dist.total * 0.6;
      const pGross = dist.total * 0.4;
      const management = pGross * 0.1;
      const distribution = await db.partnerDistribution.create({
        data: {
          projectId,
          date,
          totalSurplusLyd: dist.total,
          note: `توزيع فائض ${dist.m}/${dist.y}`,
          lines: {
            create: [
              {
                userId: managingPartnerId,
                sharePercent: 60,
                grossLyd: mpGross,
                managementLyd: 0,
                loanRecoveryLyd: 0,
                netLyd: mpGross,
              },
              {
                userId: partnerId,
                sharePercent: 40,
                grossLyd: pGross,
                managementLyd: management,
                loanRecoveryLyd: 0,
                netLyd: pGross - management,
              },
            ],
          },
        },
      });
      await db.walletMovement.create({
        data: {
          walletId: bankWalletId,
          kind: WalletMovementKind.DISTRIBUTION,
          amountNative: -dist.total,
          amountLyd: -dist.total,
          note: distribution.note,
          refType: "PartnerDistribution",
          refId: distribution.id,
          createdAt: date,
        },
      });
    }
  }

  if ((await db.auditLog.count()) < 30) {
    const actions = [
      ["CREATE", "Bon", "إنشاء بون توريد"],
      ["UPDATE", "Tally", "تحديث تالي يومي"],
      ["PAY", "Settlement", "سداد مستخلص مورد"],
      ["CREATE", "Expense", "تسجيل مصروف ديزل"],
      ["CREATE", "Collection", "تسجيل تحصيل"],
      ["TRANSFER", "Wallet", "تحويل بين الصناديق"],
    ] as const;
    const actors = [accountantId, supervisorId, managingPartnerId];
    for (let i = 0; i < 40; i++) {
      const [action, entity, detail] = actions[i % actions.length];
      await db.auditLog.create({
        data: {
          userId: actors[i % actors.length],
          action,
          entity,
          entityId: `demo-${i}`,
          detail,
          createdAt: addDays(d(months[0].y, months[0].m, 2), i * 7),
        },
      });
    }
  }
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
    id: DEMO_USER_IDS.accounts,
    name: "مدير الحسابات",
    email: "accounts@example.com",
    role: Role.ACCOUNTS_MANAGER,
  });

  const managingPartner = await createUser(db, {
    id: DEMO_USER_IDS.managing,
    name: "الشريك المدير",
    email: "managing@example.com",
    role: Role.MANAGING_PARTNER,
  });

  const partner = await createUser(db, {
    id: DEMO_USER_IDS.partner,
    name: "شريك",
    email: "partner@example.com",
    role: Role.PARTNER,
  });

  const accountant = await createUser(db, {
    id: DEMO_USER_IDS.accountant,
    name: "محاسب المشروع",
    email: "accountant@example.com",
    role: Role.PROJECT_ACCOUNTANT,
  });

  const supervisor = await createUser(db, {
    id: DEMO_USER_IDS.supervisor,
    name: "مشرف المشروع",
    email: "supervisor@example.com",
    role: Role.PROJECT_SUPERVISOR,
  });

  void accountsManager;

  const suppliers = [
    { name: "محجر الساحل", contact: "0910000001", type: "محجر" },
    { name: "محجر الجبل الأخضر", contact: "0910000011", type: "محجر" },
    { name: "ناقلات النور", contact: "0910000002", type: "نقل" },
    { name: "ناقلات الأمل", contact: "0910000012", type: "نقل" },
    { name: "محطة وقود الاتحاد", contact: "0910000020", type: "وقود" },
    { name: "ورشة المعدات المتحدة", contact: "0910000030", type: "صيانة" },
  ];
  for (const s of suppliers) {
    const found = await db.supplier.findFirst({ where: { name: s.name } });
    if (!found) await db.supplier.create({ data: s });
  }

  const materialsSeed = [
    { name: "رمل", unit: "m3", code: "SAND" },
    { name: "حصى", unit: "m3", code: "GRAVEL" },
    { name: "خلطة أسفلتية", unit: "m3", code: "ASPHALT" },
    { name: "قاعدة حصوية", unit: "m3", code: "BASE" },
    { name: "ردم", unit: "m3", code: "FILL" },
  ];
  for (const m of materialsSeed) {
    const found = await db.material.findFirst({ where: { code: m.code } });
    if (!found) await db.material.create({ data: m });
  }

  const trucksSeed = [
    { plate: "طرابلس-1234", payloadM3: 12, driver: "أحمد علي" },
    { plate: "طرابلس-5678", payloadM3: 16, driver: "خالد محمد" },
    { plate: "مصراتة-2201", payloadM3: 14, driver: "سالم عمر" },
    { plate: "بنغازي-3344", payloadM3: 18, driver: "يوسف حسن" },
    { plate: "الزاوية-9012", payloadM3: 12, driver: "مراد فتحي" },
    { plate: "سبها-4410", payloadM3: 15, driver: "إبراهيم نوري" },
  ];
  for (const t of trucksSeed) {
    await db.truck.upsert({
      where: { plate: t.plate },
      update: { payloadM3: t.payloadM3, driver: t.driver },
      create: t,
    });
  }

  const quarry = (await db.supplier.findFirst({ where: { name: "محجر الساحل" } }))!;
  const quarry2 = (await db.supplier.findFirst({ where: { name: "محجر الجبل الأخضر" } }))!;
  const carrier = (await db.supplier.findFirst({ where: { name: "ناقلات النور" } }))!;
  const carrier2 = (await db.supplier.findFirst({ where: { name: "ناقلات الأمل" } }))!;

  const allMaterials = await db.material.findMany();
  const allTrucks = await db.truck.findMany();

  async function ensureProject(input: {
    id: string;
    name: string;
    tradeName: string;
    location: string;
    contractValue: number;
    status: ProjectStatus;
    clientName: string;
    clientContact: string;
    closedAt?: Date;
  }) {
    let project =
      (await db.project.findUnique({ where: { id: input.id } })) ??
      (await db.project.findFirst({ where: { name: input.name } }));
    if (!project) {
      project = await db.project.create({
        data: {
          id: input.id,
          name: input.name,
          tradeName: input.tradeName,
          location: input.location,
          contractValue: input.contractValue,
          status: input.status,
          taxable: false,
          closedAt: input.closedAt,
          retentionPercent: 10,
          client: {
            create: {
              name: input.clientName,
              contact: input.clientContact,
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

    for (const m of [
      { userId: managingPartner.id, role: Role.MANAGING_PARTNER },
      { userId: partner.id, role: Role.PARTNER },
      { userId: accountant.id, role: Role.PROJECT_ACCOUNTANT },
      { userId: supervisor.id, role: Role.PROJECT_SUPERVISOR },
    ]) {
      await ensureMembership(db, project.id, m.userId, m.role);
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

    return project;
  }

  const main = await ensureProject({
    id: DEMO_PROJECT_IDS.tripoli,
    name: "مشروع طريق طرابلس التجريبي",
    tradeName: "طريق الساحل",
    location: "طرابلس",
    contractValue: 2500000,
    status: ProjectStatus.ACTIVE,
    clientName: "هيئة الطرق والجسور",
    clientContact: "info@roads.ly",
  });

  const misrata = await ensureProject({
    id: DEMO_PROJECT_IDS.misrata,
    name: "مشروع طريق مصراتة — سرت",
    tradeName: "محور مصراتة",
    location: "مصراتة",
    contractValue: 1800000,
    status: ProjectStatus.ACTIVE,
    clientName: "مصلحة الطرق",
    clientContact: "misrata@roads.ly",
  });

  const benghazi = await ensureProject({
    id: DEMO_PROJECT_IDS.benghazi,
    name: "مشروع صيانة طريق بنغازي",
    tradeName: "صيانة بنغازي",
    location: "بنغازي",
    contractValue: 950000,
    status: ProjectStatus.COMPLETED,
    clientName: "بلدية بنغازي",
    clientContact: "works@benghazi.ly",
    closedAt: d(2026, 6, 30),
  });

  const rateDefs = [
    { materialName: "رمل", materialPrice: 45, haulagePrice: 30, from: d(2025, 9, 1) },
    { materialName: "حصى", materialPrice: 55, haulagePrice: 35, from: d(2025, 9, 1) },
    { materialName: "قاعدة حصوية", materialPrice: 62, haulagePrice: 40, from: d(2025, 9, 1) },
    { materialName: "خلطة أسفلتية", materialPrice: 180, haulagePrice: 50, from: d(2025, 9, 1) },
    { materialName: "ردم", materialPrice: 28, haulagePrice: 25, from: d(2025, 9, 1) },
    { materialName: "رمل", materialPrice: 48, haulagePrice: 32, from: d(2026, 3, 1) },
    { materialName: "حصى", materialPrice: 58, haulagePrice: 38, from: d(2026, 3, 1) },
  ];

  for (const project of [main, misrata, benghazi]) {
    if ((await db.rateCard.count({ where: { projectId: project.id } })) === 0) {
      for (const r of rateDefs) {
        const mat = allMaterials.find((x) => x.name === r.materialName);
        await db.rateCard.create({
          data: {
            projectId: project.id,
            materialId: mat?.id,
            materialName: r.materialName,
            materialPrice: r.materialPrice,
            haulagePrice: r.haulagePrice,
            quarrySupplierId: project.id === misrata.id ? quarry2.id : quarry.id,
            carrierSupplierId: project.id === misrata.id ? carrier2.id : carrier.id,
            effectiveFrom: r.from,
          },
        });
      }
    }
  }

  async function ensureEquipment(projectId: string) {
    const defs = [
      {
        name: "مدحلة",
        ownership: EquipmentOwnership.OWNED,
        chargingMethod: ChargingMethod.BY_HOUR,
        hoursPerDay: 8,
        hourlyRate: 45,
        monthlyRate: 12000,
      },
      {
        name: "حفار",
        ownership: EquipmentOwnership.OWNED,
        chargingMethod: ChargingMethod.BY_HOUR,
        hoursPerDay: 8,
        hourlyRate: 85,
        monthlyRate: 22000,
      },
      {
        name: "لودر",
        ownership: EquipmentOwnership.RENTED,
        chargingMethod: ChargingMethod.BY_DAY,
        hoursPerDay: 8,
        hourlyRate: 60,
        monthlyRate: 18000,
      },
    ] as const;

    for (const def of defs) {
      const found = await db.equipment.findFirst({
        where: { projectId, name: def.name },
      });
      if (!found) await db.equipment.create({ data: { projectId, ...def } });
    }
    return db.equipment.findMany({ where: { projectId } });
  }

  const mainEq = await ensureEquipment(main.id);
  const misrataEq = await ensureEquipment(misrata.id);
  const benghaziEq = await ensureEquipment(benghazi.id);

  const materialPrices = [
    { name: "رمل", price: 48, haul: 32 },
    { name: "حصى", price: 58, haul: 38 },
    { name: "قاعدة حصوية", price: 62, haul: 40 },
    { name: "خلطة أسفلتية", price: 180, haul: 50 },
    { name: "ردم", price: 28, haul: 25 },
  ];

  const materialsForSeed = materialPrices
    .map((mp) => {
      const mat = allMaterials.find((x) => x.name === mp.name);
      return mat ? { id: mat.id, name: mat.name, price: mp.price, haul: mp.haul } : null;
    })
    .filter(Boolean) as { id: string; name: string; price: number; haul: number }[];

  const trucksForSeed = allTrucks.map((t) => ({
    id: t.id,
    plate: t.plate,
    payload: Number(t.payloadM3 ?? 12),
  }));

  const yearMonths = [
    { y: 2025, m: 10 },
    { y: 2025, m: 11 },
    { y: 2025, m: 12 },
    { y: 2026, m: 1 },
    { y: 2026, m: 2 },
    { y: 2026, m: 3 },
    { y: 2026, m: 4 },
    { y: 2026, m: 5 },
    { y: 2026, m: 6 },
    { y: 2026, m: 7 },
    { y: 2026, m: 8 },
    { y: 2026, m: 9 },
  ];

  if ((await db.bon.count({ where: { projectId: main.id } })) < 50) {
    const wallets = await db.wallet.findMany({ where: { projectId: main.id } });
    const cash = wallets.find((w) => w.method === WalletMethod.CASH)!;
    const bank = wallets.find((w) => w.method === WalletMethod.BANK)!;
    await seedYearActivity(db, {
      projectId: main.id,
      cashWalletId: cash.id,
      bankWalletId: bank.id,
      quarryId: quarry.id,
      carrierId: carrier.id,
      materials: materialsForSeed,
      trucks: trucksForSeed,
      equipmentIds: mainEq.map((e) => e.id),
      partnerId: partner.id,
      managingPartnerId: managingPartner.id,
      accountantId: accountant.id,
      supervisorId: supervisor.id,
      lydId: lyd.id,
      months: yearMonths,
      workDaysPerMonth: 4,
      bonsPerDay: 5,
      seqStart: 1,
      paperPrefix: "TRP",
      openingCash: 75000,
      openingBank: 450000,
      collectionEachQuarter: 220000,
    });
  }

  if ((await db.bon.count({ where: { projectId: misrata.id } })) < 20) {
    const wallets = await db.wallet.findMany({ where: { projectId: misrata.id } });
    const cash = wallets.find((w) => w.method === WalletMethod.CASH)!;
    const bank = wallets.find((w) => w.method === WalletMethod.BANK)!;
    await seedYearActivity(db, {
      projectId: misrata.id,
      cashWalletId: cash.id,
      bankWalletId: bank.id,
      quarryId: quarry2.id,
      carrierId: carrier2.id,
      materials: materialsForSeed.slice(0, 3),
      trucks: trucksForSeed.slice(0, 4),
      equipmentIds: misrataEq.map((e) => e.id),
      partnerId: partner.id,
      managingPartnerId: managingPartner.id,
      accountantId: accountant.id,
      supervisorId: supervisor.id,
      lydId: lyd.id,
      months: yearMonths.slice(4),
      workDaysPerMonth: 3,
      bonsPerDay: 4,
      seqStart: 1,
      paperPrefix: "MSR",
      openingCash: 40000,
      openingBank: 280000,
      collectionEachQuarter: 150000,
    });
  }

  if ((await db.bon.count({ where: { projectId: benghazi.id } })) < 15) {
    const wallets = await db.wallet.findMany({ where: { projectId: benghazi.id } });
    const cash = wallets.find((w) => w.method === WalletMethod.CASH)!;
    const bank = wallets.find((w) => w.method === WalletMethod.BANK)!;
    await seedYearActivity(db, {
      projectId: benghazi.id,
      cashWalletId: cash.id,
      bankWalletId: bank.id,
      quarryId: quarry.id,
      carrierId: carrier.id,
      materials: materialsForSeed.slice(0, 3),
      trucks: trucksForSeed.slice(2, 5),
      equipmentIds: benghaziEq.map((e) => e.id),
      partnerId: partner.id,
      managingPartnerId: managingPartner.id,
      accountantId: accountant.id,
      supervisorId: supervisor.id,
      lydId: lyd.id,
      months: [
        { y: 2025, m: 10 },
        { y: 2025, m: 11 },
        { y: 2025, m: 12 },
        { y: 2026, m: 1 },
        { y: 2026, m: 2 },
        { y: 2026, m: 3 },
        { y: 2026, m: 4 },
        { y: 2026, m: 5 },
      ],
      workDaysPerMonth: 3,
      bonsPerDay: 3,
      seqStart: 1,
      paperPrefix: "BNG",
      openingCash: 30000,
      openingBank: 200000,
      collectionEachQuarter: 180000,
    });

    if ((await db.closeoutItem.count({ where: { projectId: benghazi.id } })) === 0) {
      await db.closeoutItem.createMany({
        data: [
          { projectId: benghazi.id, labelAr: "تسوية جميع المستخلصات", done: true, doneAt: d(2026, 6, 10) },
          { projectId: benghazi.id, labelAr: "إقفال العهد", done: true, doneAt: d(2026, 6, 15) },
          { projectId: benghazi.id, labelAr: "توزيع الفائض النهائي", done: true, doneAt: d(2026, 6, 20) },
          { projectId: benghazi.id, labelAr: "أرشفة المستندات", done: true, doneAt: d(2026, 6, 25) },
          { projectId: benghazi.id, labelAr: "اعتماد الإقفال من الشريك المدير", done: true, doneAt: d(2026, 6, 30) },
        ],
      });
    }
  }

  await ensureChartAccounts();
}

let ensurePromise: Promise<void> | null = null;

export async function ensureDemoReady(db: PrismaClient) {
  if (!ensurePromise) {
    ensurePromise = (async () => {
      try {
        const projects = await db.project.count();
        if (projects > 0) return;
        const users = await db.user.count();
        if (users === 0) await seedDemoData(db);
      } catch {
        await seedDemoData(db).catch(() => undefined);
      }
    })();
  }
  await ensurePromise;
}
