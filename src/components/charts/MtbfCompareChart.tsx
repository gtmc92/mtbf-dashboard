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

interface Props {
  data: Array<Record<string, string | number | null>>;
  baseYear: string;
  compareYear: string;
}

interface TooltipPayloadEntry {
  dataKey: string;
  value: number | null;
  color: string;
}

function CustomTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: TooltipPayloadEntry[];
  label?: string;
}) {
  if (!active || !payload || payload.length === 0) return null;
  return (
    <div className="bg-white border border-gray-200 rounded p-2 text-xs shadow">
      <p className="font-bold mb-1">{label}</p>
      {payload.map((entry) => (
        <p key={entry.dataKey} style={{ color: entry.color }}>
          {entry.dataKey}:{" "}
          {entry.value == null
            ? "무고장 운영 / 산출 불가"
            : `${Number(entry.value).toFixed(1)} h`}
        </p>
      ))}
    </div>
  );
}

export default function MtbfCompareChart({ data, baseYear, compareYear }: Props) {
  return (
    <ResponsiveContainer width="100%" height={280}>
      <BarChart data={data} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="month" tick={{ fontSize: 11 }} />
        <YAxis tick={{ fontSize: 11 }} />
        <Tooltip content={<CustomTooltip />} />
        <Legend wrapperStyle={{ fontSize: 12 }} />
        <Bar dataKey={`${baseYear}년`} fill="#4f81bd" radius={[2, 2, 0, 0]} />
        <Bar dataKey={`${compareYear}년`} fill="#f79646" radius={[2, 2, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}
