export const projectStatusLabel: Record<string, string> = {
  ACTIVE: "نشط",
  SUSPENDED: "موقوف",
  COMPLETED: "مكتمل",
  CLOSED: "مغلق",
  PARTIALLY_CANCELLED: "ملغى جزئياً",
};

export const projectStatusColor: Record<
  string,
  "success" | "warning" | "gray" | "primary" | "error"
> = {
  ACTIVE: "success",
  SUSPENDED: "warning",
  COMPLETED: "primary",
  CLOSED: "gray",
  PARTIALLY_CANCELLED: "error",
};

export const bonStatusLabel: Record<string, string> = {
  PENDING: "قيد الانتظار",
  IN_SETTLEMENT: "في المستخلص",
  PAID: "مدفوع",
  CANCELLED: "ملغى",
};

export const settlementStatusLabel: Record<string, string> = {
  DRAFT: "مسودة",
  OPEN: "مفتوح",
  PARTIALLY_PAID: "مدفوع جزئياً",
  PAID: "مدفوع",
  REVERSED: "معكوس",
};

export const expenseTypeLabel: Record<string, string> = {
  SUBSISTENCE: "إعاشة",
  GRATUITY: "إكرامية",
  DIESEL: "ديزل",
  PAYROLL: "أجور",
  TRANSFER_COMMISSION: "عمولة تحويل",
  OTHER: "أخرى",
};

export const ownershipLabel: Record<string, string> = {
  OWNED: "مملوكة",
  RENTED: "مستأجرة",
};

export const chargingLabel: Record<string, string> = {
  BY_HOUR: "بالساعة",
  BY_DAY: "باليوم",
  BY_MONTH: "بالشهر",
  BY_METRE: "بالمتر",
};

export const payableTypeLabel: Record<string, string> = {
  MATERIAL: "مواد",
  HAULAGE: "نقل",
};

export const walletMethodLabel: Record<string, string> = {
  CASH: "نقدي",
  BANK: "مصرف",
};
