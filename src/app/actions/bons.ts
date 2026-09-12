"use server";

import {
  canAmendBon,
  canCreateBon,
  requireProjectAccess,
  requireSession,
  sessionRole,
} from "@/lib/access";
import { writeAudit } from "@/lib/accounting";
import { prisma } from "@/lib/prisma";
import { BonKind, BonStatus, PayableLineType } from "@/generated/prisma/client";
import { mkdir, writeFile } from "fs/promises";
import path from "path";
import { revalidatePath } from "next/cache";

async function nextBonSeq(projectId: string) {
  const last = await prisma.bon.findFirst({
    where: { projectId },
    orderBy: { seq: "desc" },
    select: { seq: true },
  });
  return (last?.seq ?? 0) + 1;
}

async function saveBonPhoto(file: File | null, projectId: string) {
  if (!file || file.size === 0) return null;
  const dir = path.join(process.cwd(), "uploads", "bons", projectId);
  await mkdir(dir, { recursive: true });
  const ext = path.extname(file.name) || ".jpg";
  const name = `${Date.now()}-${Math.random().toString(36).slice(2)}${ext}`;
  const full = path.join(dir, name);
  const buf = Buffer.from(await file.arrayBuffer());
  await writeFile(full, buf);
  return `/api/uploads/bons/${projectId}/${name}`;
}

async function assertTallyGate(input: {
  tallyId: string | null;
  trips: number;
  overTallyReason: string;
  excludeBonId?: string;
}) {
  if (!input.tallyId) return;
  const tally = await prisma.tally.findUniqueOrThrow({ where: { id: input.tallyId } });
  const used = await prisma.bon.aggregate({
    where: {
      tallyId: input.tallyId,
      status: { not: BonStatus.CANCELLED },
      ...(input.excludeBonId ? { id: { not: input.excludeBonId } } : {}),
    },
    _sum: { trips: true },
  });
  const reported = (used._sum.trips ?? 0) + input.trips;
  if (reported > tally.signedTrips && !input.overTallyReason.trim()) {
    throw new Error(
      `تجاوزت الرحلات التوقيع (${reported}/${tally.signedTrips}). أدخل سبب التجاوز.`,
    );
  }
}

export async function listBons(projectId: string) {
  await requireProjectAccess(projectId);
  return prisma.bon.findMany({
    where: { projectId },
    include: {
      payableLines: { include: { supplier: true } },
      issuerSupplier: true,
      tally: true,
    },
    orderBy: { seq: "desc" },
  });
}

export async function getBon(projectId: string, bonId: string) {
  await requireProjectAccess(projectId);
  return prisma.bon.findFirstOrThrow({
    where: { id: bonId, projectId },
    include: {
      payableLines: { include: { supplier: true } },
      issuerSupplier: true,
      tally: true,
    },
  });
}

