export type BonStatus = "PENDING" | "IN_SETTLEMENT" | "PAID";
export type BonKind = "INTERNAL" | "EXTERNAL";

export type PrototypeBon = {
  id: string;
  seq: string;
  paperSerial: string;
  kind: BonKind;
  date: string;
  material: string;
  trips: number;
  qtyM3: number;
  deductionM3: number;
  netM3: number;
  materialPrice: number;
  haulagePrice: number;
  quarrySupplier: string;
  carrierSupplier: string;
  truckPlate: string;
  status: BonStatus;
  hasPhoto: boolean;
};

export type PrototypeTally = {
  id: string;
  period: string;
  signedTrips: number;
  reportedTrips: number;
  status: "DRAFT" | "SIGNED";
  note?: string;
};

export type PrototypeSettlement = {
  id: string;
  party: string;
  currency: string;
  bonsCount: number;
  gross: number;
  advances: number;
  net: number;
  status: "DRAFT" | "READY" | "PAID" | "PARTIAL";
};

export type PrototypeWallet = {
  id: string;
  method: "CASH" | "BANK";
  currency: string;
  label: string;
  balance: number;
  custodian: string;
};

export type PrototypeExpense = {
  id: string;
  category: string;
  description: string;
  amount: number;
  date: string;
};

export type PrototypeJournal = {
  id: string;
  date: string;
  memo: string;
  debit: number;
  credit: number;
  account: string;
};

export type PrototypePartnerView = {
  name: string;
  sharePercent: number;
  capital: number;
  loans: number;
  managementPct: number;
  costShare: number;
};

export const PROTOTYPE_MODULES = [
  { key: "bons", href: "bons", titleAr: "البونات", titleEn: "Bons", phase: 2 },
  { key: "tallies", href: "tallies", titleAr: "الكشوف", titleEn: "Tallies", phase: 2 },
  { key: "settlements", href: "settlements", titleAr: "المستخلصات", titleEn: "Settlements", phase: 3 },
  { key: "wallets", href: "wallets", titleAr: "الخزائن", titleEn: "Wallets", phase: 4 },
  { key: "partner", href: "partner", titleAr: "لوحة الشريك", titleEn: "Partner view", phase: 4 },
  { key: "expenses", href: "expenses", titleAr: "المصروفات", titleEn: "Expenses", phase: 5 },
  { key: "reports", href: "reports", titleAr: "التقارير", titleEn: "Reports", phase: 6 },
  { key: "profitability", href: "profitability", titleAr: "الربحية", titleEn: "Profitability", phase: 7 },
  { key: "closeout", href: "closeout", titleAr: "الإقفال", titleEn: "Closeout", phase: 7 },
] as const;

