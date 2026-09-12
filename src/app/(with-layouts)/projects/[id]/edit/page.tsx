import { getProject, updateProject } from "@/app/actions/masters";
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
import { canMutateMasterData, requireSession } from "@/lib/access";
import Link from "next/link";
import { redirect } from "next/navigation";

export default async function EditProjectPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await requireSession();
  if (!canMutateMasterData((session.user as { role?: string }).role)) {
    redirect(`/projects/${id}`);
  }
  const project = await getProject(id);

  async function saveAction(formData: FormData) {
    "use server";
    formData.set("id", id);
    await updateProject(formData);
    redirect(`/projects/${id}`);
  }

  return (
    <div className="mt-6 space-y-6">
      <PageToolbar title="تعديل المشروع" backHref={`/projects/${id}`} />
      <div className="px-2 lg:px-5">
        <Card className="max-w-3xl bg-transparent p-5">
          <FormTitle>{project.name}</FormTitle>
          <form action={saveAction}>
            <FormGrid>
              <FormField>
                <Label htmlFor="name">الاسم</Label>
                <Input
                  id="name"
                  name="name"
                  defaultValue={project.name}
                  required
                  className="w-full"
                />
              </FormField>
              <FormField>
                <Label htmlFor="tradeName">الاسم التجاري</Label>
                <Input
                  id="tradeName"
                  name="tradeName"
                  defaultValue={project.tradeName ?? ""}
                  className="w-full"
                />
              </FormField>
              <FormField>
                <Label htmlFor="location">الموقع</Label>
                <Input
                  id="location"
                  name="location"
                  defaultValue={project.location ?? ""}
                  className="w-full"
                />
              </FormField>
              <FormField>
                <Label htmlFor="contractValue">قيمة العقد (LYD)</Label>
                <Input
                  id="contractValue"
                  name="contractValue"
                  type="number"
                  step="0.01"
                  defaultValue={String(project.contractValue)}
                  required
                  className="w-full"
                />
              </FormField>
              <FormField>
                <Label htmlFor="retentionPercent">نسبة الاحتجاز %</Label>
                <Input
                  id="retentionPercent"
                  name="retentionPercent"
                  type="number"
                  step="0.01"
                  defaultValue={String(project.retentionPercent)}
                  className="w-full"
                />
              </FormField>
              <FormField>
                <Label htmlFor="clientName">العميل</Label>
                <Input
                  id="clientName"
                  name="clientName"
                  defaultValue={project.client?.name ?? ""}
                  required
                  className="w-full"
                />
              </FormField>
              <FormField>
                <Label htmlFor="status">الحالة</Label>
                <select
                  id="status"
                  name="status"
                  defaultValue={project.status}
                  className={formSelectClassName}
                >
                  <option value="ACTIVE">نشط</option>
                  <option value="SUSPENDED">موقوف</option>
                  <option value="COMPLETED">مكتمل</option>
                  <option value="CLOSED">مغلق</option>
                  <option value="PARTIALLY_CANCELLED">ملغى جزئياً</option>
                </select>
              </FormField>
              <div className="flex items-center gap-2.5 md:col-span-2">
                <input
                  type="checkbox"
                  name="taxable"
                  id="taxable"
                  defaultChecked={project.taxable}
                  className="size-4 rounded border-card-border"
                />
                <Label htmlFor="taxable" className="font-normal text-text-secondary">
                  خاضع للضريبة
                </Label>
              </div>
              <FormActions>
                <Link href={`/projects/${id}`}>
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
