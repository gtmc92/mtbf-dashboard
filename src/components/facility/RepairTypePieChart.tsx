"use client";

import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

interface RepairTypeStat {
  repairType: string;
  count: number;
  durationMin: number;
}

const COLORS: Record<string, string> = {
  보전수리: "#3b82f6",
  휴무수리: "#f59e0b",
  가동수리: "#10b981",
  정지수리: "#ef4444",
  일반제작: "#6366f1",
  개발작업: "#8b5cf6",
  유지보수: "#64748b",
};
const FALLBACK_COLORS = ["#8b5cf6", "#06b6d4", "#f97316", "#84cc16"];

export function RepairTypePieChart({ data }: { data: RepairTypeStat[] }) {
  if (!data.length) return <p className="text-center text-gray-400 text-sm py-10">데이터 없음</p>;

  const total = data.reduce((s, d) => s + d.count, 0);

  const renderLabel = ({
    cx, cy, midAngle, innerRadius, outerRadius, percent,
  }: any) => {
    if (percent < 0.05) return null;
    const RADIAN = Math.PI / 180;
    const r = innerRadius + (outerRadius - innerRadius) * 0.55;
    const x = cx + r * Math.cos(-midAngle * RADIAN);
    const y = cy + r * Math.sin(-midAngle * RADIAN);
    return (
      <text x={x} y={y} fill="white" textAnchor="middle" dominantBaseline="central" fontSize={12} fontWeight={600}>
        {`${(percent * 100).toFixed(0)}%`}
      </text>
    );
  };

  return (
    <div className="flex items-center justify-center gap-6">
      <ResponsiveContainer width={220} height={260}>
        <PieChart>
          <Pie
            data={data}
            dataKey="count"
            nameKey="repairType"
            cx="50%"
            cy="50%"
            innerRadius={60}
            outerRadius={100}
            labelLine={false}
            label={renderLabel}
          >
            {data.map((entry, i) => (
              <Cell
                key={entry.repairType}
                fill={COLORS[entry.repairType] ?? FALLBACK_COLORS[i % FALLBACK_COLORS.length]}
              />
            ))}
          </Pie>
          <Tooltip
            formatter={(value, name) => [
              `${Number(value).toLocaleString()}건 (${((Number(value) / total) * 100).toFixed(1)}%)`,
              name,
            ]}
          />
        </PieChart>
      </ResponsiveContainer>
      <ul className="flex flex-col gap-1.5">
        {data.map((entry, i) => (
          <li key={entry.repairType} className="flex items-center gap-2 text-sm text-gray-700">
            <span
              className="inline-block w-3 h-3 rounded-sm flex-shrink-0"
              style={{ backgroundColor: COLORS[entry.repairType] ?? FALLBACK_COLORS[i % FALLBACK_COLORS.length] }}
            />
            {entry.repairType}
          </li>
        ))}
      </ul>
    </div>
  );
}
