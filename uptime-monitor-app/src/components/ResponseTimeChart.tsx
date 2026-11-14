
"use client";

import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";

interface HealthCheck {
  id: string;
  status: string;
  responseTime: number | null;
  checkedAt: string;
}

export default function ResponseTimeChart({
  checks,
}: {
  checks: HealthCheck[];
}) {
  const data = checks.map((check) => ({
    time: new Date(check.checkedAt).toLocaleString(),
    responseTime: check.responseTime,
    status: check.status,
  }));

  if (data.length === 0) {
    return (
      <p className="py-16 text-center text-slate-400">
        No monitoring history available yet.
      </p>
    );
  }

  return (
    <div className="h-80 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart
          data={data}
          margin={{ top: 10, right: 20, bottom: 10, left: 0 }}
        >
          <CartesianGrid
            stroke="#334155"
            strokeDasharray="3 3"
          />

          <XAxis
            dataKey="time"
            stroke="#94a3b8"
            tick={{ fontSize: 11 }}
            minTickGap={50}
          />

          <YAxis
            stroke="#94a3b8"
            tick={{ fontSize: 12 }}
            unit="ms"
          />

          <Tooltip
            contentStyle={{
              backgroundColor: "#0f172a",
              border: "1px solid #334155",
              borderRadius: "8px",
            }}
            labelStyle={{ color: "#e2e8f0" }}
          />

          <Line
            type="monotone"
            dataKey="responseTime"
            stroke="#22c55e"
            strokeWidth={2}
            dot={false}
            connectNulls={false}
            name="Response Time"
            unit="ms"
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
