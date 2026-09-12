import { getProject } from "@/app/actions/masters";
import { listCloseout, lockProject, toggleCloseoutItem } from "@/app/actions/profit";
import { BackToHub } from "@/components/common/back-to-hub";
import { Button } from "@/components/tailgrids/core/button";
import { Card } from "@/components/tailgrids/core/card";
import { canCloseProject, requireProjectAccess, sessionRole } from "@/lib/access";
import { redirect } from "next/navigation";

export default async function CloseoutPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await requireProjectAccess(id);
  const canClose = canCloseProject(sessionRole(session));
  const project = await getProject(id);
  const items = await listCloseout(id);

  async function toggleAction(formData: FormData) {
    "use server";
    formData.set("projectId", id);
    await toggleCloseoutItem(formData);
    redirect(`/projects/${id}/closeout`);
  }

  async function lockAction(formData: FormData) {
    "use server";
    formData.set("projectId", id);
    await lockProject(formData);
    redirect(`/projects/${id}`);
  }

  return (
    <div className="mt-6 space-y-5 px-2 lg:px-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-[28px] font-medium text-text-primary">إغلاق المشروع</h1>
          <p className="text-sm text-text-tertiary">
            {project.name} · الحالة {project.status}
          </p>
        </div>
        <BackToHub projectId={id} />
      </div>

      <Card className="space-y-3 p-4">
        {items.map((item) => (
          <div key={item.id} className="flex items-center justify-between gap-3 border-b border-card-border pb-3">
            <div>
              <p className="font-medium text-text-primary">{item.labelAr}</p>
              {item.doneAt ? (
                <p className="text-xs text-text-tertiary">
                  {item.doneAt.toISOString().slice(0, 10)}
                </p>
              ) : null}
            </div>
            {canClose ? (
              <form action={toggleAction}>
                <input type="hidden" name="id" value={item.id} />
                <Button type="submit" size="sm" appearance={item.done ? "outline" : "fill"}>
                  {item.done ? "تم" : "تأكيد"}
                </Button>
              </form>
            ) : (
              <span className="text-sm">{item.done ? "تم" : "Pending"}</span>
            )}
          </div>
        ))}
      </Card>

      {canClose && project.status !== "CLOSED" ? (
        <form action={lockAction}>
          <Button type="submit" variant="danger">
            قفل المشروع
          </Button>
        </form>
      ) : null}
    </div>
  );
}
