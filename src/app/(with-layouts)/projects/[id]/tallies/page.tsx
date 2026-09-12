import { createTally, deleteTally, listTallies } from "@/app/actions/tallies";
import { getProject } from "@/app/actions/masters";
import { BackToHub } from "@/components/common/back-to-hub";
import {
  FormActions,
  FormField,
  FormGrid,
  FormTitle,
} from "@/components/common/form-field";
import { EmptyState } from "@/components/common/page-toolbar";
import { Badge } from "@/components/tailgrids/core/badge";
import { Button } from "@/components/tailgrids/core/button";
import { Card } from "@/components/tailgrids/core/card";
import { Input } from "@/components/tailgrids/core/input";
import { Label } from "@/components/tailgrids/core/label";
import { canCreateBon, requireProjectAccess, sessionRole } from "@/lib/access";
import { redirect } from "next/navigation";

export default async function TalliesPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ create?: string }>;
}) {
  const { id } = await params;
  const { create } = await searchParams;
  const session = await requireProjectAccess(id);
  const canEdit = canCreateBon(sessionRole(session));
  const project = await getProject(id);
  const tallies = await listTallies(id);
  const showCreate = create === "1" && canEdit;

  async function createAction(formData: FormData) {
    "use server";
    formData.set("projectId", id);
    await createTally(formData);
    redirect(`/projects/${id}/tallies`);
  }

  return (
    <div className="mt-6 space-y-5 px-2 lg:px-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-[28px] font-medium text-text-primary">كشوف التوقيع</h1>
          <p className="text-sm text-text-tertiary">{project.name}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {canEdit && !showCreate ? (
            <a href={`/projects/${id}/tallies?create=1`}>
              <Button size="sm">إضافة كشف</Button>
            </a>
          ) : null}
          <BackToHub projectId={id} />
        </div>
      </div>

      {showCreate ? (
        <Card className="max-w-2xl bg-transparent p-5">
          <FormTitle>كشف توقيع جديد</FormTitle>
          <form action={createAction}>
            <FormGrid>
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
                <Label htmlFor="signedTrips">الرحلات الموقعة</Label>
                <Input
                  id="signedTrips"
                  name="signedTrips"
                  type="number"
                  min={1}
                  required
                  className="w-full"
                />
              </FormField>
              <FormField className="md:col-span-2">
                <Label htmlFor="notes">ملاحظات</Label>
                <Input id="notes" name="notes" className="w-full" />
              </FormField>
              <FormActions>
                <a href={`/projects/${id}/tallies`}>
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

      {tallies.length === 0 && !showCreate ? (
        <EmptyState
          message="لا توجد كشوف"
          actionHref={canEdit ? `/projects/${id}/tallies?create=1` : undefined}
          actionLabel={canEdit ? "إضافة كشف" : undefined}
        />
      ) : (
        <div className="space-y-3">
          {tallies.map((t) => (
            <Card key={t.id} className="flex flex-wrap items-center justify-between gap-3 p-4">
              <div className="text-sm text-text-secondary">
                <p className="font-semibold text-text-primary">
                  {t.date.toISOString().slice(0, 10)}
                </p>
                <p className="mt-1">
                  موقع {t.signedTrips} · مسجّل في البونات {t.reportedTrips}
                </p>
                {t.notes ? <p className="mt-1">{t.notes}</p> : null}
                <div className="mt-2 flex gap-2">
                  {t.underTally ? <Badge color="warning">نقص بونات</Badge> : null}
                  {t.overTally ? <Badge color="warning">تجاوز التوقيع</Badge> : null}
                  {!t.underTally && !t.overTally ? (
                    <Badge color="success">متطابق</Badge>
                  ) : null}
                </div>
              </div>
              {canEdit ? (
                <form action={deleteTally}>
                  <input type="hidden" name="projectId" value={id} />
                  <input type="hidden" name="id" value={t.id} />
                  <Button type="submit" size="sm" appearance="ghost" variant="danger">
                    حذف
                  </Button>
                </form>
              ) : null}
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
