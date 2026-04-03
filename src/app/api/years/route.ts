import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

const ALLOWED_YEARS = { gte: 2024, lte: 2026 };

export async function GET() {
  const rows = await prisma.monthlyRecord.findMany({
    select: { year: true },
    distinct: ["year"],
    where: { year: ALLOWED_YEARS },
    orderBy: { year: "asc" },
  });
  const years = rows.map((r) => r.year);
  return NextResponse.json(years);
}
