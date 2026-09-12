import { getProject } from "@/app/actions/masters";
import {
  computeSurplus,
  createCollection,
  createDistribution,
  listCollections,
} from "@/app/actions/profit";
import { ensureProjectWallets, listWallets } from "@/app/actions/treasury";
import { BackToHub } from "@/components/common/back-to-hub";
import {
  FormActions,
  FormField,
  FormGrid,
  FormTitle,
  formSelectClassName,
} from "@/components/common/form-field";
import { Button } from "@/components/tailgrids/core/button";
import { Card } from "@/components/tailgrids/core/card";
import { Input } from "@/components/tailgrids/core/input";
import { Label } from "@/components/tailgrids/core/label";
import {
  canCloseProject,
  canPaySettlement,
  requireProjectAccess,
  sessionRole,
} from "@/lib/access";
import { redirect } from "next/navigation";

export default async function ProfitabilityPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await requireProjectAccess(id);
  const role = sessionRole(session);
  const canCollect = canPaySettlement(role);
  const canDistribute = canCloseProject(role);
  await ensureProjectWallets(id);
  const [project, surplus, collections, wallets] = await Promise.all([
    getProject(id),
    computeSurplus(id),
    listCollections(id),
    listWallets(id),
  ]);

  async function collectAction(formData: FormData) {
    "use server";
    formData.set("projectId", id);
    await createCollection(formData);
    redirect(`/projects/${id}/profitability`);
  }

  async function distributeAction(formData: FormData) {
    "use server";
    formData.set("projectId", id);
    await createDistribution(formData);
    redirect(`/projects/${id}/profitability`);
  }

  return (
    <div className="mt-6 space-y-5 px-2 lg:px-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-[28px] font-medium text-text-primary">الربحية والتوزيع</h1>
          <p className="text-sm text-text-tertiary">{project.name}</p>
        </div>
        <BackToHub projectId={id} />
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="p-4">
          <p className="text-xs text-text-tertiary">تحصيلات</p>
          <p className="mt-1 text-xl font-semibold">{surplus.collected.toFixed(2)}</p>
        </Card>
        <Card className="p-4">
          <p className="text-xs text-text-tertiary">تكاليف نقدية</p>
          <p className="mt-1 text-xl font-semibold">{surplus.cashCosts.toFixed(2)}</p>
        </Card>
        <Card className="p-4">
          <p className="text-xs text-text-tertiary">احتجاز</p>
          <p className="mt-1 text-xl font-semibold">{surplus.retention.toFixed(2)}</p>
        </Card>
        <Card className="p-4">
          <p className="text-xs text-text-tertiary">الفائض</p>
          <p className="mt-1 text-xl font-semibold">{surplus.surplus.toFixed(2)}</p>
        </Card>
      </div>

      {canCollect ? (
        <Card className="bg-transparent p-5">
          <FormTitle>تحصيل من العميل</FormTitle>
          <form action={collectAction}>
            <FormGrid>
              <FormField>
                <Label htmlFor="date">التاريخ</Label>
                <Input
                  id="date"
                  name="date"
                  type="date"
                  required
                  defaultValue={new Date().toISOString().slice(0, 10)}
                  className="w-full"
                />
              </FormField>
              <FormField>
                <Label htmlFor="amount">المبلغ</Label>
                <Input id="amount" name="amount" type="number" step="0.01" required className="w-full" />
              </FormField>
              <FormField>
                <Label htmlFor="walletId">المحفظة</Label>
                <select id="walletId" name="walletId" required className={formSelectClassName}>
                  {wallets.map((w) => (
                    <option key={w.id} value={w.id}>
                      {w.label ?? w.method}
                    </option>
                  ))}
                </select>
              </FormField>
              <FormField>
                <Label htmlFor="note">ملاحظة</Label>
                <Input id="note" name="note" className="w-full" />
              </FormField>
              <FormActions>
                <Button type="submit" size="lg" className="px-3.5 text-sm">
                  تسجيل التحصيل
                </Button>
              </FormActions>
            </FormGrid>
          </form>
        </Card>
      ) : null}

      {canDistribute ? (
        <Card className="bg-transparent p-5">
          <FormTitle>توزيع الفائض على الشركاء</FormTitle>
          <form action={distributeAction}>
            <FormGrid>
              <FormField className="md:col-span-2">
                <Label htmlFor="note">ملاحظة</Label>
                <Input id="note" name="note" className="w-full" />
              </FormField>
              <FormActions>
                <Button type="submit" size="lg" className="px-3.5 text-sm">
                  توزيع الآن ({surplus.surplus.toFixed(2)})
                </Button>
              </FormActions>
            </FormGrid>
          </form>
        </Card>
      ) : null}

      <Card className="p-4">
        <h3 className="mb-3 font-semibold">التحصيلات</h3>
        <ul className="space-y-2 text-sm">
          {collections.map((c) => (
            <li key={c.id}>
              {c.date.toISOString().slice(0, 10)} · {String(c.amountLyd)} ·{" "}
              {c.wallet.label ?? c.wallet.method}
            </li>
          ))}
        </ul>
      </Card>
    </div>
  );
}
