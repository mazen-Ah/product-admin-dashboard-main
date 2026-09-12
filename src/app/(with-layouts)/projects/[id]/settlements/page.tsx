import {
  createSettlement,
  listPendingPayables,
  listSettlements,
  paySettlement,
  reverseSettlement,
} from "@/app/actions/settlements";
import { getProject, listSuppliers } from "@/app/actions/masters";
import { ensureProjectWallets, listWallets } from "@/app/actions/treasury";
import { BackToHub } from "@/components/common/back-to-hub";
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
          <form action={createAction}>
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
                <p className="text-xs text-text-tertiary">
                  غيّر المورد عبر الرابط ثم أعد فتح الإنشاء لعرض البنود.
                </p>
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
                <Label>بنود مستحقة (قيد الانتظار)</Label>
                {pending.length === 0 ? (
                  <p className="text-sm text-text-tertiary">لا بنود لهذا المورد</p>
                ) : (
                  pending.map((line) => (
                    <label key={line.id} className="flex items-center gap-2 text-sm">
                      <input type="checkbox" name="lineId" value={line.id} defaultChecked />
                      بون #{line.bon.seq} · {line.type} · {String(line.amountLyd)} LYD
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
          </form>
          <div className="mt-4 flex flex-wrap gap-2">
            {suppliers.map((s) => (
              <a
                key={s.id}
                href={`/projects/${id}/settlements?create=1&supplierId=${s.id}`}
                className="text-sm text-brand-primary underline"
              >
                {s.name}
              </a>
            ))}
          </div>
        </Card>
      ) : null}

      <div className="space-y-3">
        {settlements.map((s) => (
          <Card key={s.id} className="space-y-3 p-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <p className="font-semibold text-text-primary">{s.supplier.name}</p>
                <p className="text-sm text-text-tertiary">
                  {s.createdAt.toISOString().slice(0, 10)} · مدفوع {String(s.paidAmountLyd)}
                </p>
              </div>
              <Badge
                color={
                  s.status === "PAID"
                    ? "success"
                    : s.status === "REVERSED"
                      ? "gray"
                      : "warning"
                }
              >
                {s.status}
              </Badge>
            </div>
            <ul className="text-sm text-text-secondary">
              {s.bons.map((b) => (
                <li key={b.id}>
                  بون #{b.bon.seq} · {b.lineType} · {String(b.amountLyd)}{" "}
                  {b.paid ? "(مدفوع)" : ""}
                </li>
              ))}
            </ul>
            {canPay && s.status !== "PAID" && s.status !== "REVERSED" ? (
              <form action={paySettlement} className="flex flex-wrap items-end gap-3">
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
                        {w.label ?? w.method} ({w.currency.code}) · {w.balanceLyd.toFixed(2)}
                      </option>
                    ))}
                  </select>
                </div>
                <Button type="submit" size="sm">
                  دفع
                </Button>
              </form>
            ) : null}
            {canPay && s.status !== "REVERSED" ? (
              <form action={reverseSettlement}>
                <input type="hidden" name="projectId" value={id} />
                <input type="hidden" name="id" value={s.id} />
                <Button type="submit" size="sm" appearance="ghost" variant="danger">
                  عكس المستخلص
                </Button>
              </form>
            ) : null}
          </Card>
        ))}
      </div>
    </div>
  );
}
