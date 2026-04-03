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
    equipmentRepairTypeRows,
    yearRows,
    topRepairRows,
  ] = await Promise.all([
    prisma.incidentRecord.aggregate({
      where,
      _count: { id: true },
      _sum: { durationMin: true },
    }),
    prisma.repairTypeRecord.groupBy({
      by: ["repairType"],
      where,
      _sum: { count: true, durationMin: true },
      orderBy: { _sum: { count: "desc" } },
    }),
    prisma.repairTypeRecord.groupBy({
      by: ["managementType"],
      where,
      _sum: { count: true, durationMin: true },
    }),
    prisma.incidentRecord.groupBy({
      by: ["equipment"],
      where,
      _count: { id: true },
      _sum: { durationMin: true },
      orderBy: { _count: { id: "desc" } },
      take: 10,
    }),
    // 공정별 + 수리유형별 집계 (stacked chart용)
    prisma.repairTypeRecord.groupBy({
      by: ["equipment", "repairType"],
      where,
      _sum: { count: true },
    }),
    prisma.incidentRecord.findMany({
      select: { year: true },
      distinct: ["year"],
      orderBy: { year: "asc" },
    }),
    // 수리시간 기준 TOP10 (원문 개별 레코드)
    prisma.repairTypeRecord.findMany({
      where: { ...where, durationMin: { not: null } },
      select: { equipment: true, durationMin: true, repairType: true, description: true },
      orderBy: { durationMin: "desc" },
      take: 10,
    }),
  ]);

  // top 10 equipment 목록
  const top10 = equipmentGroups.map((g) => g.equipment);

  // 공정별 수리유형 피벗 (top10 기준)
  const pivotMap: Record<string, Record<string, number>> = {};
  for (const row of equipmentRepairTypeRows) {
    if (!top10.includes(row.equipment)) continue;
    if (!pivotMap[row.equipment]) pivotMap[row.equipment] = {};
    pivotMap[row.equipment][row.repairType ?? "미분류"] = row._sum.count ?? 0;
  }
  const byEquipmentRepairType = top10.map((eq) => ({
    equipment: eq,
    ...pivotMap[eq],
  }));

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
    byEquipmentRepairType,
    topRepairs: topRepairRows.map((r) => ({
      equipment: r.equipment,
      durationMin: r.durationMin ?? 0,
      repairType: r.repairType ?? "미분류",
      description: r.description ?? "",
    })),
  });
}
