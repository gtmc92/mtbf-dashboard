import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

// 시설현황 페이지에서 표시할 공장 목록. 확장 시 배열에 추가.
const FACILITY_VISIBLE_FACTORIES = ["F2"];
// 공장 prefix 없이 저장된 공통설비 (F2 소속으로 취급). 확장 시 배열에 추가.
const FACILITY_COMMON_EQUIPMENT = ["공통설비"];

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const yearParam = searchParams.get("year");

  const factoryFilters = FACILITY_VISIBLE_FACTORIES.map((f) => ({ equipment: { startsWith: f } }));
  const commonFilters = FACILITY_COMMON_EQUIPMENT.map((e) => ({ equipment: e }));
  const equipmentOR = [...factoryFilters, ...commonFilters];

  const yearFilter = yearParam ? { year: Number(yearParam) } : {};
  const where = { ...yearFilter, OR: equipmentOR };

  const [
    totalAgg,
    repairTypeGroups,
    managementTypeGroups,
    equipmentGroups,
    equipmentRepairTypeRows,
    yearRows,
    topRepairRows,
    repairTypeMasters,
    improvementTopRows,
    maintenanceTopRows,
  ] = await Promise.all([
    prisma.repairTypeRecord.aggregate({
      where,
      _sum: { count: true, durationMin: true },
    }),
    prisma.repairTypeRecord.groupBy({
      by: ["repairType"],
      where,
      _sum: { count: true, durationMin: true },
    }),
    prisma.repairTypeRecord.groupBy({
      by: ["managementType"],
      where,
      _sum: { count: true, durationMin: true },
    }),
    prisma.repairTypeRecord.groupBy({
      by: ["equipment"],
      where,
      _sum: { count: true, durationMin: true },
      orderBy: { _sum: { count: "desc" } },
      take: 10,
    }),
    // 공정별 + 수리유형별 집계 (stacked chart용)
    prisma.repairTypeRecord.groupBy({
      by: ["equipment", "repairType"],
      where,
      _sum: { count: true },
    }),
    prisma.repairTypeRecord.findMany({
      select: { year: true },
      distinct: ["year"],
      orderBy: { year: "asc" },
    }),
    // 정지수리 기준 수리시간(인원 가중치) TOP10 — repairTime 없는 경우 durationMin으로 fallback
    // AND로 묶어야 equipment OR 필터가 덮어쓰이지 않음
    prisma.repairTypeRecord.findMany({
      where: {
        AND: [
          where,
          { repairType: "정지수리" },
          { OR: [{ repairTime: { not: null } }, { durationMin: { not: null } }] },
        ],
      },
      select: { equipment: true, repairTime: true, durationMin: true, repairType: true, description: true },
    }),
    // 표시순서 lookup
    prisma.repairTypeMaster.findMany({ orderBy: { displayOrder: "asc" } }),
    // 개선작업 TOP (일반제작 + 개발작업) — durationMin 기준
    prisma.repairTypeRecord.findMany({
      where: {
        AND: [
          where,
          { repairType: { in: ["일반제작", "개발작업"] } },
          { durationMin: { not: null } },
        ],
      },
      select: { equipment: true, durationMin: true, repairType: true, description: true },
    }),
    // 유지보수 TOP — durationMin 기준
    prisma.repairTypeRecord.findMany({
      where: {
        AND: [
          where,
          { repairType: "유지보수" },
          { durationMin: { not: null } },
        ],
      },
      select: { equipment: true, durationMin: true, repairType: true, description: true },
    }),
  ]);

  // 표시순서 맵 (repairType → displayOrder)
  const displayOrderMap = new Map(
    repairTypeMasters.map((m) => [m.repairType, m.displayOrder])
  );

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
      incidentCount: totalAgg._sum.count ?? 0,
      totalDurationMin: totalAgg._sum.durationMin ?? 0,
    },
    byRepairType: repairTypeGroups
      .map((g) => ({
        repairType: g.repairType ?? "미분류",
        count: g._sum.count ?? 0,
        durationMin: g._sum.durationMin ?? 0,
      }))
      .sort((a, b) => {
        const oa = displayOrderMap.get(a.repairType) ?? 99;
        const ob = displayOrderMap.get(b.repairType) ?? 99;
        return oa - ob;
      }),
    byManagementType: managementTypeGroups.map((g) => ({
      managementType: g.managementType ?? "미분류",
      count: g._sum.count ?? 0,
      durationMin: g._sum.durationMin ?? 0,
    })),
    topEquipment: equipmentGroups.map((g) => ({
      equipment: g.equipment,
      incidentCount: g._sum.count ?? 0,
      totalDurationMin: g._sum.durationMin ?? 0,
    })),
    byEquipmentRepairType,
    topRepairs: topRepairRows
      .sort((a, b) => (b.repairTime ?? b.durationMin ?? 0) - (a.repairTime ?? a.durationMin ?? 0))
      .slice(0, 10)
      .map((r) => ({
        equipment: r.equipment,
        repairTime: r.repairTime ?? r.durationMin ?? 0,
        repairType: r.repairType ?? "미분류",
        description: r.description ?? "",
      })),
    improvementTopItems: improvementTopRows
      .sort((a, b) => (b.durationMin ?? 0) - (a.durationMin ?? 0))
      .slice(0, 10)
      .map((r) => ({
        equipment: r.equipment,
        durationMin: r.durationMin ?? 0,
        repairType: r.repairType ?? "미분류",
        description: r.description ?? "",
      })),
    maintenanceTopItems: maintenanceTopRows
      .sort((a, b) => (b.durationMin ?? 0) - (a.durationMin ?? 0))
      .slice(0, 10)
      .map((r) => ({
        equipment: r.equipment,
        durationMin: r.durationMin ?? 0,
        repairType: r.repairType ?? "미분류",
        description: r.description ?? "",
      })),
  });
}
