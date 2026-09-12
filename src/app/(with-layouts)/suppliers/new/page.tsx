import { createSupplier } from "@/app/actions/masters";
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

export default async function NewSupplierPage() {
  const session = await requireSession();
  if (!canMutateMasterData((session.user as { role?: string }).role)) {
    redirect("/suppliers");
  }

  async function createAction(formData: FormData) {
    "use server";
    await createSupplier(formData);
    redirect("/suppliers");
  }

  return (
    <div className="mt-6 space-y-6">
      <PageToolbar title="إضافة مورد" backHref="/suppliers" />
      <div className="px-2 lg:px-5">
        <Card className="max-w-2xl bg-transparent p-5">
          <FormTitle>بيانات المورد</FormTitle>
          <form action={createAction}>
            <FormGrid>
              <FormField className="md:col-span-2">
                <Label htmlFor="name">الاسم</Label>
                <Input id="name" name="name" required className="w-full" />
              </FormField>
              <FormField>
                <Label htmlFor="contact">التواصل</Label>
                <Input id="contact" name="contact" className="w-full" />
              </FormField>
              <FormField>
                <Label htmlFor="type">النوع</Label>
                <Input id="type" name="type" placeholder="محجر / نقل" className="w-full" />
              </FormField>
              <FormActions>
                <Link href="/suppliers">
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
