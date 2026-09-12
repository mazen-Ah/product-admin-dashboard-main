import { listProjects } from "@/app/actions/masters";
import { EmptyState, MetaTile, PageToolbar } from "@/components/common/page-toolbar";
import { Badge } from "@/components/tailgrids/core/badge";
import { Button } from "@/components/tailgrids/core/button";
import { Card } from "@/components/tailgrids/core/card";
import { canMutateMasterData, requireSession } from "@/lib/access";
import Link from "next/link";

function formatMoney(value: unknown) {
  const n = Number(value);
  if (Number.isNaN(n)) return String(value);
  return new Intl.NumberFormat("en-LY", { maximumFractionDigits: 0 }).format(n);
}

const statusLabel: Record<string, string> = {
  ACTIVE: "نشط",
  SUSPENDED: "موقوف",
  COMPLETED: "مكتمل",
  CLOSED: "مغلق",
  PARTIALLY_CANCELLED: "ملغى جزئياً",
};

export default async function HomePage() {
  const session = await requireSession();
  const role = (session.user as { role?: string }).role ?? "";
  const canEdit = canMutateMasterData(role);
  const projects = await listProjects();

  const activeCount = projects.filter((p) => p.status === "ACTIVE").length;
  const totalContract = projects.reduce((sum, p) => sum + Number(p.contractValue), 0);

  return (
    <div className="mt-6 space-y-6">
      <PageToolbar
        title="لوحة المشاريع"
        description={`مرحباً ${session.user.name}`}
        actionHref={canEdit ? "/projects/new" : undefined}
        actionLabel={canEdit ? "إنشاء مشروع" : undefined}
      />

      <div className="space-y-6 px-2 lg:px-5">
        <div className="grid gap-3 sm:grid-cols-3">
          <Card className="p-4">
            <p className="text-xs text-text-tertiary">إجمالي المشاريع</p>
            <p className="mt-1 text-2xl font-semibold text-text-primary">{projects.length}</p>
          </Card>
          <Card className="p-4">
            <p className="text-xs text-text-tertiary">نشطة</p>
            <p className="mt-1 text-2xl font-semibold text-text-primary">{activeCount}</p>
          </Card>
          <Card className="p-4">
            <p className="text-xs text-text-tertiary">إجمالي قيم العقود</p>
            <p className="mt-1 text-2xl font-semibold text-text-primary">
              {formatMoney(totalContract)}
              <span className="ms-1 text-sm font-normal text-text-tertiary">LYD</span>
            </p>
          </Card>
        </div>

        <section className="space-y-3">
          <h2 className="text-base font-semibold text-text-primary">مشاريعي</h2>

          {projects.length === 0 ? (
            <EmptyState
              message="لا توجد مشاريع بعد"
              actionHref={canEdit ? "/projects/new" : undefined}
              actionLabel={canEdit ? "إنشاء أول مشروع" : undefined}
            />
          ) : (
            <ul className="grid gap-4 lg:grid-cols-2">
              {projects.map((project) => (
                <li key={project.id}>
                  <Card className="flex h-full flex-col gap-4 p-5">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 space-y-1">
                        <h3 className="truncate text-lg font-semibold text-text-primary">
                          {project.name}
                        </h3>
                        {project.tradeName ? (
                          <p className="truncate text-sm text-text-tertiary">
                            {project.tradeName}
                          </p>
                        ) : null}
                      </div>
                      <Badge color="primary" className="shrink-0">
                        {statusLabel[project.status] ?? project.status}
                      </Badge>
                    </div>

                    <div className="grid gap-2 sm:grid-cols-2">
                      <MetaTile
                        label="قيمة العقد"
                        value={`${formatMoney(project.contractValue)} LYD`}
                      />
                      <MetaTile label="العميل" value={project.client?.name ?? "—"} />
                      {project.location ? (
                        <div className="sm:col-span-2">
                          <MetaTile label="الموقع" value={project.location} />
                        </div>
                      ) : null}
                    </div>

                    <div className="mt-auto">
                      <Link href={`/projects/${project.id}`}>
                        <Button appearance="outline" size="sm">
                          فتح المشروع
                        </Button>
                      </Link>
                    </div>
                  </Card>
                </li>
              ))}
            </ul>
          )}
        </section>

        {canEdit ? (
          <section className="space-y-3">
            <h2 className="text-base font-semibold text-text-primary">اختصارات</h2>
            <div className="flex flex-wrap gap-2">
              <Link href="/suppliers">
                <Button appearance="outline" size="sm">
                  الموردون
                </Button>
              </Link>
              <Link href="/materials">
                <Button appearance="outline" size="sm">
                  المواد
                </Button>
              </Link>
              <Link href="/trucks">
                <Button appearance="outline" size="sm">
                  الشاحنات
                </Button>
              </Link>
            </div>
          </section>
        ) : null}
      </div>
    </div>
  );
}
