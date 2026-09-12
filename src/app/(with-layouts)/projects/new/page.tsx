import { createProject } from "@/app/actions/masters";
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

export default async function NewProjectPage() {
  const session = await requireSession();
  if (!canMutateMasterData((session.user as { role?: string }).role)) {
    redirect("/");
  }

  async function createAction(formData: FormData) {
    "use server";
    const id = await createProject(formData);
    redirect(`/projects/${id}`);
  }

  return (
    <div className="mt-6 space-y-6">
      <PageToolbar
        title="إنشاء مشروع"
        description="أدخل بيانات المشروع والعقد ثم احفظ"
        backHref="/"
      />

      <div className="px-2 lg:px-5">
        <Card className="max-w-3xl bg-transparent p-5">
          <FormTitle>بيانات المشروع</FormTitle>
          <form action={createAction}>
            <FormGrid>
              <FormField>
                <Label htmlFor="name">الاسم</Label>
                <Input id="name" name="name" required className="w-full" />
              </FormField>
              <FormField>
                <Label htmlFor="tradeName">الاسم التجاري</Label>
                <Input id="tradeName" name="tradeName" className="w-full" />
              </FormField>
              <FormField>
                <Label htmlFor="location">الموقع</Label>
                <Input id="location" name="location" className="w-full" />
              </FormField>
              <FormField>
                <Label htmlFor="contractValue">قيمة العقد (LYD)</Label>
                <Input
                  id="contractValue"
                  name="contractValue"
                  type="number"
                  step="0.01"
                  required
                  className="w-full"
                />
              </FormField>
              <FormField className="md:col-span-2">
                <Label htmlFor="clientName">العميل</Label>
                <Input id="clientName" name="clientName" required className="w-full" />
              </FormField>
              <div className="flex items-center gap-2.5 md:col-span-2">
                <input
                  type="checkbox"
                  name="taxable"
                  id="taxable"
                  className="size-4 rounded border-card-border"
                />
                <Label htmlFor="taxable" className="font-normal text-text-secondary">
                  خاضع للضريبة
                </Label>
              </div>
              <FormActions>
                <Link href="/">
                  <Button type="button" appearance="outline" size="lg" className="px-3.5 text-sm">
                    إلغاء
                  </Button>
                </Link>
                <Button type="submit" size="lg" className="px-3.5 text-sm">
                  إنشاء
                </Button>
              </FormActions>
            </FormGrid>
          </form>
        </Card>
      </div>
    </div>
  );
}
