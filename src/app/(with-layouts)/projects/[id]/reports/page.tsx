import { getProject } from "@/app/actions/masters";
import {
  getAgingReport,
  getCostReport,
  listAuditLogs,
  listJournals,
} from "@/app/actions/reports";
import { BackToHub } from "@/components/common/back-to-hub";
import { Card } from "@/components/tailgrids/core/card";
import { requireProjectAccess } from "@/lib/access";

export default async function ReportsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  await requireProjectAccess(id);
  const [project, costs, aging, journals, audits] = await Promise.all([
    getProject(id),
    getCostReport(id),
    getAgingReport(id),
    listJournals(id),
    listAuditLogs(id),
  ]);

  return (
    <div className="mt-6 space-y-5 px-2 lg:px-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-[28px] font-medium text-text-primary">التقارير والقيود</h1>
          <p className="text-sm text-text-tertiary">{project.name}</p>
        </div>
        <BackToHub projectId={id} />
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <Card className="p-4">
          <p className="text-xs text-text-tertiary">تكلفة التوريد</p>
          <p className="mt-1 text-xl font-semibold">{costs.supply.toFixed(2)}</p>
        </Card>
        <Card className="p-4">
          <p className="text-xs text-text-tertiary">المصروفات</p>
          <p className="mt-1 text-xl font-semibold">{costs.expenses.toFixed(2)}</p>
        </Card>
        <Card className="p-4">
          <p className="text-xs text-text-tertiary">معدات نقدية</p>
          <p className="mt-1 text-xl font-semibold">{costs.equipmentCash.toFixed(2)}</p>
        </Card>
        <Card className="p-4">
          <p className="text-xs text-text-tertiary">تحميل معدات (كتب)</p>
          <p className="mt-1 text-xl font-semibold">{costs.equipmentBooks.toFixed(2)}</p>
        </Card>
        <Card className="p-4">
          <p className="text-xs text-text-tertiary">فروق عملة</p>
          <p className="mt-1 text-xl font-semibold">{costs.fx.toFixed(2)}</p>
        </Card>
        <Card className="p-4">
          <p className="text-xs text-text-tertiary">إجمالي التكلفة النقدية</p>
          <p className="mt-1 text-xl font-semibold">{costs.totalCashCost.toFixed(2)}</p>
        </Card>
      </div>

      <Card className="p-4">
        <h3 className="mb-3 font-semibold">أعمار الذمم (على قيمة العقد)</h3>
        <ul className="space-y-1 text-sm text-text-secondary">
          <li>قيمة العقد: {aging.contractValue.toFixed(2)}</li>
          <li>
            احتجاز {aging.retentionPercent}%: {aging.retentionReserve.toFixed(2)}
          </li>
          <li>محصّل: {aging.collected.toFixed(2)}</li>
          <li>متبقي: {aging.outstanding.toFixed(2)}</li>
        </ul>
      </Card>

      <Card className="p-4">
        <h3 className="mb-3 font-semibold">آخر القيود</h3>
        <ul className="space-y-3 text-sm">
          {journals.map((j) => (
            <li key={j.id} className="border-b border-card-border pb-2">
              <p className="font-medium">
                {j.source} · {j.date.toISOString().slice(0, 10)} · {j.memo}
              </p>
              <ul className="mt-1 text-text-tertiary">
                {j.lines.map((l) => (
                  <li key={l.id}>
                    {l.account.code} {l.account.nameAr} · مدين {String(l.debitLyd)} · دائن{" "}
                    {String(l.creditLyd)}
                  </li>
                ))}
              </ul>
            </li>
          ))}
        </ul>
      </Card>

      <Card className="p-4">
        <h3 className="mb-3 font-semibold">سجل التدقيق</h3>
        <ul className="space-y-2 text-sm text-text-secondary">
          {audits.slice(0, 30).map((a) => (
            <li key={a.id}>
              {a.createdAt.toISOString().slice(0, 19)} · {a.user?.name ?? "—"} · {a.action}{" "}
              {a.entity} {a.entityId}
            </li>
          ))}
        </ul>
      </Card>
    </div>
  );
}
