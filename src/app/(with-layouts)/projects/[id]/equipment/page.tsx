import {
  createEquipment,
  deleteEquipment,
  getProject,
  listEquipment,
} from "@/app/actions/masters";
import { createEquipmentLog, listEquipmentLogs } from "@/app/actions/expenses";
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
import {
  canManageExpenses,
  canMutateMasterData,
  requireProjectAccess,
  sessionRole,
} from "@/lib/access";
import { redirect } from "next/navigation";

export default async function EquipmentPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ create?: string; log?: string }>;
}) {
  const { id } = await params;
  const sp = await searchParams;
  const session = await requireProjectAccess(id);
  const role = sessionRole(session);
  const canEdit = canMutateMasterData(role);
  const canLog = canManageExpenses(role);
  const project = await getProject(id);
  const [equipment, logs] = await Promise.all([listEquipment(id), listEquipmentLogs(id)]);
  const showCreate = sp.create === "1" && canEdit;
  const showLog = sp.log === "1" && canLog;

  async function createAction(formData: FormData) {
    "use server";
    await createEquipment(formData);
    redirect(`/projects/${id}/equipment`);
  }

  async function logAction(formData: FormData) {
    "use server";
    formData.set("projectId", id);
    await createEquipmentLog(formData);
    redirect(`/projects/${id}/equipment`);
  }

  return (
    <div className="mt-6 space-y-6">
      <PageToolbar
        title="المعدات"
        description={project.name}
        backHref={`/projects/${id}`}
        actionHref={canEdit && !showCreate ? `/projects/${id}/equipment?create=1` : undefined}
        actionLabel={canEdit && !showCreate ? "إضافة معدة" : undefined}
      />

      <div className="space-y-4 px-2 lg:px-5">
        {canLog && !showLog ? (
          <a href={`/projects/${id}/equipment?log=1`}>
            <Button size="sm" appearance="outline">
              تسجيل فترة تشغيل
            </Button>
          </a>
        ) : null}

        {showCreate ? (
          <Card className="max-w-2xl bg-transparent p-5">
            <FormTitle>إضافة معدة</FormTitle>
            <form action={createAction}>
              <input type="hidden" name="projectId" value={id} />
              <FormGrid>
                <FormField className="md:col-span-2">
                  <Label htmlFor="name">الاسم</Label>
                  <Input id="name" name="name" required className="w-full" />
                </FormField>
                <FormField>
                  <Label htmlFor="ownership">الملكية</Label>
                  <select
                    id="ownership"
                    name="ownership"
                    defaultValue="OWNED"
                    className={formSelectClassName}
                  >
                    <option value="OWNED">مملوك</option>
                    <option value="RENTED">مستأجر</option>
                  </select>
                </FormField>
                <FormField>
                  <Label htmlFor="chargingMethod">طريقة الاحتساب</Label>
                  <select
                    id="chargingMethod"
                    name="chargingMethod"
                    defaultValue="BY_HOUR"
                    className={formSelectClassName}
                  >
                    <option value="BY_HOUR">بالساعة</option>
                    <option value="BY_DAY">باليوم</option>
                    <option value="BY_MONTH">بالشهر</option>
                    <option value="BY_METRE">بالمتر</option>
                  </select>
                </FormField>
                <FormField>
                  <Label htmlFor="hoursPerDay">ساعات يوم العمل</Label>
                  <Input
                    id="hoursPerDay"
                    name="hoursPerDay"
                    type="number"
                    step="0.01"
                    className="w-full"
                  />
                </FormField>
                <FormField>
                  <Label htmlFor="monthlyRate">الأجر الشهري</Label>
                  <Input
                    id="monthlyRate"
                    name="monthlyRate"
                    type="number"
                    step="0.01"
                    className="w-full"
                  />
                </FormField>
                <FormActions>
                  <a href={`/projects/${id}/equipment`}>
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

        {showLog ? (
          <Card className="max-w-2xl bg-transparent p-5">
            <FormTitle>فترة تشغيل (معيار 26 × ساعات/يوم)</FormTitle>
            <form action={logAction}>
              <FormGrid>
                <FormField className="md:col-span-2">
                  <Label htmlFor="equipmentId">المعدة</Label>
                  <select
                    id="equipmentId"
                    name="equipmentId"
                    required
                    className={formSelectClassName}
                  >
                    {equipment.map((e) => (
                      <option key={e.id} value={e.id}>
                        {e.name}
                      </option>
                    ))}
                  </select>
                </FormField>
                <FormField>
                  <Label htmlFor="periodStart">من</Label>
                  <Input id="periodStart" name="periodStart" type="date" required className="w-full" />
                </FormField>
                <FormField>
                  <Label htmlFor="periodEnd">إلى</Label>
                  <Input id="periodEnd" name="periodEnd" type="date" required className="w-full" />
                </FormField>
                <FormField>
                  <Label htmlFor="actualHours">ساعات فعلية</Label>
                  <Input
                    id="actualHours"
                    name="actualHours"
                    type="number"
                    step="0.01"
                    required
                    className="w-full"
                  />
                </FormField>
                <FormField>
                  <Label htmlFor="unitRate">أجر الساعة</Label>
                  <Input id="unitRate" name="unitRate" type="number" step="0.01" className="w-full" />
                </FormField>
                <FormActions>
                  <a href={`/projects/${id}/equipment`}>
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

        {equipment.length === 0 && !showCreate ? (
          <EmptyState
            message="لا توجد معدات"
            actionHref={canEdit ? `/projects/${id}/equipment?create=1` : undefined}
            actionLabel={canEdit ? "إضافة معدة" : undefined}
          />
        ) : (
          <ul className="space-y-3">
            {equipment.map((item) => (
              <li key={item.id}>
                <Card className="flex flex-wrap items-center justify-between gap-4 p-4">
                  <div className="text-sm">
                    <p className="font-semibold text-text-primary">{item.name}</p>
                    <p className="mt-1 text-text-tertiary">
                      {item.ownership} · {item.chargingMethod}
                      {item.hoursPerDay != null ? ` · ${String(item.hoursPerDay)} س/يوم` : ""}
                      {item.monthlyRate != null ? ` · ${String(item.monthlyRate)}` : ""}
                    </p>
                  </div>
                  {canEdit ? (
                    <form action={deleteEquipment}>
                      <input type="hidden" name="id" value={item.id} />
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

        {logs.length > 0 ? (
          <Card className="p-4">
            <h3 className="mb-3 font-semibold">سجل التشغيل</h3>
            <ul className="space-y-2 text-sm">
              {logs.map((l) => (
                <li key={l.id}>
                  {l.equipment.name} · {l.periodStart.toISOString().slice(0, 10)} →{" "}
                  {l.periodEnd.toISOString().slice(0, 10)} · فعلي {String(l.actualHours)} / معيار{" "}
                  {String(l.standardHours)} · نقدي {String(l.cashCostLyd)} · كتب{" "}
                  {String(l.booksChargeLyd)}
                </li>
              ))}
            </ul>
          </Card>
        ) : null}
      </div>
    </div>
  );
}
