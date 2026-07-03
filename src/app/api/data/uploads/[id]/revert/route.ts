import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

interface BackupRow {
  no: number;
  year: number;
  month: number;
  day: number;
  equipment: string;
  subEquipment: string | null;
  repairItem: string | null;
  incidentType: string | null;
  description: string | null;
  cause: string | null;
  technician: string | null;
  technicianCount: number | null;
  repairTime: number | null;
  repairType: string | null;
  count: number | null;
  durationMin: number | null;
  managementType: string | null;
  quarter: string | null;
  uploadBatchId: number | null;
}

export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const batchId = Number(id);
  if (!batchId) {
    return NextResponse.json({ error: "잘못된 배치 ID입니다" }, { status: 400 });
  }

  try {
    const batch = await prisma.uploadBatch.findUnique({ where: { id: batchId } });
    if (!batch) {
      return NextResponse.json({ error: "배치를 찾을 수 없습니다" }, { status: 404 });
    }
    if (batch.status !== "APPLIED") {
      return NextResponse.json(
        { error: `되돌릴 수 없는 상태입니다 (status=${batch.status})` },
        { status: 400 }
      );
    }

    await prisma.$transaction(async (tx) => {
      await tx.repairTypeRecord.deleteMany({ where: { uploadBatchId: batch.id } });

      const backup = ((batch.backupData as unknown) as BackupRow[]) ?? [];
      if (backup.length > 0) {
        await tx.repairTypeRecord.createMany({
          data: backup.map((r) => ({
            no: r.no,
            year: r.year,
            month: r.month,
            day: r.day,
            equipment: r.equipment,
            subEquipment: r.subEquipment,
            repairItem: r.repairItem,
            incidentType: r.incidentType,
            description: r.description,
            cause: r.cause,
            technician: r.technician,
            technicianCount: r.technicianCount,
            repairTime: r.repairTime,
            repairType: r.repairType,
            count: r.count,
            durationMin: r.durationMin,
            managementType: r.managementType,
            quarter: r.quarter,
            uploadBatchId: r.uploadBatchId ?? null,
          })),
        });
      }

      await tx.uploadBatch.update({
        where: { id: batch.id },
        data: { status: "REVERTED", revertedAt: new Date() },
      });
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json({ error: "되돌리기 실패", detail: String(err) }, { status: 500 });
  }
}
