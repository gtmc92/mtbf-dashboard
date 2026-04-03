import { PrismaClient } from "@prisma/client";
import * as fs from "fs";
import * as path from "path";

const prisma = new PrismaClient();

// ─── 유틸 ────────────────────────────────────────────────────────────────────

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

/** 따옴표 포함 CSV 행 파싱 (quoted field, "" 이스케이프 처리) */
function parseCsvLine(line: string): string[] {
  const result: string[] = [];
  let current = "";
  let inQuotes = false;
  let i = 0;
  while (i < line.length) {
    const ch = line[i];
    if (inQuotes) {
      if (ch === '"') {
        if (i + 1 < line.length && line[i + 1] === '"') {
          current += '"';
          i += 2;
        } else {
          inQuotes = false;
          i++;
        }
      } else {
        current += ch;
        i++;
      }
    } else {
      if (ch === '"') {
        inQuotes = true;
        i++;
      } else if (ch === ",") {
        result.push(current);
        current = "";
        i++;
      } else {
        current += ch;
        i++;
      }
    }
  }
  result.push(current);
  return result;
}

function readCsv(csvPath: string): { headers: string[]; rows: string[][] } {
  if (!fs.existsSync(csvPath)) {
    throw new Error(`CSV 파일을 찾을 수 없습니다: ${csvPath}`);
  }
  let content = fs.readFileSync(csvPath, "utf-8");
  if (content.charCodeAt(0) === 0xfeff) content = content.slice(1); // BOM 제거
  const lines = content.split(/\r?\n/).filter((l) => l.trim() !== "");
  const headers = parseCsvLine(lines[0]).map((h) => h.trim());
  const rows = lines.slice(1).map((l) => parseCsvLine(l));
  return { headers, rows };
}

function buildHeaderMap(headers: string[]): Record<string, number> {
  const map: Record<string, number> = {};
  headers.forEach((h, i) => { map[h] = i; });
  return map;
}

function requireColumns(map: Record<string, number>, cols: string[], csvName: string) {
  for (const col of cols) {
    if (map[col] === undefined) throw new Error(`[${csvName}] 필수 컬럼 없음: "${col}"`);
  }
}

// ─── PTEAM ────────────────────────────────────────────────────────────────────

interface PTeamRow {
  year: number;
  factory: string;
  process: string;
  month: number;
  operatingTime: number | null;
  stopCount: number;
  stopTime: number | null;
}

function loadPTeamRows(csvPath: string): PTeamRow[] {
  const { headers, rows } = readCsv(csvPath);
  const H = buildHeaderMap(headers);
  requireColumns(H, ["연도", "공장", "공정", "월", "가동시간", "정지횟수", "정지시간"], "DATA_PTEAM.csv");

  const result: PTeamRow[] = [];
  rows.forEach((cols, i) => {
    const year = parseNumber(cols[H["연도"]] ?? "");
    const factory = parseString(cols[H["공장"]] ?? "");
    const process = parseString(cols[H["공정"]] ?? "");
    const month = parseNumber(cols[H["월"]] ?? "");
    if (year === null || month === null || !factory || !process) {
      console.warn(`  ⚠️  PTEAM row ${i + 2} 건너뜀 (필수값 없음)`);
      return;
    }
    const operatingTime = parseNumber(cols[H["가동시간"]] ?? "");
    const stopCountRaw = parseNumber(cols[H["정지횟수"]] ?? "");
    // operatingTime과 stopCount가 모두 null이면 미입력(미래) 행 → skip
    if (operatingTime === null && stopCountRaw === null) {
      return;
    }
    result.push({
      year,
      factory,
      process,
      month,
      operatingTime,
      stopCount: stopCountRaw ?? 0,
      stopTime: parseNumber(cols[H["정지시간"]] ?? ""),
    });
  });
  return result;
}

async function getOrCreateFactory(name: string) {
  return prisma.factory.upsert({ where: { name }, update: {}, create: { name } });
}

async function getOrCreateProcess(name: string, factoryId: number) {
  return prisma.process.upsert({
    where: { factoryId_name: { factoryId, name } },
    update: {},
    create: { name, factoryId },
  });
}

// ─── BASE (시설 사고/수리 원장) ───────────────────────────────────────────────

