import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
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
  for (const name of ["54인치", "MSC"]) {
    await prisma.process.upsert({
      where: { factoryId_name: { factoryId: f1.id, name } },
      update: {},
      create: { name, factoryId: f1.id },
    });
  }

  // F2 공정
  for (const name of ["포생산", "1호기", "2호기", "3호기", "4호기", "5호기"]) {
    await prisma.process.upsert({
      where: { factoryId_name: { factoryId: f2.id, name } },
      update: {},
      create: { name, factoryId: f2.id },
    });
  }

  console.log("✅ 초기 데이터 설정 완료");
  console.log("  F1:", ["54인치", "MSC"]);
  console.log("  F2:", ["포생산", "1호기", "2호기", "3호기", "4호기", "5호기"]);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
