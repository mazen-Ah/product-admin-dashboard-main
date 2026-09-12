import { createExpense, listExpenses } from "@/app/actions/expenses";
import { getProject } from "@/app/actions/masters";
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
import { canManageExpenses, requireProjectAccess, sessionRole } from "@/lib/access";
import { redirect } from "next/navigation";

export default async function ExpensesPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ create?: string }>;
}) {
  const { id } = await params;
  const { create } = await searchParams;
  const session = await requireProjectAccess(id);
  const canEdit = canManageExpenses(sessionRole(session));
  await ensureProjectWallets(id);
  const [project, expenses, wallets] = await Promise.all([
    getProject(id),
    listExpenses(id),
    listWallets(id),
  ]);
  const showCreate = create === "1" && canEdit;

  async function createAction(formData: FormData) {
    "use server";
    formData.set("projectId", id);
    await createExpense(formData);
    redirect(`/projects/${id}/expenses`);
  }

  return (
    <div className="mt-6 space-y-5 px-2 lg:px-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-[28px] font-medium text-text-primary">المصروفات</h1>
          <p className="text-sm text-text-tertiary">{project.name}</p>
        </div>
        <div className="flex gap-2">
          {canEdit && !showCreate ? (
            <a href={`/projects/${id}/expenses?create=1`}>
              <Button size="sm">إضافة مصروف</Button>
            </a>
          ) : null}
          <BackToHub projectId={id} />
        </div>
      </div>

      {showCreate ? (
        <Card className="max-w-2xl bg-transparent p-5">
          <FormTitle>مصروف جديد</FormTitle>
          <form action={createAction}>
            <FormGrid>
              <FormField>
                <Label htmlFor="type">النوع</Label>
                <select id="type" name="type" className={formSelectClassName} defaultValue="OTHER">
                  <option value="SUBSISTENCE">إعاشة</option>
                  <option value="GRATUITY">إكرامية</option>
                  <option value="DIESEL">ديزل</option>
                  <option value="PAYROLL">رواتب</option>
                  <option value="TRANSFER_COMMISSION">عمولة تحويل</option>
                  <option value="OTHER">أخرى</option>
                </select>
              </FormField>
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
              <FormField className="md:col-span-2">
                <Label htmlFor="description">الوصف</Label>
                <Input id="description" name="description" required className="w-full" />
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
              <FormActions>
                <a href={`/projects/${id}/expenses`}>
                  <Button type="button" appearance="outline" size="lg" className="px-3.5 text-sm">
                    إلغاء
                  </Button>
                </a>
                <Button type="submit" size="lg" className="px-3.5 text-sm">
                  حفظ
                </Button>
              </FormActions>
            </FormGrid>
          </form>
        </Card>
      ) : null}

      <div className="space-y-3">
        {expenses.map((e) => (
          <Card key={e.id} className="p-4 text-sm">
            <p className="font-semibold text-text-primary">
              {e.type} · {String(e.amountLyd)} LYD
            </p>
            <p className="mt-1 text-text-secondary">
              {e.date.toISOString().slice(0, 10)} · {e.description} · {e.wallet.label ?? e.wallet.method}
            </p>
          </Card>
        ))}
      </div>
    </div>
  );
}
