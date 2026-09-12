"use client";

import { Button } from "@/components/tailgrids/core/button";
import { Card } from "@/components/tailgrids/core/card";
import { useLocale } from "@/i18n/locale-provider";
import Link from "next/link";

const MODULES = [
  { key: "bons", href: "bons", titleAr: "البونات", titleEn: "Bons", phase: 2 },
  { key: "tallies", href: "tallies", titleAr: "كشوف التوقيع", titleEn: "Tallies", phase: 2 },
  { key: "settlements", href: "settlements", titleAr: "المستخلصات", titleEn: "Settlements", phase: 3 },
  { key: "wallets", href: "wallets", titleAr: "المحافظ والعهد", titleEn: "Wallets", phase: 4 },
  { key: "partner", href: "partner", titleAr: "عرض الشريك", titleEn: "Partner", phase: 4 },
  { key: "expenses", href: "expenses", titleAr: "المصروفات", titleEn: "Expenses", phase: 5 },
  { key: "equipment", href: "equipment", titleAr: "المعدات", titleEn: "Equipment", phase: 5 },
  { key: "reports", href: "reports", titleAr: "التقارير", titleEn: "Reports", phase: 6 },
  { key: "profitability", href: "profitability", titleAr: "الربحية", titleEn: "Profitability", phase: 7 },
  { key: "closeout", href: "closeout", titleAr: "الإغلاق", titleEn: "Closeout", phase: 7 },
  { key: "rates", href: "rates", titleAr: "بطاقة الأسعار", titleEn: "Rates", phase: 1 },
];

export function ProjectModuleGrid({ projectId }: { projectId: string }) {
  const { locale } = useLocale();

  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {MODULES.map((mod) => (
        <Card key={mod.key} className="flex flex-col justify-between gap-3">
          <div>
            <p className="text-xs text-text-tertiary">
              {locale === "ar" ? `المرحلة ${mod.phase}` : `Phase ${mod.phase}`}
            </p>
            <h3 className="mt-1 text-base font-semibold text-text-primary">
              {locale === "ar" ? mod.titleAr : mod.titleEn}
            </h3>
          </div>
          <Link href={`/projects/${projectId}/${mod.href}`}>
            <Button appearance="outline" size="sm" className="w-full">
              {locale === "ar" ? "فتح" : "Open"}
            </Button>
          </Link>
        </Card>
      ))}
    </div>
  );
}
