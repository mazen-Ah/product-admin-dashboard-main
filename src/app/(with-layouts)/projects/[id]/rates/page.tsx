import {
  createRateCard,
  deleteRateCard,
  getProject,
  listRateCards,
  listSuppliers,
} from "@/app/actions/masters";
import {
  FormActions,
  FormField,
  FormGrid,
  FormTitle,
  formSelectClassName,
} from "@/components/common/form-field";
import { EmptyState, PageToolbar } from "@/components/common/page-toolbar";
import { Button } from "@/components/tailgrids/core/button";
import { Card } from "@/components/tailgrids/core/card";
import { Input } from "@/components/tailgrids/core/input";
import { Label } from "@/components/tailgrids/core/label";
import { canMutateMasterData, requireSession } from "@/lib/access";
import { redirect } from "next/navigation";

export default async function RatesPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ create?: string }>;
}) {
  const { id } = await params;
  const { create } = await searchParams;
  const session = await requireSession();
  const canEdit = canMutateMasterData((session.user as { role?: string }).role);
  const project = await getProject(id);
  const [rates, suppliers] = await Promise.all([listRateCards(id), listSuppliers()]);
  const showCreate = create === "1" && canEdit;

  async function createAction(formData: FormData) {
    "use server";
    await createRateCard(formData);
    redirect(`/projects/${id}/rates`);
  }

  return (
    <div className="mt-6 space-y-6">
      <PageToolbar
        title="بطاقة الأسعار"
        description={project.name}
        backHref={`/projects/${id}`}
        actionHref={canEdit && !showCreate ? `/projects/${id}/rates?create=1` : undefined}
        actionLabel={canEdit && !showCreate ? "إضافة سعر" : undefined}
      />

      <div className="space-y-4 px-2 lg:px-5">
        {showCreate ? (
          <Card className="max-w-2xl bg-transparent p-5">
            <FormTitle>إضافة سعر</FormTitle>
            <form action={createAction}>
              <input type="hidden" name="projectId" value={id} />
              <FormGrid>
                <FormField>
                  <Label htmlFor="materialName">المادة</Label>
                  <Input id="materialName" name="materialName" required className="w-full" />
                </FormField>
                <FormField>
                  <Label htmlFor="effectiveFrom">ساري من</Label>
                  <Input
                    id="effectiveFrom"
                    name="effectiveFrom"
                    type="date"
                    required
                    className="w-full"
                  />
                </FormField>
                <FormField>
                  <Label htmlFor="materialPrice">سعر المادة</Label>
                  <Input
                    id="materialPrice"
                    name="materialPrice"
                    type="number"
                    step="0.01"
                    required
                    className="w-full"
                  />
                </FormField>
                <FormField>
                  <Label htmlFor="haulagePrice">سعر النقل</Label>
                  <Input
                    id="haulagePrice"
                    name="haulagePrice"
                    type="number"
                    step="0.01"
                    required
                    className="w-full"
                  />
                </FormField>
                <FormField>
                  <Label htmlFor="quarrySupplierId">محجر</Label>
                  <select
                    id="quarrySupplierId"
                    name="quarrySupplierId"
                    className={formSelectClassName}
                  >
                    <option value="">—</option>
                    {suppliers.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name}
                      </option>
                    ))}
                  </select>
                </FormField>
                <FormField>
                  <Label htmlFor="carrierSupplierId">ناقل</Label>
                  <select
                    id="carrierSupplierId"
                    name="carrierSupplierId"
                    className={formSelectClassName}
                  >
                    <option value="">—</option>
                    {suppliers.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name}
                      </option>
                    ))}
                  </select>
                </FormField>
                <FormActions>
                  <a href={`/projects/${id}/rates`}>
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

        {rates.length === 0 && !showCreate ? (
          <EmptyState
            message="لا توجد أسعار"
            actionHref={canEdit ? `/projects/${id}/rates?create=1` : undefined}
            actionLabel={canEdit ? "إضافة سعر" : undefined}
          />
        ) : (
          <ul className="space-y-3">
            {rates.map((rate) => (
              <li key={rate.id}>
                <Card className="flex flex-wrap items-center justify-between gap-4 p-4">
                  <div className="text-sm">
                    <p className="font-semibold text-text-primary">{rate.materialName}</p>
                    <p className="mt-1 text-text-tertiary">
                      مادة {String(rate.materialPrice)} · نقل {String(rate.haulagePrice)} · من{" "}
                      {rate.effectiveFrom.toISOString().slice(0, 10)}
                    </p>
                  </div>
                  {canEdit ? (
                    <form action={deleteRateCard}>
                      <input type="hidden" name="id" value={rate.id} />
                      <input type="hidden" name="projectId" value={id} />
                      <Button type="submit" size="sm" appearance="ghost" variant="danger">
                        حذف
                      </Button>
                    </form>
                  ) : null}
                </Card>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