export async function createBon(formData: FormData) {
  const session = await requireSession();
  const role = sessionRole(session);
  if (!canCreateBon(role)) throw new Error("Forbidden");

  const projectId = String(formData.get("projectId") ?? "");
  await requireProjectAccess(projectId);

  const kind = String(formData.get("kind") ?? "EXTERNAL") as BonKind;
  const paperSerial = String(formData.get("paperSerial") ?? "").trim();
  const date = new Date(String(formData.get("date") ?? ""));
  const materialName = String(formData.get("materialName") ?? "").trim();
  const materialId = String(formData.get("materialId") ?? "") || null;
  const truckId = String(formData.get("truckId") ?? "") || null;
  const truckPlate = String(formData.get("truckPlate") ?? "").trim();
  const trips = Number(formData.get("trips") ?? 1);
  const qtyM3 = Number(formData.get("qtyM3") ?? 0);
  const deductionM3 = Number(formData.get("deductionM3") ?? 0);
  const netM3 = qtyM3 - deductionM3;
  const materialPrice = Number(formData.get("materialPrice") ?? 0);
  const haulagePrice = Number(formData.get("haulagePrice") ?? 0);
  const quarrySupplierId = String(formData.get("quarrySupplierId") ?? "") || null;
  const carrierSupplierId = String(formData.get("carrierSupplierId") ?? "") || null;
  const issuerSupplierId =
    String(formData.get("issuerSupplierId") ?? "") || quarrySupplierId || null;
  const tallyId = String(formData.get("tallyId") ?? "") || null;
  const overTallyReason = String(formData.get("overTallyReason") ?? "").trim();
  const photo = formData.get("photo");
  const photoFile = photo instanceof File ? photo : null;

  if (!paperSerial || !materialName || !truckPlate || Number.isNaN(netM3) || netM3 < 0) {
    throw new Error("Invalid input");
  }
  if (kind === "EXTERNAL" && (!photoFile || photoFile.size === 0)) {
    throw new Error("الصورة إلزامية للبون الخارجي");
  }
  if (kind === "EXTERNAL" && (!quarrySupplierId || !carrierSupplierId)) {
    throw new Error("المورد الناقل والمحجر مطلوبان للبون الخارجي");
  }

  await assertTallyGate({ tallyId, trips, overTallyReason });

  const photoPath = await saveBonPhoto(photoFile, projectId);
  const seq = await nextBonSeq(projectId);
  const fxRate = 1;

  const bon = await prisma.bon.create({
    data: {
      projectId,
      kind,
      status: BonStatus.PENDING,
      seq,
      paperSerial,
      issuerSupplierId,
      date,
      materialId,
      materialName,
      truckId,
      truckPlate,
      trips,
      qtyM3,
      deductionM3,
      netM3,
      materialPrice,
      haulagePrice,
      currencyCode: "LYD",
      fxRate,
      photoPath,
      tallyId,
      overTallyReason: overTallyReason || null,
      payableLines:
        kind === "EXTERNAL"
          ? {
              create: [
                {
                  type: PayableLineType.MATERIAL,
                  supplierId: quarrySupplierId!,
                  unitPrice: materialPrice,
                  amountNative: netM3 * materialPrice,
                  fxRate,
                  amountLyd: netM3 * materialPrice * fxRate,
                },
                {
                  type: PayableLineType.HAULAGE,
                  supplierId: carrierSupplierId!,
                  unitPrice: haulagePrice,
                  amountNative: netM3 * haulagePrice,
                  fxRate,
                  amountLyd: netM3 * haulagePrice * fxRate,
                },
              ],
            }
          : undefined,
    },
  });

  await writeAudit({
    userId: session.user.id,
    action: "CREATE",
    entity: "Bon",
    entityId: bon.id,
    detail: `seq=${seq}`,
  });

  revalidatePath(`/projects/${projectId}/bons`);
  revalidatePath(`/projects/${projectId}/tallies`);
  return bon.id;
}

