import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  const currentYear = new Date().getFullYear();

  const [mtbfAgg, incidentAgg, managementGroups, equipmentGroups, allStopRecords] =
    await Promise.all([
      prisma.monthlyRecord.aggregate({
        where: { year: currentYear, stopCount: { gt: 0 } },
        _avg: { mtbf: true, mttr: true },
      }),
      prisma.incidentRecord.aggregate({
        where: { year: currentYear },
        _count: { id: true },
        _sum: { durationMin: true },
      }),
      prisma.repairTypeRecord.groupBy({
        by: ["managementType"],
        where: { year: currentYear },
        _sum: { count: true },
      }),
      prisma.incidentRecord.groupBy({
        by: ["equipment"],
        where: { year: currentYear },
        _count: { id: true },
        orderBy: { _count: { id: "desc" } },
        take: 1,
      }),
      prisma.monthlyRecord.findMany({
        select: { year: true, month: true, stopCount: true },
        orderBy: [{ year: "desc" }, { month: "desc" }],
      }),
    ]);

  const totalIncidents = incidentAgg._count.id;
  const totalRepairHours =
    Math.round(((incidentAgg._sum.durationMin ?? 0) / 60) * 10) / 10;

  const preventiveCount =
    managementGroups
      .filter((g) => g.managementType === "Preventive")
      .reduce((s, g) => s + (g._sum.count ?? 0), 0);
  const reactiveCount =
    managementGroups
      .filter((g) => g.managementType === "Reactive")
      .reduce((s, g) => s + (g._sum.count ?? 0), 0);

  const topEq = equipmentGroups[0];
  const topEquipment = topEq
    ? topEq.equipment.replace(/^(F1_|F2_)/, "")
    : "-";
  const topEquipmentCount = topEq ? topEq._count.id : 0;
  const topEquipmentRatio =
    totalIncidents > 0
      ? Math.round((topEquipmentCount / totalIncidents) * 1000) / 10
      : 0;

  const prTotal = preventiveCount + reactiveCount;
  const reactiveRatio =
    prTotal > 0 ? Math.round((reactiveCount / prTotal) * 1000) / 10 : 0;
  const preventiveRatio =
    prTotal > 0 ? Math.round((preventiveCount / prTotal) * 1000) / 10 : 0;

  // 연속 무고장 개월 수 계산
  const monthlyStopMap = new Map<string, number>();
  allStopRecords.forEach((r) => {
    const key = `${r.year}-${r.month}`;
    monthlyStopMap.set(key, (monthlyStopMap.get(key) ?? 0) + (r.stopCount ?? 0));
  });

  const now = new Date();
  let cy = now.getFullYear(), cm = now.getMonth() + 1;
  let consecutiveNoFailureMonths = 0;
  let lastFailureYear: number | null = null;
  let lastFailureMonth: number | null = null;

  for (let i = 0; i < 120; i++) {
    const key = `${cy}-${cm}`;
    const stopCount = monthlyStopMap.get(key);
    if (stopCount === undefined) {
      cm--;
      if (cm === 0) { cm = 12; cy--; }
      continue;
    }
    if (stopCount === 0) {
      consecutiveNoFailureMonths++;
    } else {
      lastFailureYear = cy;
      lastFailureMonth = cm;
      break;
    }
    cm--;
    if (cm === 0) { cm = 12; cy--; }
  }

  return NextResponse.json({
    avgMtbf: mtbfAgg._avg.mtbf != null
      ? Math.round((mtbfAgg._avg.mtbf / 60) * 10) / 10
      : null,
    avgMttr: mtbfAgg._avg.mttr != null
      ? Math.round((mtbfAgg._avg.mttr / 60) * 10) / 10
      : null,
    totalIncidents,
    totalRepairHours,
    preventiveCount,
    reactiveCount,
    preventiveRatio,
    reactiveRatio,
    topEquipment,
    topEquipmentRatio,
    consecutiveNoFailureMonths,
    lastFailureYear,
    lastFailureMonth,
  });
}
