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

interface ManagementTypeStat {
  managementType: string;
  count: number;
  durationMin: number;
}

export function PreventiveReactiveChart({ data }: { data: ManagementTypeStat[] }) {
  if (!data.length) return <p className="text-center text-gray-400 text-sm py-10">데이터 없음</p>;

  const chartData = data.map((d) => ({
    name: d.managementType ?? "미분류",
    건수: d.count,
    시간: Math.round(d.durationMin / 60), // 분 → 시간
  }));

  return (
    <ResponsiveContainer width="100%" height={260}>
      <BarChart data={chartData} barCategoryGap="40%">
        <CartesianGrid strokeDasharray="3 3" vertical={false} />
        <XAxis dataKey="name" tick={{ fontSize: 12 }} />
        <YAxis yAxisId="left" orientation="left" tick={{ fontSize: 11 }} />
        <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 11 }} />
        <Tooltip
          formatter={(value, name) =>
            name === "시간"
              ? [`${Number(value).toLocaleString()}h`, name]
              : [`${Number(value).toLocaleString()}건`, name]
          }
        />
        <Legend />
        <Bar yAxisId="left" dataKey="건수" fill="#10b981" radius={[4, 4, 0, 0]} />
        <Bar yAxisId="right" dataKey="시간" fill="#f59e0b" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}
