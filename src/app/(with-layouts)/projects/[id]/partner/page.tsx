import { getProject } from "@/app/actions/masters";
import { getPartnerView } from "@/app/actions/treasury";
import { BackToHub } from "@/components/common/back-to-hub";
import { Card } from "@/components/tailgrids/core/card";
import { requireProjectAccess } from "@/lib/access";

export default async function PartnerPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  await requireProjectAccess(id);
  const project = await getProject(id);
  const view = await getPartnerView(id);

  return (
    <div className="mt-6 space-y-5 px-2 lg:px-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-[28px] font-medium text-text-primary">عرض الشريك</h1>
          <p className="text-sm text-text-tertiary">{project.name} · قراءة فقط</p>
        </div>
        <BackToHub projectId={id} />
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="p-4">
          <p className="text-xs text-text-tertiary">توريد</p>
          <p className="mt-1 text-xl font-semibold">{view.costs.supply.toFixed(2)}</p>
        </Card>
        <Card className="p-4">
          <p className="text-xs text-text-tertiary">مصروفات</p>
          <p className="mt-1 text-xl font-semibold">{view.costs.expenses.toFixed(2)}</p>
        </Card>
        <Card className="p-4">
          <p className="text-xs text-text-tertiary">معدات نقدية</p>
          <p className="mt-1 text-xl font-semibold">{view.costs.equipmentCash.toFixed(2)}</p>
        </Card>
        <Card className="p-4">
          <p className="text-xs text-text-tertiary">تحصيلات</p>
          <p className="mt-1 text-xl font-semibold">{view.collected.toFixed(2)}</p>
        </Card>
      </div>

      <Card className="p-4">
        <h3 className="mb-3 font-semibold">المحافظ</h3>
        <ul className="space-y-2 text-sm">
          {view.wallets.map((w) => (
            <li key={w.id}>
              {w.label ?? w.method} · {w.balanceLyd.toFixed(2)} {w.currency.code}
            </li>
          ))}
        </ul>
      </Card>

      <Card className="p-4">
        <h3 className="mb-3 font-semibold">حصص الشركاء</h3>
        <ul className="space-y-2 text-sm">
          {view.shares.map((s) => (
            <li key={s.id}>
              {s.user.name} · حصة {String(s.sharePercent)}% · إدارة{" "}
              {String(s.managementPercent)}% · رأس مال {String(s.capital)} · قرض{" "}
              {String(s.loanBalance)}
            </li>
          ))}
        </ul>
      </Card>
    </div>
  );
}