export async function updateBon(formData: FormData) {
  const session = await requireSession();
  const role = sessionRole(session);
  if (!canCreateBon(role)) throw new Error("Forbidden");

  const projectId = String(formData.get("projectId") ?? "");
  const bonId = String(formData.get("id") ?? "");
  await requireProjectAccess(projectId);

  const existing = await prisma.bon.findFirstOrThrow({ where: { id: bonId, projectId } });
  if (existing.status !== BonStatus.PENDING) {
    throw new Error("يمكن التعديل فقط وهو قيد الانتظار");
  }

  const trips = Number(formData.get("trips") ?? 1);
  const qtyM3 = Number(formData.get("qtyM3") ?? 0);
  const deductionM3 = Number(formData.get("deductionM3") ?? 0);
  const netM3 = qtyM3 - deductionM3;
  const materialPrice = Number(formData.get("materialPrice") ?? 0);
  const haulagePrice = Number(formData.get("haulagePrice") ?? 0);
  const tallyId = String(formData.get("tallyId") ?? "") || null;
  const overTallyReason = String(formData.get("overTallyReason") ?? "").trim();
  const quarrySupplierId = String(formData.get("quarrySupplierId") ?? "") || null;
  const carrierSupplierId = String(formData.get("carrierSupplierId") ?? "") || null;

  await assertTallyGate({ tallyId, trips, overTallyReason, excludeBonId: bonId });

  const photo = formData.get("photo");
  const photoFile = photo instanceof File ? photo : null;
  let photoPath = existing.photoPath;
  if (photoFile && photoFile.size > 0) {
    photoPath = await saveBonPhoto(photoFile, projectId);
  }
  if (existing.kind === "EXTERNAL" && !photoPath) {
    throw new Error("الصورة إلزامية للبون الخارجي");
  }

  await prisma.$transaction(async (tx) => {
    await tx.bonPayableLine.deleteMany({ where: { bonId } });
    await tx.bon.update({
      where: { id: bonId },
      data: {
        paperSerial: String(formData.get("paperSerial") ?? "").trim(),
        date: new Date(String(formData.get("date") ?? "")),
        materialName: String(formData.get("materialName") ?? "").trim(),
        materialId: String(formData.get("materialId") ?? "") || null,
        truckId: String(formData.get("truckId") ?? "") || null,
        truckPlate: String(formData.get("truckPlate") ?? "").trim(),
        trips,
        qtyM3,
        deductionM3,
        netM3,
        materialPrice,
        haulagePrice,
        tallyId,
        overTallyReason: overTallyReason || null,
        photoPath,
        issuerSupplierId:
          String(formData.get("issuerSupplierId") ?? "") || quarrySupplierId || null,
      },
    });
    if (existing.kind === "EXTERNAL" && quarrySupplierId && carrierSupplierId) {
      await tx.bonPayableLine.createMany({
        data: [
          {
            bonId,
            type: PayableLineType.MATERIAL,
            supplierId: quarrySupplierId,
            unitPrice: materialPrice,
            amountNative: netM3 * materialPrice,
            fxRate: 1,
            amountLyd: netM3 * materialPrice,
          },
          {
            bonId,
            type: PayableLineType.HAULAGE,
            supplierId: carrierSupplierId,
            unitPrice: haulagePrice,
            amountNative: netM3 * haulagePrice,
            fxRate: 1,
            amountLyd: netM3 * haulagePrice,
          },
        ],
      });
    }
  });

  await writeAudit({
    userId: session.user.id,
    action: "UPDATE",
    entity: "Bon",
    entityId: bonId,
  });

  revalidatePath(`/projects/${projectId}/bons`);
  revalidatePath(`/projects/${projectId}/tallies`);
}

export async function cancelBon(formData: FormData) {
  const session = await requireSession();
  if (!canAmendBon(sessionRole(session))) throw new Error("Forbidden");

  const projectId = String(formData.get("projectId") ?? "");
  const bonId = String(formData.get("id") ?? "");
  const reason = String(formData.get("cancelReason") ?? "").trim();
  await requireProjectAccess(projectId);
  if (!reason) throw new Error("سبب الإلغاء مطلوب");

  const bon = await prisma.bon.findFirstOrThrow({ where: { id: bonId, projectId } });
  if (bon.status === BonStatus.PAID) {
    throw new Error("لا يمكن إلغاء بون مدفوع — اعكس المستخلص أولاً");
  }
  if (bon.status === BonStatus.IN_SETTLEMENT) {
    throw new Error("البون ضمن مستخلص — استخدم مستند عكسي");
  }

  await prisma.bon.update({
    where: { id: bonId },
    data: { status: BonStatus.CANCELLED, cancelReason: reason },
  });

  await writeAudit({
    userId: session.user.id,
    action: "CANCEL",
    entity: "Bon",
    entityId: bonId,
    detail: reason,
  });

  revalidatePath(`/projects/${projectId}/bons`);
}
