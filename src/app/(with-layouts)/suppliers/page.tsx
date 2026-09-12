import { deleteSupplier, listSuppliers } from "@/app/actions/masters";
import { EmptyState, PageToolbar } from "@/components/common/page-toolbar";
import { Button } from "@/components/tailgrids/core/button";
import { Card } from "@/components/tailgrids/core/card";
import { canMutateMasterData, requireSession } from "@/lib/access";
import Link from "next/link";

export default async function SuppliersPage() {
  const session = await requireSession();
  const canEdit = canMutateMasterData((session.user as { role?: string }).role);
  const suppliers = await listSuppliers();

  return (
    <div className="mt-6 space-y-6">
      <PageToolbar
        title="الموردون"
        description={`${suppliers.length} مورد`}
        actionHref={canEdit ? "/suppliers/new" : undefined}
        actionLabel={canEdit ? "إضافة مورد" : undefined}
      />

      <div className="space-y-3 px-2 lg:px-5">
        {suppliers.length === 0 ? (
          <EmptyState
            message="لا يوجد موردون"
            actionHref={canEdit ? "/suppliers/new" : undefined}
            actionLabel={canEdit ? "إضافة مورد" : undefined}
          />
        ) : (
          <ul className="space-y-3">
            {suppliers.map((supplier) => (
              <li key={supplier.id}>
                <Card className="flex flex-wrap items-center justify-between gap-4 p-4">
                  <div className="min-w-0">
                    <p className="font-semibold text-text-primary">{supplier.name}</p>
                    <p className="mt-1 text-sm text-text-tertiary">
                      {[supplier.type, supplier.contact].filter(Boolean).join(" · ") || "—"}
                    </p>
                  </div>
                  {canEdit ? (
                    <div className="flex items-center gap-2">
                      <Link href={`/suppliers/${supplier.id}/edit`}>
                        <Button appearance="outline" size="sm">
                          تعديل
                        </Button>
                      </Link>
                      <form action={deleteSupplier}>
                        <input type="hidden" name="id" value={supplier.id} />
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
