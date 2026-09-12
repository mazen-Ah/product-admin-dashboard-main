import { deleteTruck, listTrucks } from "@/app/actions/masters";
import { EmptyState, PageToolbar } from "@/components/common/page-toolbar";
import { Button } from "@/components/tailgrids/core/button";
import { Card } from "@/components/tailgrids/core/card";
import { canMutateMasterData, requireSession } from "@/lib/access";
import Link from "next/link";

export default async function TrucksPage() {
  const session = await requireSession();
  const canEdit = canMutateMasterData((session.user as { role?: string }).role);
  const trucks = await listTrucks();

  return (
    <div className="mt-6 space-y-6">
      <PageToolbar
        title="الشاحنات"
        description={`${trucks.length} شاحنة`}
        actionHref={canEdit ? "/trucks/new" : undefined}
        actionLabel={canEdit ? "إضافة شاحنة" : undefined}
      />

      <div className="space-y-3 px-2 lg:px-5">
        {trucks.length === 0 ? (
          <EmptyState
            message="لا توجد شاحنات"
            actionHref={canEdit ? "/trucks/new" : undefined}
            actionLabel={canEdit ? "إضافة شاحنة" : undefined}
          />
        ) : (
          <ul className="space-y-3">
            {trucks.map((truck) => (
              <li key={truck.id}>
                <Card className="flex flex-wrap items-center justify-between gap-4 p-4">
                  <div className="min-w-0">
                    <p className="font-semibold text-text-primary">{truck.plate}</p>
                    <p className="mt-1 text-sm text-text-tertiary">
                      {truck.payloadM3 != null ? `${String(truck.payloadM3)} م³` : "—"}
                      {truck.driver ? ` · ${truck.driver}` : ""}
                    </p>
                  </div>
                  {canEdit ? (
                    <div className="flex items-center gap-2">
                      <Link href={`/trucks/${truck.id}/edit`}>
                        <Button appearance="outline" size="sm">
                          تعديل
                        </Button>
                      </Link>
                      <form action={deleteTruck}>
                        <input type="hidden" name="id" value={truck.id} />
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
