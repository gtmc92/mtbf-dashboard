import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import type { Prisma } from "@prisma/client";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type ApplyMode = "REPLACE_PERIOD" | "REPLACE_ALL" | "APPEND";

interface StagedData {
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
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const batchId = Number(body.batchId);
    const applyMode: ApplyMode = body.applyMode ?? "REPLACE_PERIOD";
    if (!batchId) {
      return NextResponse.json({ error: "batchId가 필요합니다" }, { status: 400 });
    }

    const batch = await prisma.uploadBatch.findUnique({
      where: { id: batchId },
      include: { stagingRows: true },
    });
    if (!batch) {
      return NextResponse.json({ error: "배치를 찾을 수 없습니다" }, { status: 404 });
    }
    if (batch.status !== "PREVIEWED") {
      return NextResponse.json(
        { error: `이미 처리된 배치입니다 (status=${batch.status})` },
        { status: 400 }
      );
    }
    if (batch.errorCount > 0) {
      return NextResponse.json(
        { error: "검증 오류가 있는 배치는 적용할 수 없습니다" },
        { status: 400 }
      );
    }

    const validStaging = batch.stagingRows.filter((r) => {
      const errs = r.errors as unknown as string[];
      return !errs || errs.length === 0;
    });
    if (validStaging.length === 0) {
      return NextResponse.json({ error: "적용할 유효한 데이터가 없습니다" }, { status: 400 });
    }

    const result = await prisma.$transaction(async (tx) => {
      let deletedRows: Prisma.RepairTypeRecordGetPayload<Record<string, never>>[] = [];
      let where: Prisma.RepairTypeRecordWhereInput | null = null;

      if (applyMode === "REPLACE_ALL") {
        where = {};
      } else if (applyMode === "REPLACE_PERIOD") {
        const { periodStartYear, periodStartMonth, periodEndYear, periodEndMonth } = batch;
        if (periodStartYear == null || periodEndYear == null) {
          throw new Error("적용 기간을 감지할 수 없습니다");
        }
        const pairs: { year: number; month: number }[] = [];
        for (let y = periodStartYear; y <= periodEndYear; y++) {
          const mStart = y === periodStartYear ? periodStartMonth ?? 1 : 1;
          const mEnd = y === periodEndYear ? periodEndMonth ?? 12 : 12;
          for (let m = mStart; m <= mEnd; m++) pairs.push({ year: y, month: m });
        }
        where = { OR: pairs.map((p) => ({ year: p.year, month: p.month })) };
      }
      // APPEND: where === null → 삭제 없음

      if (where !== null) {
        deletedRows = await tx.repairTypeRecord.findMany({ where });
        if (deletedRows.length > 0) {
          await tx.repairTypeRecord.deleteMany({ where });
        }
      }

      const maxNoRow = await tx.repairTypeRecord.aggregate({ _max: { no: true } });
      let nextNo = (maxNoRow._max.no ?? 0) + 1;

      const createData = validStaging.map((r) => {
        const d = r.data as unknown as StagedData;
        return {
          no: nextNo++,
          year: d.year,
          month: d.month,
          day: d.day,
          equipment: d.equipment,
          subEquipment: d.subEquipment,
          repairItem: d.repairItem,
          incidentType: d.incidentType,
          description: d.description,
          cause: d.cause,
          technician: d.technician,
          technicianCount: d.technicianCount,
          repairTime: d.repairTime,
          repairType: d.repairType,
          count: d.count,
          durationMin: d.durationMin,
          managementType: d.managementType,
          quarter: d.quarter,
          uploadBatchId: batch.id,
        };
      });

      await tx.repairTypeRecord.createMany({ data: createData });

      const updatedBatch = await tx.uploadBatch.update({
        where: { id: batch.id },
        data: {
          status: "APPLIED",
          applyMode,
          appliedAt: new Date(),
          backupData: JSON.parse(JSON.stringify(deletedRows)),
          rowCount: createData.length,
        },
      });

      await tx.uploadStagingRow.deleteMany({ where: { batchId: batch.id } });

      return {
        appliedCount: createData.length,
        deletedCount: deletedRows.length,
        batch: updatedBatch,
      };
    });

    return NextResponse.json({
      appliedCount: result.appliedCount,
      deletedCount: result.deletedCount,
      period: {
        periodStartYear: result.batch.periodStartYear,
        periodStartMonth: result.batch.periodStartMonth,
        periodEndYear: result.batch.periodEndYear,
        periodEndMonth: result.batch.periodEndMonth,
      },
      applyMode,
    });
  } catch (err) {
    return NextResponse.json({ error: "적용 실패", detail: String(err) }, { status: 500 });
  }
}
