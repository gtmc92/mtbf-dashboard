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
  일반제작: "#6366f1",
  개발작업: "#8b5cf6",
  유지보수: "#64748b",
  미분류: "#9ca3af",
};

const LEGEND_ORDER = ["휴무수리", "보전수리", "가동수리", "정지수리", "일반제작", "개발작업", "유지보수"];

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

  const renderCustomLegend = () => {
    const ordered = LEGEND_ORDER.filter((t) => repairTypes.includes(t));
    const remaining = repairTypes.filter((t) => !LEGEND_ORDER.includes(t));
    const all = [...ordered, ...remaining];
    const row1 = all.slice(0, 4);
    const row2 = all.slice(4);

    const Item = ({ type }: { type: string }) => (
      <div className="flex items-center gap-1.5">
        <span
          className="inline-block w-3 h-3 rounded-sm flex-shrink-0"
          style={{ backgroundColor: REPAIR_COLORS[type] ?? "#9ca3af" }}
        />
        <span className="text-xs text-gray-700">{type}</span>
      </div>
    );

    return (
      <div className="flex flex-col items-center gap-1 pt-1">
        <div className="flex gap-4 flex-wrap justify-center">
          {row1.map((t) => <Item key={t} type={t} />)}
        </div>
        <div className="flex gap-4 flex-wrap justify-center">
          {row2.map((t) => <Item key={t} type={t} />)}
        </div>
      </div>
    );
  };

  return (
    <ResponsiveContainer width="100%" height={320}>
      <BarChart data={chartData} barCategoryGap="30%">
        <CartesianGrid strokeDasharray="3 3" vertical={false} />
        <XAxis dataKey="name" tick={{ fontSize: 11 }} interval={0} angle={-20} textAnchor="end" height={50} />
        <YAxis tick={{ fontSize: 11 }} />
        <Tooltip formatter={(value, name) => [`${Number(value).toLocaleString()}건`, name]} />
        <Legend content={renderCustomLegend} />
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
