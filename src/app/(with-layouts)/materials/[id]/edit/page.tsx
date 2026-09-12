import { getMaterial, updateMaterial } from "@/app/actions/masters";
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

export default async function EditMaterialPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await requireSession();
  if (!canMutateMasterData((session.user as { role?: string }).role)) {
    redirect("/materials");
  }
  const material = await getMaterial(id);

  async function saveAction(formData: FormData) {
    "use server";
    formData.set("id", id);
    await updateMaterial(formData);
    redirect("/materials");
  }

  return (
    <div className="mt-6 space-y-6">
      <PageToolbar title="تعديل مادة" backHref="/materials" />
      <div className="px-2 lg:px-5">
        <Card className="max-w-2xl bg-transparent p-5">
          <FormTitle>{material.name}</FormTitle>
          <form action={saveAction}>
            <FormGrid>
              <FormField className="md:col-span-2">
                <Label htmlFor="name">الاسم</Label>
                <Input
                  id="name"
                  name="name"
                  defaultValue={material.name}
                  required
                  className="w-full"
                />
              </FormField>
              <FormField>
                <Label htmlFor="unit">الوحدة</Label>
                <Input
                  id="unit"
                  name="unit"
                  defaultValue={material.unit}
                  className="w-full"
                />
              </FormField>
              <FormField>
                <Label htmlFor="code">الرمز</Label>
                <Input
                  id="code"
                  name="code"
                  defaultValue={material.code ?? ""}
                  className="w-full"
                />
              </FormField>
              <FormActions>
                <Link href="/materials">
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
