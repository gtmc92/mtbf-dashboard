import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  const currentYear = new Date().getFullYear();

  const [mtbfAgg, incidentAgg, managementGroups, equipmentGroups, lastMonthAgg, rollingAgg] =
    await Promise.all([
      prisma.monthlyRecord.aggregate({
        where: { year: currentYear },
        _sum: { operatingTime: true, stopCount: true, stopTime: true },
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
      // 마지막 데이터 월 조회
      prisma.monthlyRecord.aggregate({
        where: { year: currentYear },
        _max: { month: true },
      }),
      // 전체 연도 rolling 집계
      prisma.monthlyRecord.aggregate({
        _sum: { operatingTime: true, stopCount: true, stopTime: true },
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

  // 마지막 데이터 월 기준 무고장 공정 비율 계산
  const lastMonth = lastMonthAgg._max.month ?? (new Date().getMonth() + 1);
  const lastMonthRecords = await prisma.monthlyRecord.findMany({
    where: { year: currentYear, month: lastMonth },
    select: { processId: true, stopCount: true },
  });
  const totalProcessCount = lastMonthRecords.length;
  const noFailureProcessCount = lastMonthRecords.filter(
    (r) => (r.stopCount ?? 0) === 0
  ).length;
  const noFailureProcessRatio =
    totalProcessCount > 0
      ? Math.round((noFailureProcessCount / totalProcessCount) * 1000) / 10
      : 0;

  const ytdOp = mtbfAgg._sum.operatingTime ?? 0;
  const ytdCnt = mtbfAgg._sum.stopCount ?? 0;
  const ytdStop = mtbfAgg._sum.stopTime ?? 0;
  const ytdMtbf = ytdCnt > 0 ? Math.round((ytdOp / ytdCnt / 60) * 10) / 10 : null;
  const ytdMttr = ytdCnt > 0 ? Math.round((ytdStop / ytdCnt / 60) * 100) / 100 : null;

  const rollingOp   = rollingAgg._sum.operatingTime ?? 0;
  const rollingCnt  = rollingAgg._sum.stopCount ?? 0;
  const rollingStop = rollingAgg._sum.stopTime ?? 0;
  const rollingMtbf = rollingCnt > 0 ? Math.round((rollingOp / rollingCnt / 60) * 10) / 10 : null;
  const rollingMttr = rollingCnt > 0 ? Math.round((rollingStop / rollingCnt / 60) * 100) / 100 : null;

  return NextResponse.json({
    ytdMtbf,
    ytdMttr,
    rollingMtbf,
    rollingMttr,
    totalIncidents,
    totalRepairHours,
    preventiveCount,
    reactiveCount,
    preventiveRatio,
    reactiveRatio,
    topEquipment,
    topEquipmentRatio,
    noFailureProcessCount,
    totalProcessCount,
    noFailureProcessRatio,
    noFailureLastMonth: lastMonth,
  });
}
