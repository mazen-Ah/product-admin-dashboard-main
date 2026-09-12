import { listBons, cancelBon } from "@/app/actions/bons";
import { getProject } from "@/app/actions/masters";
import { ActionForm } from "@/components/common/action-form";
import { BackToHub } from "@/components/common/back-to-hub";
import { EmptyState } from "@/components/common/page-toolbar";
import { Badge } from "@/components/tailgrids/core/badge";
import { Button } from "@/components/tailgrids/core/button";
import { Card } from "@/components/tailgrids/core/card";
import { canAmendBon, canCreateBon, requireProjectAccess, sessionRole } from "@/lib/access";
import { formatMoney, moneyClassName } from "@/utils/money";
import { bonStatusLabel } from "@/utils/status-labels";
import Link from "next/link";

export default async function BonsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await requireProjectAccess(id);
  const role = sessionRole(session);
  const canCreate = canCreateBon(role);
  const canCancel = canAmendBon(role);
  const project = await getProject(id);
  const bons = await listBons(id);

  return (
    <div className="mt-6 space-y-5 px-2 lg:px-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-[28px] font-medium text-text-primary">البونات</h1>
          <p className="text-sm text-text-tertiary">{project.name}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {canCreate ? (
            <Link href={`/projects/${id}/bons/new`}>
              <Button size="sm">إضافة بون</Button>
            </Link>
          ) : null}
          <BackToHub projectId={id} />
        </div>
      </div>

      {bons.length === 0 ? (
        <EmptyState
          message="لا توجد بونات"
          actionHref={canCreate ? `/projects/${id}/bons/new` : undefined}
          actionLabel={canCreate ? "إضافة بون" : undefined}
        />
      ) : (
        <div className="space-y-3">
          {bons.map((bon) => {
            const materialLine = bon.payableLines.find((l) => l.type === "MATERIAL");
            const haulageLine = bon.payableLines.find((l) => l.type === "HAULAGE");
            return (
              <Card key={bon.id} className="p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="space-y-1 text-sm text-text-secondary">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className={`font-semibold text-text-primary ${moneyClassName()}`}>
                        #{bon.seq}
                      </span>
                      <Badge color="gray">{bon.kind === "EXTERNAL" ? "خارجي" : "داخلي"}</Badge>
                      <Badge
                        color={
                          bon.status === "PAID"
                            ? "success"
                            : bon.status === "IN_SETTLEMENT"
                              ? "warning"
                              : bon.status === "CANCELLED"
                                ? "gray"
                                : "primary"
                        }
                      >
                        {bonStatusLabel[bon.status] ?? bon.status}
                      </Badge>
                    </div>
                    <p>
                      ورقي <span className={moneyClassName()}>{bon.paperSerial}</span> ·{" "}
                      {bon.date.toISOString().slice(0, 10)} · {bon.materialName} ·{" "}
                      <span className={moneyClassName()}>{bon.truckPlate}</span>
                    </p>
                    <p className={moneyClassName()}>
                      رحلات {bon.trips} · كمية {formatMoney(bon.qtyM3)} − خصم{" "}
                      {formatMoney(bon.deductionM3)} = {formatMoney(bon.netM3)} م³
                    </p>
                    {bon.kind === "EXTERNAL" ? (
                      <p className={moneyClassName()}>
                        محجر {materialLine?.supplier.name}:{" "}
                        {formatMoney(materialLine?.amountLyd ?? 0, { currency: "LYD" })} · ناقل{" "}
                        {haulageLine?.supplier.name}:{" "}
                        {formatMoney(haulageLine?.amountLyd ?? 0, { currency: "LYD" })}
                      </p>
                    ) : null}
                    {bon.overTallyReason ? (
                      <p className="text-warning">تجاوز توقيع: {bon.overTallyReason}</p>
                    ) : null}
                    {bon.photoPath ? (
                      <a href={bon.photoPath} className="text-brand-primary underline" target="_blank">
                        عرض الصورة
                      </a>
                    ) : null}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {bon.status === "PENDING" && canCreate ? (
                      <Link href={`/projects/${id}/bons/${bon.id}/edit`}>
                        <Button size="sm" appearance="outline">
                          تعديل
                        </Button>
                      </Link>
                    ) : null}
                    {bon.status === "PENDING" && canCancel ? (
                      <ActionForm
                        action={cancelBon}
                        requireReason
                        reasonField="cancelReason"
                        confirmMessage="سبب إلغاء البون"
                        successMessage="تم إلغاء البون"
                      >
                        <input type="hidden" name="projectId" value={id} />
                        <input type="hidden" name="id" value={bon.id} />
                        <Button type="submit" size="sm" appearance="ghost" variant="danger">
                          إلغاء
                        </Button>
                      </ActionForm>
                    ) : null}
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
