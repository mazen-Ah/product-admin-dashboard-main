"use server";

import {
  canMutateMasterData,
  getAccessibleProjectIds,
  requireSession,
} from "@/lib/access";
import { prisma } from "@/lib/prisma";
import {
  ChargingMethod,
  EquipmentOwnership,
  ProjectStatus,
} from "@/generated/prisma/client";
import { revalidatePath } from "next/cache";

function userRole(session: Awaited<ReturnType<typeof requireSession>>) {
  return (session.user as { role?: string }).role ?? "";
}

export async function listProjects() {
  const session = await requireSession();
  const role = userRole(session);
  const ids = await getAccessibleProjectIds(session.user.id, role);
  return prisma.project.findMany({
    where: { id: { in: ids } },
    include: { client: true },
    orderBy: { createdAt: "desc" },
  });
}

export async function createProject(formData: FormData) {
  const session = await requireSession();
  if (!canMutateMasterData(userRole(session))) {
    throw new Error("Forbidden");
  }

  const name = String(formData.get("name") ?? "").trim();
  const tradeName = String(formData.get("tradeName") ?? "").trim() || null;
  const location = String(formData.get("location") ?? "").trim() || null;
  const contractValue = Number(formData.get("contractValue") ?? 0);
  const clientName = String(formData.get("clientName") ?? "").trim();
  const taxable = formData.get("taxable") === "on";

  if (!name || !clientName || Number.isNaN(contractValue)) {
    throw new Error("Invalid input");
  }

  const lyd = await prisma.currency.findUnique({ where: { code: "LYD" } });
  if (!lyd) throw new Error("LYD currency missing");

  const project = await prisma.project.create({
    data: {
      name,
      tradeName,
      location,
      contractValue,
      taxable,
      status: ProjectStatus.ACTIVE,
      client: { create: { name: clientName } },
      wallets: {
        create: [
          { method: "CASH", currencyId: lyd.id, label: "صندوق نقدي" },
          { method: "BANK", currencyId: lyd.id, label: "حساب مصرفي" },
        ],
      },
      memberships: {
        create: {
          userId: session.user.id,
          role: "MANAGING_PARTNER",
        },
      },
    },
  });

  revalidatePath("/");
  revalidatePath("/projects");
  return project.id;
}

export async function updateProject(formData: FormData) {
  const session = await requireSession();
  if (!canMutateMasterData(userRole(session))) {
    throw new Error("Forbidden");
  }

  const id = String(formData.get("id") ?? "");
  const name = String(formData.get("name") ?? "").trim();
  const tradeName = String(formData.get("tradeName") ?? "").trim() || null;
  const location = String(formData.get("location") ?? "").trim() || null;
  const contractValue = Number(formData.get("contractValue") ?? 0);
  const retentionPercent = Number(formData.get("retentionPercent") ?? 10);
  const clientName = String(formData.get("clientName") ?? "").trim();
  const taxable = formData.get("taxable") === "on";
  const status = String(formData.get("status") ?? "ACTIVE") as ProjectStatus;

  await prisma.project.update({
    where: { id },
    data: {
      name,
      tradeName,
      location,
      contractValue,
      retentionPercent,
      taxable,
      status,
      client: {
        update: { name: clientName },
      },
    },
  });

  revalidatePath("/");
  revalidatePath(`/projects/${id}`);
}

export async function listSuppliers() {
  await requireSession();
  return prisma.supplier.findMany({ orderBy: { name: "asc" } });
}

export async function getSupplier(id: string) {
  await requireSession();
  return prisma.supplier.findUniqueOrThrow({ where: { id } });
}

export async function createSupplier(formData: FormData) {
  const session = await requireSession();
  if (!canMutateMasterData(userRole(session))) throw new Error("Forbidden");

  await prisma.supplier.create({
    data: {
      name: String(formData.get("name") ?? "").trim(),
      contact: String(formData.get("contact") ?? "").trim() || null,
      type: String(formData.get("type") ?? "").trim() || null,
    },
  });
  revalidatePath("/suppliers");
}

export async function updateSupplier(formData: FormData) {
  const session = await requireSession();
  if (!canMutateMasterData(userRole(session))) throw new Error("Forbidden");

  await prisma.supplier.update({
    where: { id: String(formData.get("id") ?? "") },
    data: {
      name: String(formData.get("name") ?? "").trim(),
      contact: String(formData.get("contact") ?? "").trim() || null,
      type: String(formData.get("type") ?? "").trim() || null,
    },
  });
  revalidatePath("/suppliers");
}

export async function deleteSupplier(formData: FormData) {
  const session = await requireSession();
  if (!canMutateMasterData(userRole(session))) throw new Error("Forbidden");
  await prisma.supplier.delete({ where: { id: String(formData.get("id") ?? "") } });
  revalidatePath("/suppliers");
}

export async function listMaterials() {
  await requireSession();
  return prisma.material.findMany({ orderBy: { name: "asc" } });
}

export async function getMaterial(id: string) {
  await requireSession();
  return prisma.material.findUniqueOrThrow({ where: { id } });
}

export async function createMaterial(formData: FormData) {
  const session = await requireSession();
  if (!canMutateMasterData(userRole(session))) throw new Error("Forbidden");
  await prisma.material.create({
    data: {
      name: String(formData.get("name") ?? "").trim(),
      unit: String(formData.get("unit") ?? "m3").trim() || "m3",
      code: String(formData.get("code") ?? "").trim() || null,
    },
  });
  revalidatePath("/materials");
}