function loadBaseRows(csvPath: string) {
  const { headers, rows } = readCsv(csvPath);
  const H = buildHeaderMap(headers);
  requireColumns(H, ["NO", "년도", "월", "일", "대표설비"], "DATA_BASE.csv");

  return rows.map((cols) => ({
    no:              parseNumber(cols[H["NO"]] ?? "") ?? 0,
    year:            parseNumber(cols[H["년도"]] ?? "") ?? 0,
    month:           parseNumber(cols[H["월"]] ?? "") ?? 0,
    day:             parseNumber(cols[H["일"]] ?? "") ?? 0,
    startTime:       parseString(cols[H["시작"]] ?? "") || null,
    endTime:         parseString(cols[H["마감"]] ?? "") || null,
    durationMin:     parseNumber(cols[H["시간(분)"]] ?? ""),
    equipment:       parseString(cols[H["대표설비"]] ?? ""),
    subEquipment:    parseString(cols[H["구성설비"]] ?? "") || null,
    repairItem:      parseString(cols[H["수리항목"]] ?? "") || null,
    incidentType:    parseString(cols[H["사고분류"]] ?? "") || null,
    description:     parseString(cols[H["사고 처리 내용"]] ?? "") || null,
    offRepairCount:  parseNumber(cols[H["휴무수리 건수"]] ?? ""),
    offRepairTime:   parseNumber(cols[H["휴무수리 시간"]] ?? ""),
    pmRepairCount:   parseNumber(cols[H["보전수리 건수"]] ?? ""),
    pmRepairTime:    parseNumber(cols[H["보전수리 시간"]] ?? ""),
    runRepairCount:  parseNumber(cols[H["가동수리 건수"]] ?? ""),
    runRepairTime:   parseNumber(cols[H["가동수리 시간"]] ?? ""),
    stopRepairCount: parseNumber(cols[H["정지수리 건수"]] ?? ""),
    stopRepairTime:  parseNumber(cols[H["정지수리 시간"]] ?? ""),
    cause:           parseString(cols[H["원인"]] ?? "") || null,
    technician:      parseString(cols[H["조치자"]] ?? "") || null,
    technicianCount: parseNumber(cols[H["조치인원"]] ?? ""),
    repairTime:      parseNumber(cols[H["수리시간"]] ?? ""),
    quarter:         parseString(cols[H["분기"]] ?? "") || null,
    yearMonth:       parseString(cols[H["연월"]] ?? "") || null,
  }));
}

// ─── TYPE (수리유형 집계) ─────────────────────────────────────────────────────

function loadTypeRows(csvPath: string) {
  const { headers, rows } = readCsv(csvPath);
  const H = buildHeaderMap(headers);
  requireColumns(H, ["NO", "년도", "월", "일", "대표설비"], "DATA_TYPE.csv");

  return rows.map((cols) => ({
    no:              parseNumber(cols[H["NO"]] ?? "") ?? 0,
    year:            parseNumber(cols[H["년도"]] ?? "") ?? 0,
    month:           parseNumber(cols[H["월"]] ?? "") ?? 0,
    day:             parseNumber(cols[H["일"]] ?? "") ?? 0,
    equipment:       parseString(cols[H["대표설비"]] ?? ""),
    subEquipment:    parseString(cols[H["구성설비"]] ?? "") || null,
    repairItem:      parseString(cols[H["수리항목"]] ?? "") || null,
    incidentType:    parseString(cols[H["사고분류"]] ?? "") || null,
    description:     parseString(cols[H["사고 처리 내용"]] ?? "") || null,
    cause:           parseString(cols[H["원인"]] ?? "") || null,
    technician:      parseString(cols[H["조치자"]] ?? "") || null,
    technicianCount: parseNumber(cols[H["조치인원"]] ?? ""),
    repairTime:      parseNumber(cols[H["수리시간"]] ?? ""),
    repairType:      parseString(cols[H["수리유형"]] ?? "") || null,
    count:           parseNumber(cols[H["건수"]] ?? ""),
    durationMin:     parseNumber(cols[H["시간(분)"]] ?? ""),
    managementType:  parseString(cols[H["관리구분"]] ?? "") || null,
    quarter:         parseString(cols[H["분기"]] ?? "") || null,
  }));
}

// ─── main ─────────────────────────────────────────────────────────────────────

