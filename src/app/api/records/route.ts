import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET: 연도+공장+공정 기반 조회
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const year = searchParams.get("year");
  const factoryId = searchParams.get("factoryId");
  const processId = searchParams.get("processId");

  try {
    const records = await prisma.monthlyRecord.findMany({
      where: {
        ...(year ? { year: Number(year) } : {}),
        process: {
          ...(factoryId ? { factoryId: Number(factoryId) } : {}),
          ...(processId ? { id: Number(processId) } : {}),
        },
      },
      include: {
        process: {
          include: { factory: true },
        },
      },
      orderBy: [{ year: "asc" }, { month: "asc" }],
    });
    return NextResponse.json(records);
  } catch {
    return NextResponse.json({ error: "데이터 조회 실패" }, { status: 500 });
  }
}

// POST: 단건 저장 (upsert)
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { processId, year, month, operatingTime, stopCount, stopTime } = body;

    // MTBF = 가동시간 / 정지횟수 (정지횟수가 0이면 null)
    const mtbf =
      stopCount && stopCount > 0
        ? Math.round((operatingTime / stopCount / 60) * 10) / 10
        : null;

    // MTTR = 정지시간 / 정지횟수 (정지횟수가 0이면 null)
    const mttr =
      stopCount && stopCount > 0
        ? Math.round((stopTime / stopCount / 60) * 100) / 100
        : null;

    const record = await prisma.monthlyRecord.upsert({
      where: {
        processId_year_month: {
          processId: Number(processId),
          year: Number(year),
          month: Number(month),
        },
      },
      update: {
        operatingTime: operatingTime ? Number(operatingTime) : null,
        stopCount: stopCount ? Number(stopCount) : null,
        stopTime: stopTime ? Number(stopTime) : null,
        mtbf,
        mttr,
      },
      create: {
        processId: Number(processId),
        year: Number(year),
        month: Number(month),
        operatingTime: operatingTime ? Number(operatingTime) : null,
        stopCount: stopCount ? Number(stopCount) : null,
        stopTime: stopTime ? Number(stopTime) : null,
        mtbf,
        mttr,
      },
    });
    return NextResponse.json(record, { status: 201 });
  } catch {
    return NextResponse.json({ error: "데이터 저장 실패" }, { status: 500 });
  }
}
