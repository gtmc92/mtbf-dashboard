// CSV 텍스트 파서 (prisma/seed.ts의 quoted-CSV 파서 로직을 버퍼 입력용으로 이식)

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

export function parseCsvText(content: string): { headers: string[]; rows: string[][] } {
  let text = content;
  if (text.charCodeAt(0) === 0xfeff) text = text.slice(1); // BOM 제거
  const lines = text.split(/\r?\n/).filter((l) => l.trim() !== "");
  if (lines.length === 0) return { headers: [], rows: [] };
  const headers = parseCsvLine(lines[0]).map((h) => h.trim());
  const rows = lines.slice(1).map((l) => parseCsvLine(l));
  return { headers, rows };
}