async function main() {
  // ── 1. 삭제 (외래키 순서 준수) ──
  console.log("🗑️  기존 데이터 삭제 중...");
  const delType     = await prisma.repairTypeRecord.deleteMany();
  const delBase     = await prisma.incidentRecord.deleteMany();
  const delRecords  = await prisma.monthlyRecord.deleteMany();
  const delProcesses = await prisma.process.deleteMany();
  const delFactories = await prisma.factory.deleteMany();
  console.log(
    `   RepairTypeRecord ${delType.count}건, IncidentRecord ${delBase.count}건, ` +
    `MonthlyRecord ${delRecords.count}건, Process ${delProcesses.count}건, Factory ${delFactories.count}건 삭제 완료`
  );

  // ══ PTEAM ══════════════════════════════════════════════════════════════════
  console.log("\n━━━ [1/3] DATA_PTEAM.csv (생산 KPI) ━━━");
  const pteamRows = loadPTeamRows("D:\\DATA_BASE\\DATA_PTEAM.csv");
  console.log(`📄 ${pteamRows.length}행 로드`);

  const factoryNames = [...new Set(pteamRows.map((r) => r.factory))];
  const factoryMap = new Map<string, number>();
  for (const name of factoryNames) {
    const f = await getOrCreateFactory(name);
    factoryMap.set(name, f.id);
  }
  console.log(`🏭 Factory: ${factoryMap.size}개 (${[...factoryMap.keys()].join(", ")})`);

  const processMap = new Map<string, number>();
  const processPairs = [...new Map(pteamRows.map((r) => [`${r.factory}::${r.process}`, r])).values()];
  for (const row of processPairs) {
    const factoryId = factoryMap.get(row.factory)!;
    const proc = await getOrCreateProcess(row.process, factoryId);
    processMap.set(`${row.factory}::${row.process}`, proc.id);
  }
  console.log(`⚙️  Process: ${processMap.size}개`);

  // 중복 제거
  const dedupMap = new Map<string, typeof pteamRows[0]>();
  for (const row of pteamRows) {
    dedupMap.set(`${row.factory}::${row.process}::${row.year}::${row.month}`, row);
  }
  const uniqueRows = [...dedupMap.values()];
  if (uniqueRows.length < pteamRows.length) {
    console.log(`⚠️  중복 제거: ${pteamRows.length - uniqueRows.length}건 → ${uniqueRows.length}건 삽입`);
  }

  let pteamInserted = 0;
  for (const row of uniqueRows) {
    const processId = processMap.get(`${row.factory}::${row.process}`)!;
    const mtbf = row.stopCount > 0 && row.operatingTime !== null ? row.operatingTime / row.stopCount : null;
    const mttr = row.stopCount > 0 && row.stopTime !== null ? row.stopTime / row.stopCount : null;
    await prisma.monthlyRecord.create({
      data: { processId, year: row.year, month: row.month, operatingTime: row.operatingTime, stopCount: row.stopCount, stopTime: row.stopTime, mtbf, mttr },
    });
    pteamInserted++;
  }
  console.log(`✅ MonthlyRecord ${pteamInserted}건 반영 완료`);

  // ══ BASE ═══════════════════════════════════════════════════════════════════
  console.log("\n━━━ [2/3] DATA_BASE.csv (시설 사고/수리 원장) ━━━");
  const baseRows = loadBaseRows("D:\\DATA_BASE\\DATA_BASE.csv");
  console.log(`📄 ${baseRows.length}행 로드`);
  await prisma.incidentRecord.createMany({ data: baseRows });
  console.log(`✅ IncidentRecord ${baseRows.length}건 반영 완료`);

  // ══ TYPE ═══════════════════════════════════════════════════════════════════
  console.log("\n━━━ [3/3] DATA_TYPE.csv (수리유형 집계) ━━━");
  const typeRows = loadTypeRows("D:\\DATA_BASE\\DATA_TYPE.csv");
  console.log(`📄 ${typeRows.length}행 로드`);
  await prisma.repairTypeRecord.createMany({ data: typeRows });
  console.log(`✅ RepairTypeRecord ${typeRows.length}건 반영 완료`);

  // ══ 최종 요약 ══════════════════════════════════════════════════════════════
  console.log("\n══════════════════════════════════════");
  console.log("✅ 전체 Seed 완료");
  console.log(`   MonthlyRecord   : ${pteamInserted}건`);
  console.log(`   IncidentRecord  : ${baseRows.length}건`);
  console.log(`   RepairTypeRecord: ${typeRows.length}건`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
