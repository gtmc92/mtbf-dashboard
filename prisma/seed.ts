import { PrismaClient } from "@prisma/client";
import * as fs from "fs";
import * as path from "path";

const prisma = new PrismaClient();

// ─── 유틸 ────────────────────────────────────────────────────────────────────

interface CsvRow {
  year: number;
  factory: string;
  process: string;
  month: number;
  operatingTime: number | null;
  stopCount: number;
  stopTime: number | null;
}

function parseNumber(raw: string): number | null {
  const trimmed = raw.trim();
  if (trimmed === "" || trimmed === "-") return null;
  const cleaned = trimmed.replace(/,/g, "");
  const n = Number(cleaned);
  return isNaN(n) ? null : n;
}

function parseString(raw: string): string {
  return raw.trim();
}

function loadCsvRows(csvPath: string): CsvRow[] {
  if (!fs.existsSync(csvPath)) {
    throw new Error(`CSV 파일을 찾을 수 없습니다: ${csvPath}`);
  }

  let content = fs.readFileSync(csvPath, "utf-8");

  // UTF-8 BOM 제거 (Windows Excel 저장 시 붙는 경우)
  if (content.charCodeAt(0) === 0xfeff) {
    content = content.slice(1);
  }

  const lines = content.split(/\r?\n/).filter((l) => l.trim() !== "");

  // 헤더 → 인덱스 맵
  const headers = lines[0].split(",");
  const HEADER_MAP: Record<string, number> = {};
  headers.forEach((h, i) => {
    HEADER_MAP[h.trim()] = i;
  });

  const required = ["연도", "공장", "공정", "월", "가동시간", "정지횟수", "정지시간"];
  for (const col of required) {
    if (HEADER_MAP[col] === undefined) {
      throw new Error(`CSV 필수 컬럼 없음: "${col}"`);
    }
  }

  const rows: CsvRow[] = [];

  for (let i = 1; i < lines.length; i++) {
    const cols = lines[i].split(",");

    const year = parseNumber(cols[HEADER_MAP["연도"]]);
    const factory = parseString(cols[HEADER_MAP["공장"]]);
    const process = parseString(cols[HEADER_MAP["공정"]]);
    const month = parseNumber(cols[HEADER_MAP["월"]]);
    const operatingTime = parseNumber(cols[HEADER_MAP["가동시간"]]);
    const stopCountRaw = parseNumber(cols[HEADER_MAP["정지횟수"]]);
    const stopTime = parseNumber(cols[HEADER_MAP["정지시간"]]);

    if (year === null || month === null || !factory || !process) {
      console.warn(`  ⚠️  row ${i + 1} 건너뜀 (필수값 없음): ${lines[i]}`);
      continue;
    }

    rows.push({
      year,
      factory,
      process,
      month,
      operatingTime,
      stopCount: stopCountRaw ?? 0,
      stopTime,
    });
  }

  return rows;
}

async function getOrCreateFactory(name: string) {
  return prisma.factory.upsert({
    where: { name },
    update: {},
    create: { name },
  });
}

async function getOrCreateProcess(name: string, factoryId: number) {
  return prisma.process.upsert({
    where: { factoryId_name: { factoryId, name } },
    update: {},
    create: { name, factoryId },
  });
}

// ─── main ─────────────────────────────────────────────────────────────────────

async function main() {
  // ── 1. 기존 데이터 전체 삭제 (외래키 순서 준수) ──
  console.log("🗑️  기존 데이터 삭제 중...");
  const delRecords = await prisma.monthlyRecord.deleteMany();
  const delProcesses = await prisma.process.deleteMany();
  const delFactories = await prisma.factory.deleteMany();
  console.log(
    `   MonthlyRecord ${delRecords.count}건, Process ${delProcesses.count}건, Factory ${delFactories.count}건 삭제 완료`
  );

  // ── 2. DATA_PTEAM.csv 로드 (생산 KPI) ──
  const csvPath = path.join(__dirname, "DATA_PTEAM.csv");
  const rows = loadCsvRows(csvPath);
  console.log(`\n📄 DATA_PTEAM.csv 로드 완료: ${rows.length}행`);

  // ── 3. Factory 생성 ──
  const factoryNames = [...new Set(rows.map((r) => r.factory))];
  const factoryMap = new Map<string, number>();

  for (const name of factoryNames) {
    const factory = await getOrCreateFactory(name);
    factoryMap.set(name, factory.id);
  }
  console.log(`🏭 Factory 생성: ${factoryMap.size}개 (${[...factoryMap.keys()].join(", ")})`);

  // ── 4. Process 생성 ──
  const processMap = new Map<string, number>();
  const processPairs = [
    ...new Map(rows.map((r) => [`${r.factory}::${r.process}`, r])).values(),
  ];

  for (const row of processPairs) {
    const factoryId = factoryMap.get(row.factory);
    if (!factoryId) throw new Error(`Factory 맵에 없음: ${row.factory}`);
    const proc = await getOrCreateProcess(row.process, factoryId);
    processMap.set(`${row.factory}::${row.process}`, proc.id);
  }
  console.log(`⚙️  Process 생성: ${processMap.size}개`);

  // ── 5. MonthlyRecord 생성 ──
  // DATA_BASE.csv, DATA_TYPE.csv는 이후 같은 패턴으로 여기에 추가
  let insertedCount = 0;

  for (const row of rows) {
    const processId = processMap.get(`${row.factory}::${row.process}`);
    if (!processId) {
      throw new Error(`Process 맵에 없음: ${row.factory}::${row.process}`);
    }

    const mtbf =
      row.stopCount > 0 && row.operatingTime !== null
        ? row.operatingTime / row.stopCount
        : 0;

    const mttr =
      row.stopCount > 0 && row.stopTime !== null
        ? row.stopTime / row.stopCount
        : 0;

    await prisma.monthlyRecord.create({
      data: {
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

    insertedCount++;
  }

  console.log("\n─────────────────────────────────────");
  console.log("✅ Seed 완료");
  console.log(`   CSV 총 행 수          : ${rows.length}`);
  console.log(`   MonthlyRecord 반영 건수: ${insertedCount}`);
  console.log(`   Factory               : ${factoryMap.size}개 (${[...factoryMap.keys()].join(", ")})`);
  console.log(`   Process               : ${processMap.size}개`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
