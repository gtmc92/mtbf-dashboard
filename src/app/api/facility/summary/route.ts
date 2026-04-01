import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const yearParam = searchParams.get("year");
  const where = yearParam ? { year: Number(yearParam) } : {};

  const [
    totalAgg,
    repairTypeGroups,
    managementTypeGroups,
    equipmentGroups,
    yearRows,
  ] = await Promise.all([
    // 전체 집계 (IncidentRecord 기준)
    prisma.incidentRecord.aggregate({
      where,
      _count: { id: true },
      _sum: { durationMin: true },
    }),

    // 수리유형별 집계 (RepairTypeRecord)
    prisma.repairTypeRecord.groupBy({
      by: ["repairType"],
      where,
      _sum: { count: true, durationMin: true },
      orderBy: { _sum: { count: "desc" } },
    }),

    // 관리구분별 집계 (Preventive / Reactive)
    prisma.repairTypeRecord.groupBy({
      by: ["managementType"],
      where,
      _sum: { count: true, durationMin: true },
    }),

    // 설비별 상위 10개 (IncidentRecord)
    prisma.incidentRecord.groupBy({
      by: ["equipment"],
      where,
      _count: { id: true },
      _sum: { durationMin: true },
      orderBy: { _count: { id: "desc" } },
      take: 10,
    }),

    // 연도 목록
    prisma.incidentRecord.findMany({
      select: { year: true },
      distinct: ["year"],
      orderBy: { year: "asc" },
    }),
  ]);

  return NextResponse.json({
    years: yearRows.map((r) => r.year),
    total: {
      incidentCount: totalAgg._count.id,
      totalDurationMin: totalAgg._sum.durationMin ?? 0,
    },
    byRepairType: repairTypeGroups.map((g) => ({
      repairType: g.repairType ?? "미분류",
      count: g._sum.count ?? 0,
      durationMin: g._sum.durationMin ?? 0,
    })),
    byManagementType: managementTypeGroups.map((g) => ({
      managementType: g.managementType ?? "미분류",
      count: g._sum.count ?? 0,
      durationMin: g._sum.durationMin ?? 0,
    })),
    topEquipment: equipmentGroups.map((g) => ({
      equipment: g.equipment,
      incidentCount: g._count.id,
      totalDurationMin: g._sum.durationMin ?? 0,
    })),
  });
}
