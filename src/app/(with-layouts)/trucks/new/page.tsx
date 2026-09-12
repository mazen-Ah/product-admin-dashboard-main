import { createTruck } from "@/app/actions/masters";
import {
  FormActions,
  FormField,
  FormGrid,
  FormTitle,
} from "@/components/common/form-field";
import { PageToolbar } from "@/components/common/page-toolbar";
import { Button } from "@/components/tailgrids/core/button";
import { Card } from "@/components/tailgrids/core/card";
import { Input } from "@/components/tailgrids/core/input";
import { Label } from "@/components/tailgrids/core/label";
import { canMutateMasterData, requireSession } from "@/lib/access";
import Link from "next/link";
import { redirect } from "next/navigation";

export default async function NewTruckPage() {
  const session = await requireSession();
  if (!canMutateMasterData((session.user as { role?: string }).role)) {
    redirect("/trucks");
  }

  async function createAction(formData: FormData) {
    "use server";
    await createTruck(formData);
    redirect("/trucks");
  }

  return (
    <div className="mt-6 space-y-6">
      <PageToolbar title="إضافة شاحنة" backHref="/trucks" />
      <div className="px-2 lg:px-5">
        <Card className="max-w-2xl bg-transparent p-5">
          <FormTitle>بيانات الشاحنة</FormTitle>
          <form action={createAction}>
            <FormGrid>
              <FormField className="md:col-span-2">
                <Label htmlFor="plate">اللوحة</Label>
                <Input id="plate" name="plate" required className="w-full" />
              </FormField>
              <FormField>
                <Label htmlFor="payloadM3">الحمولة م³</Label>
                <Input
                  id="payloadM3"
                  name="payloadM3"
                  type="number"
                  step="0.01"
                  className="w-full"
                />
              </FormField>
              <FormField>
                <Label htmlFor="driver">السائق</Label>
                <Input id="driver" name="driver" className="w-full" />
              </FormField>
              <FormActions>
                <Link href="/trucks">
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
