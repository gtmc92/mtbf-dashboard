import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  FABRICATION_INSTALL_REPAIR_TYPE,
  LEGACY_FABRICATION_REPAIR_TYPE,
  normalizeRepairType,
} from "@/lib/repairTypes";
import type { Prisma } from "@prisma/client";

export const dynamic = "force-dynamic";

// 시설현황 페이지에서 표시할 공장 목록. 확장 시 배열에 추가.
const FACILITY_VISIBLE_FACTORIES = ["F2"];
// 공장 prefix 없이 저장된 공통설비 (F2 소속으로 취급). 확장 시 배열에 추가.
const FACILITY_COMMON_EQUIPMENT = ["공통설비"];

type TopWorkRow = {
  year: number;
  month: number;
  day: number;
  equipment: string;
  subEquipment: string | null;
  repairItem: string | null;
  durationMin: number | null;
  technicianCount: number | null;
  technician: string | null;
  repairType: string | null;
  description: string | null;
};

function normalizeTextForGrouping(value: string | null) {
  return (value ?? "")
    .normalize("NFKC")
    .replace(/[\u0000-\u001F\u007F-\u009F]/g, " ")
    .replace(/[\u00A0\u1680\u180E\u2000-\u200A\u2028\u2029\u202F\u205F\u3000]/g, " ")
    .replace(/\s+/g, " ")
    .replace(/\s*([,.(){}\[\]<>:;!?/\\|+-])\s*/g, "$1")
    .replace(/([,.(){}\[\]<>:;!?/\\|+-])\1+/g, "$1")
    .trim();
}

function cleanDisplayText(value: string | null) {
  return (value ?? "").replace(/\s+/g, " ").trim();
}

function dateKey(row: Pick<TopWorkRow, "year" | "month" | "day">) {
  return `${row.year}-${String(row.month).padStart(2, "0")}-${String(row.day).padStart(2, "0")}`;
}

function groupTopWorkItems(rows: TopWorkRow[]) {
  const eventMap = new Map<
    string,
    {
      year: number;
      month: number;
      day: number;
      equipment: string;
      subEquipment: string;
      repairItem: string;
      repairType: string;
      normalizedDescription: string;
      representativeActionText: string;
      durationMin: number;
      technicianCount: number;
      workerNames: Set<string>;
    }
  >();

  for (const row of rows) {
    const repairType = normalizeRepairType(row.repairType) ?? "미분류";
    const subEquipment = cleanDisplayText(row.subEquipment);
    const repairItem = cleanDisplayText(row.repairItem);
    const normalizedDescription = normalizeTextForGrouping(row.description);
    const representativeActionText = cleanDisplayText(row.description);
    const eventKey = JSON.stringify([
      row.year,
      row.month,
      row.day,
      row.equipment,
      subEquipment,
      repairItem,
      repairType,
      normalizedDescription,
    ]);
    const current = eventMap.get(eventKey) ?? {
      year: row.year,
      month: row.month,
      day: row.day,
      equipment: row.equipment,
      subEquipment,
      repairItem,
      repairType,
      normalizedDescription,
      representativeActionText,
      durationMin: 0,
      technicianCount: 0,
      workerNames: new Set<string>(),
    };
    current.durationMin += row.durationMin ?? 0;
    current.technicianCount += row.technicianCount ?? 0;
    if (!current.representativeActionText && representativeActionText) {
      current.representativeActionText = representativeActionText;
    }
    cleanDisplayText(row.technician)
      .split(",")
      .map((name) => name.trim())
      .filter(Boolean)
      .forEach((name) => current.workerNames.add(name));
    eventMap.set(eventKey, current);
  }

  const cumulativeMap = new Map<
    string,
    {
      equipment: string;
      subEquipment: string;
      repairItem: string;
      repairType: string;
      normalizedDescription: string;
      description: string;
      durationMin: number;
      technicianCount: number;
      occurrenceCount: number;
      firstDate: string;
      lastDate: string;
      dates: Set<string>;
      workerNames: Set<string>;
    }
  >();

  for (const event of eventMap.values()) {
    const cumulativeKey = JSON.stringify([
      event.equipment,
      event.subEquipment,
      event.repairItem,
      event.repairType,
      event.normalizedDescription,
    ]);
    const eventDate = dateKey(event);
    const current = cumulativeMap.get(cumulativeKey) ?? {
      equipment: event.equipment,
      subEquipment: event.subEquipment,
      repairItem: event.repairItem,
      repairType: event.repairType,
      normalizedDescription: event.normalizedDescription,
      description: event.representativeActionText,
      durationMin: 0,
      technicianCount: 0,
      occurrenceCount: 0,
      firstDate: eventDate,
      lastDate: eventDate,
      dates: new Set<string>(),
      workerNames: new Set<string>(),
    };
    current.durationMin += event.durationMin;
    current.technicianCount += event.technicianCount;
    current.occurrenceCount += 1;
    current.firstDate = eventDate < current.firstDate ? eventDate : current.firstDate;
    current.lastDate = eventDate > current.lastDate ? eventDate : current.lastDate;
    current.dates.add(eventDate);
    if (!current.description && event.representativeActionText) {
      current.description = event.representativeActionText;
    }
    event.workerNames.forEach((name) => current.workerNames.add(name));
    cumulativeMap.set(cumulativeKey, current);
  }

  return [...cumulativeMap.values()]
    .sort((a, b) => b.durationMin - a.durationMin)
    .slice(0, 10)
    .map((item) => ({
      ...item,
      dates: [...item.dates].sort(),
      workerNames: [...item.workerNames].sort(),
    }));
}