export async function updateMaterial(formData: FormData) {
  const session = await requireSession();
  if (!canMutateMasterData(userRole(session))) throw new Error("Forbidden");
  await prisma.material.update({
    where: { id: String(formData.get("id") ?? "") },
    data: {
      name: String(formData.get("name") ?? "").trim(),
      unit: String(formData.get("unit") ?? "m3").trim() || "m3",
      code: String(formData.get("code") ?? "").trim() || null,
    },
  });
  revalidatePath("/materials");
}

export async function deleteMaterial(formData: FormData) {
  const session = await requireSession();
  if (!canMutateMasterData(userRole(session))) throw new Error("Forbidden");
  await prisma.material.delete({ where: { id: String(formData.get("id") ?? "") } });
  revalidatePath("/materials");
}

export async function listTrucks() {
  await requireSession();
  return prisma.truck.findMany({ orderBy: { plate: "asc" } });
}

export async function getTruck(id: string) {
  await requireSession();
  return prisma.truck.findUniqueOrThrow({ where: { id } });
}

export async function createTruck(formData: FormData) {
  const session = await requireSession();
  if (!canMutateMasterData(userRole(session))) throw new Error("Forbidden");
  const payload = formData.get("payloadM3");
  await prisma.truck.create({
    data: {
      plate: String(formData.get("plate") ?? "").trim(),
      driver: String(formData.get("driver") ?? "").trim() || null,
      payloadM3: payload ? Number(payload) : null,
    },
  });
  revalidatePath("/trucks");
}

export async function updateTruck(formData: FormData) {
  const session = await requireSession();
  if (!canMutateMasterData(userRole(session))) throw new Error("Forbidden");
  const payload = formData.get("payloadM3");
  await prisma.truck.update({
    where: { id: String(formData.get("id") ?? "") },
    data: {
      plate: String(formData.get("plate") ?? "").trim(),
      driver: String(formData.get("driver") ?? "").trim() || null,
      payloadM3: payload ? Number(payload) : null,
    },
  });
  revalidatePath("/trucks");
}

export async function deleteTruck(formData: FormData) {
  const session = await requireSession();
  if (!canMutateMasterData(userRole(session))) throw new Error("Forbidden");
  await prisma.truck.delete({ where: { id: String(formData.get("id") ?? "") } });
  revalidatePath("/trucks");
}

export async function listRateCards(projectId: string) {
  const { requireProjectAccess } = await import("@/lib/access");
  await requireProjectAccess(projectId);
  return prisma.rateCard.findMany({
    where: { projectId },
    orderBy: { effectiveFrom: "desc" },
  });
}

export async function createRateCard(formData: FormData) {
  const session = await requireSession();
  if (!canMutateMasterData(userRole(session))) throw new Error("Forbidden");
  const projectId = String(formData.get("projectId") ?? "");
  const { requireProjectAccess } = await import("@/lib/access");
  await requireProjectAccess(projectId);

  await prisma.rateCard.create({
    data: {
      projectId,
      materialName: String(formData.get("materialName") ?? "").trim(),
      materialPrice: Number(formData.get("materialPrice") ?? 0),
      haulagePrice: Number(formData.get("haulagePrice") ?? 0),
      quarrySupplierId: String(formData.get("quarrySupplierId") ?? "") || null,
      carrierSupplierId: String(formData.get("carrierSupplierId") ?? "") || null,
      effectiveFrom: new Date(String(formData.get("effectiveFrom") ?? "")),
    },
  });
  revalidatePath(`/projects/${projectId}/rates`);
}

export async function deleteRateCard(formData: FormData) {
  const session = await requireSession();
  if (!canMutateMasterData(userRole(session))) throw new Error("Forbidden");
  const id = String(formData.get("id") ?? "");
  const projectId = String(formData.get("projectId") ?? "");
  await prisma.rateCard.delete({ where: { id } });
  revalidatePath(`/projects/${projectId}/rates`);
}

export async function listEquipment(projectId: string) {
  const { requireProjectAccess } = await import("@/lib/access");
  await requireProjectAccess(projectId);
  return prisma.equipment.findMany({
    where: { projectId },
    orderBy: { name: "asc" },
  });
}

export async function createEquipment(formData: FormData) {
  const session = await requireSession();
  if (!canMutateMasterData(userRole(session))) throw new Error("Forbidden");
  const projectId = String(formData.get("projectId") ?? "");
  const { requireProjectAccess } = await import("@/lib/access");
  await requireProjectAccess(projectId);

  const hours = formData.get("hoursPerDay");
  const monthly = formData.get("monthlyRate");

  await prisma.equipment.create({
    data: {
      projectId,
      name: String(formData.get("name") ?? "").trim(),
      ownership: String(formData.get("ownership") ?? "OWNED") as EquipmentOwnership,
      chargingMethod: String(
        formData.get("chargingMethod") ?? "BY_HOUR",
      ) as ChargingMethod,
      hoursPerDay: hours ? Number(hours) : null,
      monthlyRate: monthly ? Number(monthly) : null,
    },
  });
  revalidatePath(`/projects/${projectId}/equipment`);
}

export async function deleteEquipment(formData: FormData) {
  const session = await requireSession();
  if (!canMutateMasterData(userRole(session))) throw new Error("Forbidden");
  const id = String(formData.get("id") ?? "");
  const projectId = String(formData.get("projectId") ?? "");
  await prisma.equipment.delete({ where: { id } });
  revalidatePath(`/projects/${projectId}/equipment`);
}

export async function getProject(projectId: string) {
  const { requireProjectAccess } = await import("@/lib/access");
  await requireProjectAccess(projectId);
  return prisma.project.findUniqueOrThrow({
    where: { id: projectId },
    include: { client: true },
  });
}
