import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  const currentYear = new Date().getFullYear();

  const [mtbfAgg, incidentAgg, managementGroups, equipmentGroups] =
    await Promise.all([
      prisma.monthlyRecord.aggregate({
        where: { year: currentYear },
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

  return NextResponse.json({
    avgMtbf: Math.round(((mtbfAgg._avg.mtbf ?? 0) * 10)) / 10,
    avgMttr: Math.round(((mtbfAgg._avg.mttr ?? 0) * 10)) / 10,
    totalIncidents,
    totalRepairHours,
    preventiveCount,
    reactiveCount,
    preventiveRatio,
    reactiveRatio,
    topEquipment,
    topEquipmentRatio,
  });
}
