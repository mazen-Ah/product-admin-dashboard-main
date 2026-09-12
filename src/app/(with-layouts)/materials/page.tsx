import { deleteMaterial, listMaterials } from "@/app/actions/masters";
import { EmptyState, PageToolbar } from "@/components/common/page-toolbar";
import { Button } from "@/components/tailgrids/core/button";
import { Card } from "@/components/tailgrids/core/card";
import { canMutateMasterData, requireSession } from "@/lib/access";
import Link from "next/link";

export default async function MaterialsPage() {
  const session = await requireSession();
  const canEdit = canMutateMasterData((session.user as { role?: string }).role);
  const materials = await listMaterials();

  return (
    <div className="mt-6 space-y-6">
      <PageToolbar
        title="المواد"
        description={`${materials.length} مادة`}
        actionHref={canEdit ? "/materials/new" : undefined}
        actionLabel={canEdit ? "إضافة مادة" : undefined}
      />

      <div className="space-y-3 px-2 lg:px-5">
        {materials.length === 0 ? (
          <EmptyState
            message="لا توجد مواد"
            actionHref={canEdit ? "/materials/new" : undefined}
            actionLabel={canEdit ? "إضافة مادة" : undefined}
          />
        ) : (
          <ul className="space-y-3">
            {materials.map((material) => (
              <li key={material.id}>
                <Card className="flex flex-wrap items-center justify-between gap-4 p-4">
                  <div className="min-w-0">
                    <p className="font-semibold text-text-primary">{material.name}</p>
                    <p className="mt-1 text-sm text-text-tertiary">
                      {material.unit}
                      {material.code ? ` · ${material.code}` : ""}
                    </p>
                  </div>
                  {canEdit ? (
                    <div className="flex items-center gap-2">
                      <Link href={`/materials/${material.id}/edit`}>
                        <Button appearance="outline" size="sm">
                          تعديل
                        </Button>
                      </Link>
                      <form action={deleteMaterial}>
                        <input type="hidden" name="id" value={material.id} />
                        <Button type="submit" size="sm" appearance="ghost" variant="danger">
                          حذف
                        </Button>
                      </form>
                    </div>
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
