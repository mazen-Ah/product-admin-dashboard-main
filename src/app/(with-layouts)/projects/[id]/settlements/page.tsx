import {
  createSettlement,
  listPendingPayables,
  listSettlements,
  paySettlement,
  reverseSettlement,
} from "@/app/actions/settlements";
import { getProject, listSuppliers } from "@/app/actions/masters";
import { ensureProjectWallets, listWallets } from "@/app/actions/treasury";
import { ActionForm } from "@/components/common/action-form";
import { BackToHub } from "@/components/common/back-to-hub";
import { EmptyState } from "@/components/common/page-toolbar";
import {
  FormActions,
  FormField,
  FormGrid,
  FormTitle,
  formSelectClassName,
} from "@/components/common/form-field";
import { Badge } from "@/components/tailgrids/core/badge";
import { Button } from "@/components/tailgrids/core/button";
import { Card } from "@/components/tailgrids/core/card";
import { Input } from "@/components/tailgrids/core/input";
import { Label } from "@/components/tailgrids/core/label";
import { canPaySettlement, requireProjectAccess, sessionRole } from "@/lib/access";
import { formatMoney, moneyClassName } from "@/utils/money";
import { payableTypeLabel, settlementStatusLabel, walletMethodLabel } from "@/utils/status-labels";
import { redirect } from "next/navigation";

