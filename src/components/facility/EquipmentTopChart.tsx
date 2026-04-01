"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

interface EquipmentStat {
  equipment: string;
  incidentCount: number;
  totalDurationMin: number;
}

export function EquipmentTopChart({ data }: { data: EquipmentStat[] }) {
  if (!data.length) return <p className="text-center text-gray-400 text-sm py-10">데이터 없음</p>;

  const chartData = [...data]
    .sort((a, b) => a.incidentCount - b.incidentCount) // 가로 막대 내림차순 (아래에서 위로)
    .map((d) => ({
      name: d.equipment.replace(/^(F1_|F2_)/, ""), // 공장 prefix 제거
      fullName: d.equipment,
      건수: d.incidentCount,
      시간: Math.round(d.totalDurationMin / 60),
    }));

  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart layout="vertical" data={chartData} margin={{ left: 16 }}>
        <CartesianGrid strokeDasharray="3 3" horizontal={false} />
        <XAxis type="number" tick={{ fontSize: 11 }} />
        <YAxis dataKey="name" type="category" width={90} tick={{ fontSize: 11 }} />
        <Tooltip
          formatter={(value: number, name: string) =>
            name === "시간" ? [`${value.toLocaleString()}h`, name] : [`${value.toLocaleString()}건`, name]
          }
          labelFormatter={(label) => {
            const item = chartData.find((d) => d.name === label);
            return item?.fullName ?? label;
          }}
        />
        <Bar dataKey="건수" fill="#6366f1" radius={[0, 4, 4, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}
