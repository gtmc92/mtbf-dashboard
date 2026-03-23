import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// 초기 공장/공정 데이터 세팅용 API (최초 1회 실행)
export async function POST() {
  try {
    // F1 공장 생성
    const f1 = await prisma.factory.upsert({
      where: { name: "F1" },
      update: {},
      create: { name: "F1" },
    });

    // F2 공장 생성
    const f2 = await prisma.factory.upsert({
      where: { name: "F2" },
      update: {},
      create: { name: "F2" },
    });

    // F1 공정
    const f1Processes = ["54인치", "MSC"];
    for (const name of f1Processes) {
      await prisma.process.upsert({
        where: { factoryId_name: { factoryId: f1.id, name } },
        update: {},
        create: { name, factoryId: f1.id },
      });
    }

    // F2 공정
    const f2Processes = ["포생산", "1호기", "2호기", "3호기", "4호기", "5호기"];
    for (const name of f2Processes) {
      await prisma.process.upsert({
        where: { factoryId_name: { factoryId: f2.id, name } },
        update: {},
        create: { name, factoryId: f2.id },
      });
    }

    return NextResponse.json({ message: "초기 데이터 설정 완료" });
  } catch (error) {
    return NextResponse.json(
      { error: "초기 데이터 설정 실패", detail: String(error) },
      { status: 500 }
    );
  }
}
