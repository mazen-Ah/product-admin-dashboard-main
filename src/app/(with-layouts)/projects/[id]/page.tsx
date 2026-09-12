import { getProject } from "@/app/actions/masters";
import { MetaTile, PageToolbar } from "@/components/common/page-toolbar";
import { ProjectModuleGrid } from "@/components/common/project-module-grid";
import { Badge } from "@/components/tailgrids/core/badge";
import { Card } from "@/components/tailgrids/core/card";
import { canMutateMasterData, requireSession } from "@/lib/access";

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

export default async function ProjectHubPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await requireSession();
  const canEdit = canMutateMasterData((session.user as { role?: string }).role);
  const project = await getProject(id);

  return (
    <div className="mt-6 space-y-6">
      <PageToolbar
        title={project.name}
        description={project.tradeName ?? "لوحة المشروع"}
        backHref="/"
        actionHref={canEdit ? `/projects/${id}/edit` : undefined}
        actionLabel={canEdit ? "تعديل البيانات" : undefined}
      />

      <div className="space-y-6 px-2 lg:px-5">
        <Card className="p-5">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-base font-semibold text-text-primary">ملخص المشروع</h2>
            <Badge color="primary">{statusLabel[project.status] ?? project.status}</Badge>
          </div>
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
            <MetaTile
              label="قيمة العقد"
              value={`${formatMoney(project.contractValue)} LYD`}
            />
            <MetaTile label="احتجاز %" value={String(project.retentionPercent)} />
            <MetaTile label="العميل" value={project.client?.name ?? "—"} />
            <MetaTile label="الموقع" value={project.location ?? "—"} />
          </div>
        </Card>

        <section className="space-y-3">
          <h2 className="text-base font-semibold text-text-primary">وحدات العمل</h2>
          <ProjectModuleGrid projectId={id} />
        </section>
      </div>
    </div>
  );
}
