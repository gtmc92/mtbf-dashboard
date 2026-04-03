import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  const currentYear = new Date().getFullYear();
  const rows = await prisma.monthlyRecord.findMany({
    select: { year: true },
    distinct: ["year"],
    where: { year: { lte: currentYear } },
    orderBy: { year: "asc" },
  });
  const years = rows.map((r) => r.year);
  return NextResponse.json(years);
}
