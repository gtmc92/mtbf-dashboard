import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { parseUploadedFile } from "@/lib/dataUpload/parseFile";
import { transformRows } from "@/lib/dataUpload/transform";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const file = formData.get("file");
    if (!file || !(file instanceof File)) {
      return NextResponse.json({ fileErrors: ["파일이 없습니다"] }, { status: 400 });
    }

    const ext = file.name.toLowerCase().split(".").pop();
    if (ext !== "csv" && ext !== "xlsx") {
      return NextResponse.json(
        { fileErrors: ["csv 또는 xlsx 파일만 업로드할 수 있습니다"] },
        { status: 400 }
      );
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const parsed = await parseUploadedFile(buffer, file.name);

    const masters = await prisma.repairTypeMaster.findMany();
    const masterMap = new Map(masters.map((m) => [m.repairType, m.managementType]));

    const result = transformRows(parsed, masterMap);

    if (result.fileErrors.length > 0) {
      return NextResponse.json({ fileErrors: result.fileErrors }, { status: 400 });
    }
    if (result.rows.length === 0) {
      return NextResponse.json(
        { fileErrors: ["유효한 데이터 행이 없습니다"] },
        { status: 400 }
      );
    }

    const errorCount = result.rows.filter((r) => r.errors.length > 0).length;
    const warningCount = result.rows.filter((r) => r.warnings.length > 0).length;
    const validRows = result.rows.filter((r) => r.errors.length === 0 && r.data);

    let periodStartYear: number | null = null;
    let periodStartMonth: number | null = null;
    let periodEndYear: number | null = null;
    let periodEndMonth: number | null = null;
    if (validRows.length > 0) {
      const keys = validRows.map((r) => r.data!.year * 100 + r.data!.month);
      const min = Math.min(...keys);
      const max = Math.max(...keys);
      periodStartYear = Math.floor(min / 100);
      periodStartMonth = min % 100;
      periodEndYear = Math.floor(max / 100);
      periodEndMonth = max % 100;
    }

    const batch = await prisma.uploadBatch.create({
      data: {
        fileName: file.name,
        applyMode: "REPLACE_PERIOD",
        status: "PREVIEWED",
        periodStartYear,
        periodStartMonth,
        periodEndYear,
        periodEndMonth,
        rowCount: result.rows.length,
        errorCount,
        warningCount,
        stagingRows: {
          create: result.rows.map((r) => ({
            rowIndex: r.rowIndex,
            data: JSON.parse(JSON.stringify(r.data)),
            errors: r.errors,
            warnings: r.warnings,
          })),
        },
      },
    });

    return NextResponse.json({
      batchId: batch.id,
      fileName: batch.fileName,
      rowCount: batch.rowCount,
      errorCount: batch.errorCount,
      warningCount: batch.warningCount,
      canApply: errorCount === 0,
      detectedPeriod: { periodStartYear, periodStartMonth, periodEndYear, periodEndMonth },
      preview: result.rows.map((r) => ({
        rowIndex: r.rowIndex,
        data: r.data,
        errors: r.errors,
        warnings: r.warnings,
      })),
    });
  } catch (err) {
    return NextResponse.json(
      { fileErrors: ["업로드 처리 실패", String(err)] },
      { status: 500 }
    );
  }
}
