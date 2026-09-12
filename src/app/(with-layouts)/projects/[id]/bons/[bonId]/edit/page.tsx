import { getBon, updateBon } from "@/app/actions/bons";
import { listTallies } from "@/app/actions/tallies";
import { getProject, listSuppliers, listTrucks } from "@/app/actions/masters";
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

export default async function EditBonPage({
  params,
}: {
  params: Promise<{ id: string; bonId: string }>;
}) {
  const { id, bonId } = await params;
  const session = await requireProjectAccess(id);
  if (!canCreateBon(sessionRole(session))) redirect(`/projects/${id}/bons`);

  const [project, bon, suppliers, trucks, tallies] = await Promise.all([
    getProject(id),
    getBon(id, bonId),
    listSuppliers(),
    listTrucks(),
    listTallies(id),
  ]);

  if (bon.status !== "PENDING") redirect(`/projects/${id}/bons`);

  const materialLine = bon.payableLines.find((l) => l.type === "MATERIAL");
  const haulageLine = bon.payableLines.find((l) => l.type === "HAULAGE");

  async function saveAction(formData: FormData) {
    "use server";
    formData.set("projectId", id);
    formData.set("id", bonId);
    await updateBon(formData);
    redirect(`/projects/${id}/bons`);
  }

  return (
    <div className="mt-6 space-y-6">
      <PageToolbar
        title={`تعديل بون #${bon.seq}`}
        description={project.name}
        backHref={`/projects/${id}/bons`}
      />
      <div className="px-2 lg:px-5">
        <Card className="w-full bg-transparent p-5">
          <FormTitle>بون #{bon.seq}</FormTitle>
          <form action={saveAction} encType="multipart/form-data">
            <FormGrid>
              <FormField>
                <Label htmlFor="date">التاريخ</Label>
                <Input
                  id="date"
                  name="date"
                  type="date"
                  required
                  defaultValue={bon.date.toISOString().slice(0, 10)}
                  className="w-full"
                />
              </FormField>
              <FormField>
                <Label htmlFor="paperSerial">الرقم الورقي</Label>
                <Input
                  id="paperSerial"
                  name="paperSerial"
                  required
                  defaultValue={bon.paperSerial}
                  className="w-full"
                />
              </FormField>
              <FormField>
                <Label htmlFor="tallyId">كشف التوقيع</Label>
                <select
                  id="tallyId"
                  name="tallyId"
                  className={formSelectClassName}
                  defaultValue={bon.tallyId ?? ""}
                >
                  <option value="">—</option>
                  {tallies.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.date.toISOString().slice(0, 10)} · موقع {t.signedTrips}
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
                  defaultValue={bon.materialName}
                  className="w-full"
                />
              </FormField>
              <FormField>
                <Label htmlFor="truckPlate">لوحة الشاحنة</Label>
                <select
                  id="truckPlate"
                  name="truckPlate"
                  required
                  className={formSelectClassName}
                  defaultValue={bon.truckPlate}
                >
                  {trucks.map((t) => (
                    <option key={t.id} value={t.plate}>
                      {t.plate}
                    </option>
                  ))}
                </select>
              </FormField>
              <FormField>
                <Label htmlFor="trips">الرحلات</Label>
                <Input
                  id="trips"
                  name="trips"
                  type="number"
                  min={1}
                  defaultValue={bon.trips}
                  required
                  className="w-full"
                />
              </FormField>
              <FormField>
                <Label htmlFor="qtyM3">الكمية م³</Label>
                <Input
                  id="qtyM3"
                  name="qtyM3"
                  type="number"
                  step="0.01"
                  defaultValue={String(bon.qtyM3)}
                  required
                  className="w-full"
                />
              </FormField>
              <FormField>
                <Label htmlFor="deductionM3">الخصم م³</Label>
                <Input
                  id="deductionM3"
                  name="deductionM3"
                  type="number"
                  step="0.01"
                  defaultValue={String(bon.deductionM3)}
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
                  defaultValue={String(bon.materialPrice)}
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
                  defaultValue={String(bon.haulagePrice)}
                  className="w-full"
                />
              </FormField>
              <FormField>
                <Label htmlFor="quarrySupplierId">المورد (محجر)</Label>
                <select
                  id="quarrySupplierId"
                  name="quarrySupplierId"
                  className={formSelectClassName}
                  defaultValue={materialLine?.supplierId ?? ""}
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
                  defaultValue={haulageLine?.supplierId ?? ""}
                >
                  {suppliers.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </FormField>
              <FormField className="md:col-span-2">
                <Label htmlFor="photo">استبدال الصورة</Label>
                <Input id="photo" name="photo" type="file" accept="image/*" className="w-full" />
              </FormField>
              <FormField className="md:col-span-2">
                <Label htmlFor="overTallyReason">سبب تجاوز التوقيع</Label>
                <Input
                  id="overTallyReason"
                  name="overTallyReason"
                  defaultValue={bon.overTallyReason ?? ""}
                  className="w-full"
                />
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