export function getPrototypeBundle(_projectId: string) {
  const bons: PrototypeBon[] = [
    {
      id: "b1",
      seq: "TRP-00041",
      paperSerial: "ق-1182",
      kind: "EXTERNAL",
      date: "2026-09-08",
      material: "رمل",
      trips: 6,
      qtyM3: 72,
      deductionM3: 2,
      netM3: 70,
      materialPrice: 45,
      haulagePrice: 30,
      quarrySupplier: "محجر الساحل",
      carrierSupplier: "ناقلات النور",
      truckPlate: "طرابلس-1234",
      status: "PENDING",
      hasPhoto: true,
    },
    {
      id: "b2",
      seq: "TRP-00042",
      paperSerial: "ق-1183",
      kind: "EXTERNAL",
      date: "2026-09-09",
      material: "حصى",
      trips: 4,
      qtyM3: 48,
      deductionM3: 0,
      netM3: 48,
      materialPrice: 55,
      haulagePrice: 32,
      quarrySupplier: "محجر الساحل",
      carrierSupplier: "ناقلات النور",
      truckPlate: "طرابلس-5678",
      status: "IN_SETTLEMENT",
      hasPhoto: true,
    },
    {
      id: "b3",
      seq: "TRP-00043",
      paperSerial: "داخلي-09",
      kind: "INTERNAL",
      date: "2026-09-10",
      material: "رمل",
      trips: 3,
      qtyM3: 36,
      deductionM3: 1,
      netM3: 35,
      materialPrice: 0,
      haulagePrice: 0,
      quarrySupplier: "مخزن المشروع",
      carrierSupplier: "أسطول المشروع",
      truckPlate: "طرابلس-1234",
      status: "PAID",
      hasPhoto: false,
    },
  ];

  const tallies: PrototypeTally[] = [
    {
      id: "t1",
      period: "2026-09-01 → 2026-09-07",
      signedTrips: 28,
      reportedTrips: 26,
      status: "SIGNED",
      note: "نقص بونين — تنبيه تحت الكشف",
    },
    {
      id: "t2",
      period: "2026-09-08 → 2026-09-14",
      signedTrips: 18,
      reportedTrips: 19,
      status: "DRAFT",
      note: "رحلة زائدة تحتاج سبب قبل الاعتماد",
    },
  ];

  const settlements: PrototypeSettlement[] = [
    {
      id: "s1",
      party: "محجر الساحل",
      currency: "LYD",
      bonsCount: 8,
      gross: 18400,
      advances: 2000,
      net: 16400,
      status: "READY",
    },
    {
      id: "s2",
      party: "ناقلات النور",
      currency: "LYD",
      bonsCount: 8,
      gross: 9600,
      advances: 500,
      net: 9100,
      status: "PARTIAL",
    },
    {
      id: "s3",
      party: "محجر الساحل",
      currency: "EGP",
      bonsCount: 2,
      gross: 12000,
      advances: 0,
      net: 12000,
      status: "PAID",
    },
  ];

  const wallets: PrototypeWallet[] = [
    {
      id: "w1",
      method: "CASH",
      currency: "LYD",
      label: "صندوق نقدي",
      balance: 42500,
      custodian: "محاسب المشروع",
    },
    {
      id: "w2",
      method: "BANK",
      currency: "LYD",
      label: "حساب مصرفي",
      balance: 186000,
      custodian: "مدير الحسابات",
    },
    {
      id: "w3",
      method: "CASH",
      currency: "EGP",
      label: "صندوق جنيه",
      balance: 38000,
      custodian: "محاسب المشروع",
    },
  ];

  const expenses: PrototypeExpense[] = [
    {
      id: "e1",
      category: "ديزل",
      description: "تعبئة معدات الأسبوع",
      amount: 3200,
      date: "2026-09-09",
    },
    {
      id: "e2",
      category: "إعاشة",
      description: "حضور مشرفين — 12 يوم",
      amount: 1800,
      date: "2026-09-10",
    },
    {
      id: "e3",
      category: "رواتب",
      description: "إجمالي شهري ميداني",
      amount: 24500,
      date: "2026-09-01",
    },
  ];

  const journals: PrototypeJournal[] = [
    {
      id: "j1",
      date: "2026-09-09",
      memo: "شراء توريد خارجي — بون TRP-00042",
      account: "5100 مصروفات التوريد",
      debit: 4176,
      credit: 0,
    },
    {
      id: "j2",
      date: "2026-09-09",
      memo: "مستحق محجر/ناقل",
      account: "2100 موردون",
      debit: 0,
      credit: 4176,
    },
    {
      id: "j3",
      date: "2026-09-11",
      memo: "صرف مستخلص ناقلات النور (جزئي)",
      account: "1100 نقدية",
      debit: 0,
      credit: 4500,
    },
  ];

  const partners: PrototypePartnerView[] = [
    {
      name: "الشريك المدير",
      sharePercent: 60,
      capital: 400000,
      loans: 50000,
      managementPct: 8,
      costShare: 112400,
    },
    {
      name: "شريك",
      sharePercent: 40,
      capital: 250000,
      loans: 0,
      managementPct: 0,
      costShare: 74900,
    },
  ];

  const costSummary = {
    collected: 520000,
    cashCost: 187300,
    ownedChargeOut: 24000,
    managementProfit: 332700,
    retentionReserve: 125000,
    unpaidPayables: 25500,
    surplus: 98400,
  };

  const closeout = [
    { label: "تسوية كل المستخلصات المفتوحة", done: false },
    { label: "مطابقة الخزائن (افتتاحي + حركة = رصيد)", done: true },
    { label: "إقفال سلف المعدات", done: false },
    { label: "احتساب فائض قابل للسحب", done: true },
    { label: "قفل المشروع ضد إدخال بونات جديدة", done: false },
  ];

  return {
    bons,
    tallies,
    settlements,
    wallets,
    expenses,
    journals,
    partners,
    costSummary,
    closeout,
    bannerAr:
      "نموذج تجريبي للعميل — يوضح تدفق العمل الكامل. الأرقام للعرض وليست قيوداً نهائية.",
    bannerEn:
      "Client prototype — full workflow walkthrough. Figures are illustrative, not final postings.",
  };
}

export function formatMoney(n: number) {
  return new Intl.NumberFormat("en-LY", { maximumFractionDigits: 0 }).format(n);
}

export function bonStatusLabel(status: BonStatus, locale: "ar" | "en") {
  const map = {
    ar: {
      PENDING: "معلّق",
      IN_SETTLEMENT: "في مستخلص",
      PAID: "مدفوع",
    },
    en: {
      PENDING: "Pending",
      IN_SETTLEMENT: "In settlement",
      PAID: "Paid",
    },
  } as const;
  return map[locale][status];
}