export default async function SettlementsPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ supplierId?: string; create?: string }>;
}) {
  const { id } = await params;
  const sp = await searchParams;
  const session = await requireProjectAccess(id);
  const canPay = canPaySettlement(sessionRole(session));
  await ensureProjectWallets(id);
  const [project, settlements, suppliers, wallets] = await Promise.all([
    getProject(id),
    listSettlements(id),
    listSuppliers(),
    listWallets(id),
  ]);
  const supplierId = sp.supplierId ?? suppliers[0]?.id ?? "";
  const pending = supplierId ? await listPendingPayables(id, supplierId) : [];
  const pendingTotal = pending.reduce((sum, line) => sum + Number(line.amountLyd), 0);
  const showCreate = sp.create === "1" && canPay;

  async function createAction(formData: FormData) {
    "use server";
    formData.set("projectId", id);
    await createSettlement(formData);
    redirect(`/projects/${id}/settlements`);
  }

  return (
    <div className="mt-6 space-y-5 px-2 lg:px-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-[28px] font-medium text-text-primary">المستخلصات</h1>
          <p className="text-sm text-text-tertiary">{project.name}</p>
        </div>
        <div className="flex gap-2">
          {canPay && !showCreate ? (
            <a href={`/projects/${id}/settlements?create=1`}>
              <Button size="sm">مستخلص جديد</Button>
            </a>
          ) : null}
          <BackToHub projectId={id} />
        </div>
      </div>

      {showCreate ? (
        <Card className="bg-transparent p-5">
          <FormTitle>إنشاء مستخلص</FormTitle>
          <ActionForm action={createAction} successMessage="تم إنشاء المستخلص">
            <FormGrid>
              <FormField className="md:col-span-2">
                <Label htmlFor="supplierId">المورد</Label>
                <select
                  id="supplierId"
                  name="supplierId"
                  className={formSelectClassName}
                  defaultValue={supplierId}
                  required
                >
                  {suppliers.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </FormField>
              <FormField>
                <Label htmlFor="penaltyAmount">غرامة تأخير</Label>
                <Input
                  id="penaltyAmount"
                  name="penaltyAmount"
                  type="number"
                  step="0.01"
                  defaultValue={0}
                  className="w-full"
                />
              </FormField>
              <FormField>
                <Label htmlFor="penaltyReason">سبب الغرامة</Label>
                <Input id="penaltyReason" name="penaltyReason" className="w-full" />
              </FormField>
              <div className="md:col-span-2 space-y-2">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <Label>بنود مستحقة (قيد الانتظار)</Label>
                  <p className={`text-sm text-text-secondary ${moneyClassName()}`}>
                    الإجمالي التقريبي: {formatMoney(pendingTotal, { currency: "LYD" })}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  {suppliers.map((s) => (
                    <a
                      key={s.id}
                      href={`/projects/${id}/settlements?create=1&supplierId=${s.id}`}
                      className={`rounded-md border px-2 py-1 text-sm ${
                        s.id === supplierId
                          ? "border-brand-primary bg-brand-primary/10 text-brand-primary"
                          : "border-card-border text-text-secondary"
                      }`}
                    >
                      {s.name}
                    </a>
                  ))}
                </div>
                {pending.length === 0 ? (
                  <p className="text-sm text-text-tertiary">لا بنود لهذا المورد</p>
                ) : (
                  pending.map((line) => (
                    <label key={line.id} className="flex items-center gap-2 text-sm">
                      <input type="checkbox" name="lineId" value={line.id} defaultChecked />
                      بون #{line.bon.seq} · {payableTypeLabel[line.type] ?? line.type} ·{" "}
                      <span className={moneyClassName()}>
                        {formatMoney(line.amountLyd, { currency: "LYD" })}
                      </span>
                    </label>
                  ))
                )}
              </div>
              <FormActions>
                <a href={`/projects/${id}/settlements`}>
                  <Button type="button" appearance="outline" size="lg" className="px-3.5 text-sm">
                    إلغاء
                  </Button>
                </a>
                <Button type="submit" size="lg" className="px-3.5 text-sm">
                  إنشاء
                </Button>
              </FormActions>
            </FormGrid>
          </ActionForm>
        </Card>
      ) : null}

      {settlements.length === 0 && !showCreate ? (
        <EmptyState
          message="لا توجد مستخلصات"
          actionHref={canPay ? `/projects/${id}/settlements?create=1` : undefined}
          actionLabel={canPay ? "مستخلص جديد" : undefined}
        />
      ) : (
        <div className="space-y-3">
          {settlements.map((s) => {
            const gross = s.bons.reduce((sum, b) => sum + Number(b.amountLyd), 0);
            return (
              <Card key={s.id} className="space-y-3 p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <p className="font-semibold text-text-primary">{s.supplier.name}</p>
                    <p className={`text-sm text-text-tertiary ${moneyClassName()}`}>
                      {s.createdAt.toISOString().slice(0, 10)} · إجمالي{" "}
                      {formatMoney(gross, { currency: "LYD" })} · مدفوع{" "}
                      {formatMoney(s.paidAmountLyd, { currency: "LYD" })}
                    </p>
                  </div>
                  <Badge
                    color={
                      s.status === "PAID"
                        ? "success"
                        : s.status === "REVERSED"
                          ? "gray"
                          : s.status === "PARTIALLY_PAID"
                            ? "warning"
                            : "primary"
                    }
                  >
                    {settlementStatusLabel[s.status] ?? s.status}
                  </Badge>
                </div>
                <ul className="text-sm text-text-secondary">
                  {s.bons.map((b) => (
                    <li key={b.id} className={moneyClassName()}>
                      بون #{b.bon.seq} · {payableTypeLabel[b.lineType] ?? b.lineType} ·{" "}
                      {formatMoney(b.amountLyd, { currency: "LYD" })}{" "}
                      {b.paid ? "(مدفوع)" : ""}
                    </li>
                  ))}
                </ul>
                {canPay && s.status !== "PAID" && s.status !== "REVERSED" ? (
                  <ActionForm
                    action={paySettlement}
                    className="flex flex-wrap items-end gap-3"
                    confirmMessage={`تأكيد دفع مستخلص ${s.supplier.name} بمبلغ ${formatMoney(gross - Number(s.paidAmountLyd), { currency: "LYD" })}؟`}
                    successMessage="تم الدفع"
                  >
                    <input type="hidden" name="projectId" value={id} />
                    <input type="hidden" name="id" value={s.id} />
                    <div>
                      <Label htmlFor={`wallet-${s.id}`}>المحفظة</Label>
                      <select
                        id={`wallet-${s.id}`}
                        name="walletId"
                        required
                        className={formSelectClassName}
                      >
                        {wallets.map((w) => (
                          <option key={w.id} value={w.id}>
                            {w.label ?? walletMethodLabel[w.method] ?? w.method} ({w.currency.code})
                            {" · "}
                            رصيد LYD {formatMoney(w.balanceLyd)}
                          </option>
                        ))}
                      </select>
                    </div>
                    <Button type="submit" size="sm">
                      دفع
                    </Button>
                  </ActionForm>
                ) : null}
                {canPay && s.status !== "REVERSED" ? (
                  <ActionForm
                    action={reverseSettlement}
                    requireReason
                    reasonField="reason"
                    confirmMessage="سبب عكس المستخلص"
                    successMessage="تم عكس المستخلص"
                  >
                    <input type="hidden" name="projectId" value={id} />
                    <input type="hidden" name="id" value={s.id} />
                    <Button type="submit" size="sm" appearance="ghost" variant="danger">
                      عكس المستخلص
                    </Button>
                  </ActionForm>
                ) : null}
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