function calcMtbfMttr(opMin: number, stopCount: number, stopMin: number) {
  return {
    mtbf: stopCount > 0 ? Math.round((opMin / stopCount / 60) * 10) / 10 : null,
    mttr: stopCount > 0 ? Math.round((stopMin / stopCount / 60) * 100) / 100 : null,
  };
}

function percentChange(current: number | null, previous: number | null) {
  if (current === null || previous === null || previous === 0) return null;
  return Math.round(((current - previous) / previous) * 1000) / 10;
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const yearParam = searchParams.get("year");
  const monthParam = searchParams.get("month");
  const equipmentParam = searchParams.get("equipment");
  const managementTypeParam = searchParams.get("managementType");

  const factoryFilters = FACILITY_VISIBLE_FACTORIES.map((f) => ({ equipment: { startsWith: f } }));
  const commonFilters = FACILITY_COMMON_EQUIPMENT.map((e) => ({ equipment: e }));
  const equipmentOR = [...factoryFilters, ...commonFilters];

  const scopedWhere: Prisma.RepairTypeRecordWhereInput = { OR: equipmentOR };
  const filters: Prisma.RepairTypeRecordWhereInput[] = [scopedWhere];

  if (yearParam) filters.push({ year: Number(yearParam) });
  if (monthParam) filters.push({ month: Number(monthParam) });
  if (equipmentParam) filters.push({ equipment: equipmentParam });
  if (managementTypeParam) filters.push({ managementType: managementTypeParam });

  const where: Prisma.RepairTypeRecordWhereInput = { AND: filters };
  const optionWhere: Prisma.RepairTypeRecordWhereInput = yearParam
    ? { AND: [scopedWhere, { year: Number(yearParam) }] }
    : scopedWhere;

  const selectedYear = yearParam ? Number(yearParam) : null;
  const selectedMonth = monthParam ? Number(monthParam) : null;

  const [
    totalAgg,
    repairTypeGroups,
    managementTypeGroups,
    equipmentGroups,
    equipmentRepairTypeRows,
    yearRows,
    repairTypeMasters,
    improvementTopRows,
    maintenanceTopRows,
    monthRows,
    equipmentRows,
    managementTypeRows,
    latestRepairYear,
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
    // 표시순서 lookup
    prisma.repairTypeMaster.findMany({ orderBy: { displayOrder: "asc" } }),
    // 개선작업 TOP (제작설치 + 개발작업) — durationMin 기준
    prisma.repairTypeRecord.findMany({
      where: {
        AND: [
          where,
          { repairType: { in: [FABRICATION_INSTALL_REPAIR_TYPE, LEGACY_FABRICATION_REPAIR_TYPE, "개발작업"] } },
          { durationMin: { not: null } },
        ],
      },
      select: {
        year: true,
        month: true,
        day: true,
        equipment: true,
        subEquipment: true,
        repairItem: true,
        durationMin: true,
        technicianCount: true,
        technician: true,
        repairType: true,
        description: true,
      },
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
      select: {
        year: true,
        month: true,
        day: true,
        equipment: true,
        subEquipment: true,
        repairItem: true,
        durationMin: true,
        technicianCount: true,
        technician: true,
        repairType: true,
        description: true,
      },
    }),
    prisma.repairTypeRecord.findMany({
      where: optionWhere,
      select: { month: true },
      distinct: ["month"],
      orderBy: { month: "asc" },
    }),
    prisma.repairTypeRecord.findMany({
      where: optionWhere,
      select: { equipment: true },
      distinct: ["equipment"],
      orderBy: { equipment: "asc" },
    }),
    prisma.repairTypeRecord.findMany({
      where: optionWhere,
      select: { managementType: true },
      distinct: ["managementType"],
      orderBy: { managementType: "asc" },
    }),
    prisma.repairTypeRecord.aggregate({
      where: scopedWhere,
      _max: { year: true },
    }),
  ]);

  const comparisonYear = selectedYear ?? latestRepairYear._max.year ?? new Date().getFullYear();
  const periodMonthAgg = selectedMonth
    ? null
    : await prisma.repairTypeRecord.aggregate({
        where: { AND: [scopedWhere, { year: comparisonYear }] },
        _max: { month: true },
      });
  const comparisonEndMonth = selectedMonth ?? periodMonthAgg?._max.month ?? 12;
  const monthlyWhere = (year: number): Prisma.MonthlyRecordWhereInput => ({
    year,
    month: { lte: comparisonEndMonth },
    process: { factory: { name: { in: FACILITY_VISIBLE_FACTORIES } } },
  });

  const [currentMtbfAgg, previousMtbfAgg] = await Promise.all([
    prisma.monthlyRecord.aggregate({
      where: monthlyWhere(comparisonYear),
      _sum: { operatingTime: true, stopCount: true, stopTime: true },
    }),
    prisma.monthlyRecord.aggregate({
      where: monthlyWhere(comparisonYear - 1),
      _sum: { operatingTime: true, stopCount: true, stopTime: true },
    }),
  ]);

  const currentMtbfMttr = calcMtbfMttr(
    currentMtbfAgg._sum.operatingTime ?? 0,
    currentMtbfAgg._sum.stopCount ?? 0,
    currentMtbfAgg._sum.stopTime ?? 0
  );
  const previousMtbfMttr = calcMtbfMttr(
    previousMtbfAgg._sum.operatingTime ?? 0,
    previousMtbfAgg._sum.stopCount ?? 0,
    previousMtbfAgg._sum.stopTime ?? 0
  );

  const stopRepairTopRows = await prisma.repairTypeRecord.findMany({
    where: {
      AND: [
        where,
        { repairType: "정지수리" },
        { durationMin: { not: null } },
      ],
    },
    select: {
      year: true,
      month: true,
      day: true,
      equipment: true,
      subEquipment: true,
      repairItem: true,
      durationMin: true,
      technicianCount: true,
      technician: true,
      repairType: true,
      description: true,
    },
  });

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
    const repairType = normalizeRepairType(row.repairType) ?? "미분류";
    pivotMap[row.equipment][repairType] = (pivotMap[row.equipment][repairType] ?? 0) + (row._sum.count ?? 0);
  }
  const byEquipmentRepairType = top10.map((eq) => ({
    equipment: eq,
    ...pivotMap[eq],
  }));

  return NextResponse.json({
    years: yearRows.map((r) => r.year),
    filters: {
      months: monthRows.map((r) => r.month),
      equipment: equipmentRows.map((r) => r.equipment),
      managementTypes: managementTypeRows
        .map((r) => r.managementType)
        .filter((v): v is string => Boolean(v)),
    },
    total: {
      incidentCount: totalAgg._sum.count ?? 0,
      totalDurationMin: totalAgg._sum.durationMin ?? 0,
    },
    byRepairType: Object.values(
      repairTypeGroups.reduce<Record<string, { repairType: string; count: number; durationMin: number }>>(
        (acc, g) => {
          const repairType = normalizeRepairType(g.repairType) ?? "미분류";
          const current = acc[repairType] ?? { repairType, count: 0, durationMin: 0 };
          current.count += g._sum.count ?? 0;
          current.durationMin += g._sum.durationMin ?? 0;
          acc[repairType] = current;
          return acc;
        },
        {}
      )
    )
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
    mtbfMttrComparison: {
      year: comparisonYear,
      previousYear: comparisonYear - 1,
      endMonth: comparisonEndMonth,
      mtbf: currentMtbfMttr.mtbf,
      mttr: currentMtbfMttr.mttr,
      previousMtbf: previousMtbfMttr.mtbf,
      previousMttr: previousMtbfMttr.mttr,
      mtbfChangePct: percentChange(currentMtbfMttr.mtbf, previousMtbfMttr.mtbf),
      mttrChangePct: percentChange(currentMtbfMttr.mttr, previousMtbfMttr.mttr),
    },
    topRepairs: groupTopWorkItems(stopRepairTopRows).map((r) => ({
      ...r,
      repairTime: r.durationMin,
    })),
    fabricationInstallTopItems: groupTopWorkItems(
      improvementTopRows.filter((r) => normalizeRepairType(r.repairType) === FABRICATION_INSTALL_REPAIR_TYPE)
    ),
    developmentTopItems: groupTopWorkItems(
      improvementTopRows.filter((r) => normalizeRepairType(r.repairType) === "개발작업")
    ),
    maintenanceTopItems: groupTopWorkItems(maintenanceTopRows),
  });
}
