import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const factoryId = searchParams.get("factoryId");

  try {
    const processes = await prisma.process.findMany({
      where: factoryId ? { factoryId: Number(factoryId) } : undefined,
      include: { factory: true },
      orderBy: { name: "asc" },
    });
    return NextResponse.json(processes);
  } catch {
    return NextResponse.json({ error: "공정 조회 실패" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const { name, factoryId } = await req.json();
    const process = await prisma.process.create({
      data: { name, factoryId: Number(factoryId) },
    });
    return NextResponse.json(process, { status: 201 });
  } catch {
    return NextResponse.json({ error: "공정 생성 실패" }, { status: 500 });
  }
}
