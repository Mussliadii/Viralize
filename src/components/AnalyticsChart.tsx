"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

export interface AnalyticsSnapshotData {
  views: number;
  likes: number;
  comments: number;
  recordedAt: string;
}

const compactFormatter = new Intl.NumberFormat(undefined, {
  notation: "compact",
  maximumFractionDigits: 1,
});

export function AnalyticsChart({
  snapshots,
}: {
  snapshots: AnalyticsSnapshotData[];
}) {
  const data = snapshots.map((s) => ({
    time: new Date(s.recordedAt).toLocaleString(undefined, {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }),
    views: s.views,
    likes: s.likes,
    comments: s.comments,
  }));

  return (
    <div className="rounded-card border border-border bg-card p-4 shadow-card">
      <div className="h-72 w-full font-mono">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={data}
            margin={{ top: 8, right: 16, left: 4, bottom: 8 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#E8F1F6" />
            <XAxis
              dataKey="time"
              tick={{ fontSize: 11, fontFamily: "var(--font-mono)" }}
              stroke="#64748B"
            />
            <YAxis
              tick={{ fontSize: 11, fontFamily: "var(--font-mono)" }}
              stroke="#64748B"
              width={48}
              tickFormatter={(value: number) => compactFormatter.format(value)}
            />
            <Tooltip
              formatter={(value) =>
                typeof value === "number" ? value.toLocaleString() : value
              }
              contentStyle={{
                fontFamily: "var(--font-mono)",
                fontSize: 12,
                borderRadius: 12,
                border: "1px solid #A5F3FC",
              }}
            />
            <Legend wrapperStyle={{ fontFamily: "var(--font-body)" }} />
            <Line
              type="monotone"
              dataKey="views"
              name="Views"
              stroke="#0891B2"
              strokeWidth={2}
              dot={{ r: 3 }}
            />
            <Line
              type="monotone"
              dataKey="likes"
              name="Likes"
              stroke="#059669"
              strokeWidth={2}
              strokeDasharray="6 3"
              dot={{ r: 3 }}
            />
            <Line
              type="monotone"
              dataKey="comments"
              name="Comments"
              stroke="#22D3EE"
              strokeWidth={2}
              strokeDasharray="2 3"
              dot={{ r: 3 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
