import ExcelJS from "exceljs";
import { parseCsvText } from "./csv";
import type { ParsedFile, RawCell } from "./types";

function cellValueToRaw(value: ExcelJS.CellValue): RawCell {
  if (value === null || value === undefined) return null;
  if (value instanceof Date) return value;
  if (typeof value === "number" || typeof value === "string") return value;
  if (typeof value === "object") {
    const v = value as { result?: unknown; text?: unknown; richText?: { text: string }[] };
    if (v.result !== undefined) return cellValueToRaw(v.result as ExcelJS.CellValue);
    if (Array.isArray(v.richText)) return v.richText.map((t) => t.text).join("");
    if (typeof v.text === "string") return v.text;
  }
  return String(value);
}

async function parseXlsx(buffer: Buffer): Promise<ParsedFile> {
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(buffer as unknown as ArrayBuffer);
  const worksheet = workbook.worksheets[0];
  if (!worksheet) return { headers: [], rows: [] };

  const headerRow = worksheet.getRow(1);
  const colCount = Math.max(headerRow.actualCellCount, worksheet.actualColumnCount);
  const headers: string[] = [];
  for (let c = 1; c <= colCount; c++) {
    const v = cellValueToRaw(headerRow.getCell(c).value);
    headers.push(v === null ? "" : String(v).trim());
  }

  const rows: RawCell[][] = [];
  worksheet.eachRow((row, rowNumber) => {
    if (rowNumber === 1) return;
    const cells: RawCell[] = [];
    for (let c = 1; c <= colCount; c++) {
      cells.push(cellValueToRaw(row.getCell(c).value));
    }
    rows.push(cells);
  });

  return { headers, rows };
}

export async function parseUploadedFile(buffer: Buffer, fileName: string): Promise<ParsedFile> {
  const ext = fileName.toLowerCase().split(".").pop();
  if (ext === "xlsx") {
    return parseXlsx(buffer);
  }
  if (ext === "csv") {
    const text = buffer.toString("utf-8");
    const { headers, rows } = parseCsvText(text);
    return { headers, rows };
  }
  throw new Error(`지원하지 않는 파일 형식입니다: .${ext}`);
}
