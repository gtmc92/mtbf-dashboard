import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  const batches = await prisma.uploadBatch.findMany({
    orderBy: { uploadedAt: "desc" },
    take: 50,
    select: {
      id: true,
      fileName: true,
      applyMode: true,
      status: true,
      periodStartYear: true,
      periodStartMonth: true,
      periodEndYear: true,
      periodEndMonth: true,
      rowCount: true,
      errorCount: true,
      warningCount: true,
      uploadedAt: true,
      appliedAt: true,
      revertedAt: true,
    },
  });
  return NextResponse.json(batches);
}
