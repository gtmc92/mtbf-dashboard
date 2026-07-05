import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const HEADERS = [
  "수리일",
  "대표설비",
  "구성설비",
  "수리유형",
  "사고분류",
  "사고 처리 내용",
  "원인",
  "조치자",
  "조치인원",
  "수리시작시분",
  "수리완료시분",
  "수리항목",
];

const SAMPLE_ROWS = [
  ["2026-06-01", "F2_54인치", "기타", "보전수리", "기계", "베어링 교체", "마모", "홍길동", "1", "08:00", "09:30", "보전수리"],
  ["2026-06-02", "F2", "C동", "정지수리", "전기", "제어반 점검 및 수리", "누전", "김철수", "2", "22:00", "02:00", "정지수리"],
  ["2026-06-03", "F2", "공통설비", "제작설치", "기계", "신규 지그 제작 및 설치", "설비개선", "최영수", "1", "09:00", "11:00", "제작설치"],
];

function toCsvField(v: string): string {
  if (/[",\n]/.test(v)) return `"${v.replace(/"/g, '""')}"`;
  return v;
}

export async function GET() {
  const lines = [HEADERS, ...SAMPLE_ROWS].map((row) => row.map(toCsvField).join(","));
  const csv = "﻿" + lines.join("\r\n") + "\r\n";

  return new NextResponse(csv, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": 'attachment; filename="raw_upload_template.csv"',
    },
  });
}
