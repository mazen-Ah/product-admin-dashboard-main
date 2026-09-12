import { listBons, cancelBon } from "@/app/actions/bons";
import { getProject } from "@/app/actions/masters";
import { BackToHub } from "@/components/common/back-to-hub";
import { EmptyState } from "@/components/common/page-toolbar";
import { Badge } from "@/components/tailgrids/core/badge";
import { Button } from "@/components/tailgrids/core/button";
import { Card } from "@/components/tailgrids/core/card";
import { canAmendBon, canCreateBon, requireProjectAccess, sessionRole } from "@/lib/access";
import Link from "next/link";

const statusLabel: Record<string, string> = {
  PENDING: "قيد الانتظار",
  IN_SETTLEMENT: "في المستخلص",
  PAID: "مدفوع",
  CANCELLED: "ملغى",
};

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
                      <span className="font-semibold text-text-primary">#{bon.seq}</span>
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
                        {statusLabel[bon.status] ?? bon.status}
                      </Badge>
                    </div>
                    <p>
                      ورقي {bon.paperSerial} · {bon.date.toISOString().slice(0, 10)} ·{" "}
                      {bon.materialName} · {bon.truckPlate}
                    </p>
                    <p>
                      رحلات {bon.trips} · كمية {String(bon.qtyM3)} − خصم{" "}
                      {String(bon.deductionM3)} = {String(bon.netM3)} م³
                    </p>
                    {bon.kind === "EXTERNAL" ? (
                      <p>
                        محجر {materialLine?.supplier.name}: {String(materialLine?.amountLyd ?? 0)} ·
                        ناقل {haulageLine?.supplier.name}: {String(haulageLine?.amountLyd ?? 0)}
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
                      <form action={cancelBon}>
                        <input type="hidden" name="projectId" value={id} />
                        <input type="hidden" name="id" value={bon.id} />
                        <input type="hidden" name="cancelReason" value="إلغاء من القائمة" />
                        <Button type="submit" size="sm" appearance="ghost" variant="danger">
                          إلغاء
                        </Button>
                      </form>
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
