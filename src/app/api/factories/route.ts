import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const factories = await prisma.factory.findMany({
      include: { processes: true },
      orderBy: { name: "asc" },
    });
    return NextResponse.json(factories);
  } catch (error) {
    return NextResponse.json({ error: "공장 조회 실패" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const { name } = await req.json();
    const factory = await prisma.factory.create({ data: { name } });
    return NextResponse.json(factory, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: "공장 생성 실패" }, { status: 500 });
  }
}
