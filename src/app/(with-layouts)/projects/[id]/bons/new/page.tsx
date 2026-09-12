import { createBon } from "@/app/actions/bons";
import { listTallies } from "@/app/actions/tallies";
import {
  getProject,
  listMaterials,
  listRateCards,
  listSuppliers,
  listTrucks,
} from "@/app/actions/masters";
import {
  FormActions,
  FormField,
  FormGrid,
  FormTitle,
  formSelectClassName,
} from "@/components/common/form-field";
import { PageToolbar } from "@/components/common/page-toolbar";
import { Button } from "@/components/tailgrids/core/button";
import { Card } from "@/components/tailgrids/core/card";
import { Input } from "@/components/tailgrids/core/input";
import { Label } from "@/components/tailgrids/core/label";
import { canCreateBon, requireProjectAccess, sessionRole } from "@/lib/access";
import Link from "next/link";
import { redirect } from "next/navigation";

export default async function NewBonPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await requireProjectAccess(id);
  if (!canCreateBon(sessionRole(session))) redirect(`/projects/${id}/bons`);

  const [project, suppliers, materials, trucks, rates, tallies] = await Promise.all([
    getProject(id),
    listSuppliers(),
    listMaterials(),
    listTrucks(),
    listRateCards(id),
    listTallies(id),
  ]);

  const rate = rates[0];
  const quarries = suppliers.filter((s) => (s.type ?? "").includes("محجر") || !s.type);
  const carriers = suppliers.filter((s) => (s.type ?? "").includes("نقل") || !s.type);

  async function createAction(formData: FormData) {
    "use server";
    formData.set("projectId", id);
    await createBon(formData);
    redirect(`/projects/${id}/bons`);
  }

  return (
    <div className="mt-6 space-y-6">
      <PageToolbar title="إضافة بون" description={project.name} backHref={`/projects/${id}/bons`} />
      <div className="px-2 lg:px-5">
        <Card className="w-full bg-transparent p-5">
          <FormTitle>بيانات البون</FormTitle>
          <form action={createAction} encType="multipart/form-data">
            <FormGrid>
              <FormField>
                <Label htmlFor="kind">النوع</Label>
                <select id="kind" name="kind" defaultValue="EXTERNAL" className={formSelectClassName}>
                  <option value="EXTERNAL">خارجي</option>
                  <option value="INTERNAL">داخلي</option>
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
              <FormField>
                <Label htmlFor="paperSerial">الرقم الورقي</Label>
                <Input id="paperSerial" name="paperSerial" required className="w-full" />
              </FormField>
              <FormField>
                <Label htmlFor="tallyId">كشف التوقيع</Label>
                <select id="tallyId" name="tallyId" className={formSelectClassName}>
                  <option value="">—</option>
                  {tallies.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.date.toISOString().slice(0, 10)} · موقع {t.signedTrips} · مسجل{" "}
                      {t.reportedTrips}
                    </option>
                  ))}
                </select>
              </FormField>
              <FormField>
                <Label htmlFor="materialName">المادة</Label>
                <Input
                  id="materialName"
                  name="materialName"
                  required
                  defaultValue={rate?.materialName ?? materials[0]?.name ?? ""}
                  className="w-full"
                />
              </FormField>
              <FormField>
                <Label htmlFor="truckPlate">لوحة الشاحنة</Label>
                <select id="truckPlate" name="truckPlate" required className={formSelectClassName}>
                  {trucks.map((t) => (
                    <option key={t.id} value={t.plate}>
                      {t.plate}
                    </option>
                  ))}
                </select>
              </FormField>
              <FormField>
                <Label htmlFor="trips">الرحلات</Label>
                <Input id="trips" name="trips" type="number" min={1} defaultValue={1} required className="w-full" />
              </FormField>
              <FormField>
                <Label htmlFor="qtyM3">الكمية م³</Label>
                <Input id="qtyM3" name="qtyM3" type="number" step="0.01" required className="w-full" />
              </FormField>
              <FormField>
                <Label htmlFor="deductionM3">الخصم م³</Label>
                <Input
                  id="deductionM3"
                  name="deductionM3"
                  type="number"
                  step="0.01"
                  defaultValue={0}
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
                  defaultValue={rate ? String(rate.materialPrice) : "0"}
                  className="w-full"
                />
              </FormField>
              <FormField className="md:col-span-2">
                <Label htmlFor="haulagePrice">سعر النقل</Label>
                <Input
                  id="haulagePrice"
                  name="haulagePrice"
                  type="number"
                  step="0.01"
                  defaultValue={rate ? String(rate.haulagePrice) : "0"}
                  className="w-full"
                />
              </FormField>
              <FormField>
                <Label htmlFor="quarrySupplierId">المورد (محجر)</Label>
                <select
                  id="quarrySupplierId"
                  name="quarrySupplierId"
                  className={formSelectClassName}
                  defaultValue={rate?.quarrySupplierId ?? quarries[0]?.id ?? ""}
                >
                  {suppliers.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </FormField>
              <FormField>
                <Label htmlFor="carrierSupplierId">الناقل</Label>
                <select
                  id="carrierSupplierId"
                  name="carrierSupplierId"
                  className={formSelectClassName}
                  defaultValue={rate?.carrierSupplierId ?? carriers[0]?.id ?? ""}
                >
                  {suppliers.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </FormField>
              <FormField className="md:col-span-2">
                <Label htmlFor="photo">صورة البون (إلزامية للخارجي)</Label>
                <Input id="photo" name="photo" type="file" accept="image/*" className="w-full" />
              </FormField>
              <FormField className="md:col-span-2">
                <Label htmlFor="overTallyReason">سبب تجاوز التوقيع (إن وجد)</Label>
                <Input id="overTallyReason" name="overTallyReason" className="w-full" />
              </FormField>
              <FormActions>
                <Link href={`/projects/${id}/bons`}>
                  <Button type="button" appearance="outline" size="lg" className="px-3.5 text-sm">
                    إلغاء
                  </Button>
                </Link>
                <Button type="submit" size="lg" className="px-3.5 text-sm">
                  حفظ
                </Button>
              </FormActions>
            </FormGrid>
          </form>
        </Card>
      </div>
    </div>
  );
}
