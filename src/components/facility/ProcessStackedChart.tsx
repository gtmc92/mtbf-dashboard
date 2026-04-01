"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

const REPAIR_COLORS: Record<string, string> = {
  보전수리: "#3b82f6",
  휴무수리: "#f59e0b",
  가동수리: "#10b981",
  정지수리: "#ef4444",
  미분류: "#9ca3af",
};

export function ProcessStackedChart({ data }: { data: Record<string, unknown>[] }) {
  if (!data.length) return <p className="text-center text-gray-400 text-sm py-10">데이터 없음</p>;

  // 수리유형 목록 추출
  const repairTypes = Array.from(
    new Set(
      data.flatMap((row) => Object.keys(row).filter((k) => k !== "equipment"))
    )
  );

  const chartData = data.map((row) => ({
    ...row,
    name: String(row.equipment ?? "").replace(/^(F1_|F2_)/, ""),
  }));

  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={chartData} barCategoryGap="30%">
        <CartesianGrid strokeDasharray="3 3" vertical={false} />
        <XAxis dataKey="name" tick={{ fontSize: 11 }} interval={0} angle={-20} textAnchor="end" height={50} />
        <YAxis tick={{ fontSize: 11 }} />
        <Tooltip formatter={(value: number, name: string) => [`${value.toLocaleString()}건`, name]} />
        <Legend />
        {repairTypes.map((type) => (
          <Bar
            key={type}
            dataKey={type}
            stackId="a"
            fill={REPAIR_COLORS[type] ?? "#9ca3af"}
            radius={repairTypes.indexOf(type) === repairTypes.length - 1 ? [4, 4, 0, 0] : undefined}
          />
        ))}
      </BarChart>
    </ResponsiveContainer>
  );
}
