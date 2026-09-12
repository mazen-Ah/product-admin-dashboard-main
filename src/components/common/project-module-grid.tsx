"use client";

import { Button } from "@/components/tailgrids/core/button";
import { Card } from "@/components/tailgrids/core/card";
import Link from "next/link";

const GROUPS = [
  {
    title: "عمليات",
    items: [
      { href: "bons", title: "البونات" },
      { href: "tallies", title: "كشوف التوقيع" },
      { href: "rates", title: "بطاقة الأسعار" },
    ],
  },
  {
    title: "مالية",
    items: [
      { href: "settlements", title: "المستخلصات" },
      { href: "wallets", title: "المحافظ والعهد" },
      { href: "expenses", title: "المصروفات" },
      { href: "equipment", title: "المعدات" },
      { href: "partner", title: "عرض الشريك" },
    ],
  },
  {
    title: "تقارير وإغلاق",
    items: [
      { href: "reports", title: "التقارير" },
      { href: "profitability", title: "الربحية" },
      { href: "closeout", title: "الإغلاق" },
    ],
  },
];

export function ProjectModuleGrid({ projectId }: { projectId: string }) {
  return (
    <div className="space-y-6">
      {GROUPS.map((group) => (
        <section key={group.title} className="space-y-3">
          <h3 className="text-sm font-semibold text-text-tertiary">{group.title}</h3>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {group.items.map((mod) => (
              <Card key={mod.href} className="flex flex-col justify-between gap-3">
                <h4 className="text-base font-semibold text-text-primary">{mod.title}</h4>
                <Link href={`/projects/${projectId}/${mod.href}`}>
                  <Button appearance="outline" size="sm" className="w-full">
                    فتح
                  </Button>
                </Link>
              </Card>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
