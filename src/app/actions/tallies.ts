"use server";

import {
  canCreateBon,
  requireProjectAccess,
  requireSession,
  sessionRole,
} from "@/lib/access";
import { writeAudit } from "@/lib/accounting";
import { prisma } from "@/lib/prisma";
import { BonStatus } from "@/generated/prisma/client";
import { revalidatePath } from "next/cache";

export async function listTallies(projectId: string) {
  await requireProjectAccess(projectId);
  const tallies = await prisma.tally.findMany({
    where: { projectId },
    orderBy: { date: "desc" },
    include: {
      bons: {
        where: { status: { not: BonStatus.CANCELLED } },
        select: { trips: true },
      },
    },
  });

  return tallies.map((t) => {
    const reportedTrips = t.bons.reduce((s, b) => s + b.trips, 0);
    return {
      id: t.id,
      date: t.date,
      signedTrips: t.signedTrips,
      notes: t.notes,
      reportedTrips,
      underTally: reportedTrips < t.signedTrips,
      overTally: reportedTrips > t.signedTrips,
    };
  });
}

export async function createTally(formData: FormData) {
  const session = await requireSession();
  if (!canCreateBon(sessionRole(session))) throw new Error("Forbidden");

  const projectId = String(formData.get("projectId") ?? "");
  await requireProjectAccess(projectId);

  const signedTrips = Number(formData.get("signedTrips") ?? 0);
  if (!signedTrips || signedTrips < 0) throw new Error("Invalid trips");

  const tally = await prisma.tally.create({
    data: {
      projectId,
      date: new Date(String(formData.get("date") ?? "")),
      signedTrips,
      notes: String(formData.get("notes") ?? "").trim() || null,
    },
  });

  await writeAudit({
    userId: session.user.id,
    action: "CREATE",
    entity: "Tally",
    entityId: tally.id,
  });

  revalidatePath(`/projects/${projectId}/tallies`);
  return tally.id;
}

export async function updateTally(formData: FormData) {
  const session = await requireSession();
  if (!canCreateBon(sessionRole(session))) throw new Error("Forbidden");

  const projectId = String(formData.get("projectId") ?? "");
  const id = String(formData.get("id") ?? "");
  await requireProjectAccess(projectId);

  await prisma.tally.update({
    where: { id },
    data: {
      date: new Date(String(formData.get("date") ?? "")),
      signedTrips: Number(formData.get("signedTrips") ?? 0),
      notes: String(formData.get("notes") ?? "").trim() || null,
    },
  });

  revalidatePath(`/projects/${projectId}/tallies`);
}

export async function deleteTally(formData: FormData) {
  const session = await requireSession();
  if (!canCreateBon(sessionRole(session))) throw new Error("Forbidden");

  const projectId = String(formData.get("projectId") ?? "");
  const id = String(formData.get("id") ?? "");
  await requireProjectAccess(projectId);

  const linked = await prisma.bon.count({ where: { tallyId: id } });
  if (linked > 0) throw new Error("لا يمكن حذف كشف مرتبط ببونات");

  await prisma.tally.delete({ where: { id } });
  revalidatePath(`/projects/${projectId}/tallies`);
}
