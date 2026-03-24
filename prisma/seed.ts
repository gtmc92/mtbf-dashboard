import { PrismaClient } from "@prisma/client";
import f1Data2025 from "./seed-data/f1-2025";
import f2Data2025 from "./seed-data/f2-2025";
import f2Data2024 from "./seed-data/f2-2024";
const prisma = new PrismaClient();

async function main() {
  // import 검증
  console.log("🔍 f1Data2025:", Array.isArray(f1Data2025), "length:", f1Data2025?.length);
  console.log("🔍 f2Data2025:", Array.isArray(f2Data2025), "length:", f2Data2025?.length);
  if (!Array.isArray(f1Data2025)) throw new Error("f1Data2025 is not an array — import 오류");
  if (!Array.isArray(f2Data2025)) throw new Error("f2Data2025 is not an array — import 오류");

  // 공장 생성
  const f1 = await prisma.factory.upsert({
    where: { name: "F1" },
    update: {},
    create: { name: "F1" },
  });

  const f2 = await prisma.factory.upsert({
    where: { name: "F2" },
    update: {},
    create: { name: "F2" },
  });

  // 공정 생성
  for (const name of ["54인치", "MSC"]) {
    await prisma.process.upsert({
      where: { factoryId_name: { factoryId: f1.id, name } },
      update: {},
      create: { name, factoryId: f1.id },
    });
  }

  for (const name of ["포생산", "1호기", "2호기", "텐타 2", "슈퍼코팅", "라미네이팅"]) {
    await prisma.process.upsert({
      where: { factoryId_name: { factoryId: f2.id, name } },
      update: {},
      create: { name, factoryId: f2.id },
    });
  }

  // F1 공정 조회 → map 생성
  const f1Processes = await prisma.process.findMany({
    where: { factoryId: f1.id },
  });

  const processMap = new Map(f1Processes.map((p) => [p.name, p.id]));

    // F2 공정 조회 → map 생성
  const f2Processes = await prisma.process.findMany({
    where: { factoryId: f2.id },
  });
  
  const f2ProcessMap = new Map(f2Processes.map((p) => [p.name, p.id]));

  // 데이터 입력
  console.log("🔥 inserting F1 data...");

for (const row of f1Data2025) {
  console.log(row.process, row.month);

  const processId = processMap.get(row.process);

  if (!processId) {
    throw new Error(`Process not found: ${row.process}`);
  }

  const mtbf =
    row.stopCount && row.stopCount > 0
      ? row.operatingTime / row.stopCount
      : 0;

  const mttr =
    row.stopCount && row.stopCount > 0
      ? row.stopTime / row.stopCount
      : 0;

  await prisma.monthlyRecord.upsert({
      where: {
        processId_year_month: {
          processId,
          year: row.year,
          month: row.month,
        },
      },
      update: {
        operatingTime: row.operatingTime,
        stopCount: row.stopCount,
        stopTime: row.stopTime,
        mtbf,
        mttr,
      },
      create: {
        processId,
        year: row.year,
        month: row.month,
        operatingTime: row.operatingTime,
        stopCount: row.stopCount,
        stopTime: row.stopTime,
        mtbf,
        mttr,
      },
    });
  }
  console.log("🔥 inserting F2 data...");

  for (const row of f2Data2025) {
    console.log(row.process, row.month);
  
    const processId = f2ProcessMap.get(row.process);
  
    if (!processId) {
      throw new Error(`Process not found: ${row.process}`);
    }
  
    const mtbf =
      row.stopCount && row.stopCount > 0
        ? row.operatingTime / row.stopCount
        : 0;
  
    const mttr =
      row.stopCount && row.stopCount > 0
        ? row.stopTime / row.stopCount
        : 0;
  
    await prisma.monthlyRecord.upsert({
      where: {
        processId_year_month: {
          processId,
          year: row.year,
          month: row.month,
        },
      },
      update: {
        operatingTime: row.operatingTime,
        stopCount: row.stopCount,
        stopTime: row.stopTime,
        mtbf,
        mttr,
      },
      create: {
        processId,
        year: row.year,
        month: row.month,
        operatingTime: row.operatingTime,
        stopCount: row.stopCount,
        stopTime: row.stopTime,
        mtbf,
        mttr,
      },
    });
  }
  console.log("🔥 inserting F2 2024 data...");

  for (const row of f2Data2024) {
    console.log(row.process, row.month);

    const processId = f2ProcessMap.get(row.process);

    if (!processId) {
      throw new Error(`Process not found: ${row.process}`);
    }

    const mtbf =
      row.stopCount && row.stopCount > 0
        ? row.operatingTime / row.stopCount
        : 0;

    const mttr =
      row.stopCount && row.stopCount > 0
        ? row.stopTime / row.stopCount
        : 0;

    await prisma.monthlyRecord.upsert({
      where: {
        processId_year_month: {
          processId,
          year: row.year,
          month: row.month,
        },
      },
      update: {
        operatingTime: row.operatingTime,
        stopCount: row.stopCount,
        stopTime: row.stopTime,
        mtbf,
        mttr,
      },
      create: {
        processId,
        year: row.year,
        month: row.month,
        operatingTime: row.operatingTime,
        stopCount: row.stopCount,
        stopTime: row.stopTime,
        mtbf,
        mttr,
      },
    });
  }

  console.log("✅ Seed 완료");
  console.log(`F1 데이터: ${f1Data2025.length}건`);
  console.log(`F2 2025 데이터: ${f2Data2025.length}건`);
  console.log(`F2 2024 데이터: ${f2Data2024.length}건`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());