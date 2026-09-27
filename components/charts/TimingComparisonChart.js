"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import getCssVar from "@/lib/getCssVar";
import { formatDuration } from "@/lib/formatters";

const TOOLTIP_STYLE = {
  background: "var(--pe-color-bg-primary)",
  border: "1px solid var(--pe-color-border-light)",
  borderRadius: 12,
  padding: "8px 12px",
};

export default function TimingComparisonChart({ result }) {
  const primaryColor = getCssVar("--pe-color-primary-500");
  const darkTeal = getCssVar("--pe-color-primary-900");
  const gridColor = getCssVar("--pe-color-gray-200");
  const fontFamily = getCssVar("--pe-font-family-primary");

  const data = [
    {
      label: "Baseline setup",
      seconds: result.creation.baseline.elapsedSeconds,
      fill: primaryColor,
    },
    {
      label: "Reform setup",
      seconds: result.creation.reform.elapsedSeconds,
      fill: darkTeal,
    },
    {
      label: "Baseline variable",
      seconds: result.variable.baseline.elapsedSeconds,
      fill: primaryColor,
    },
    {
      label: "Reform variable",
      seconds: result.variable.reform.elapsedSeconds,
      fill: darkTeal,
    },
  ];

  return (
    <div className="panel rounded-[1.75rem] p-5">
      <div className="mb-4">
        <h2 className="text-lg font-semibold">Timing comparison</h2>
        <p className="mt-1 text-sm text-pe-text-secondary">
          Live timings from the Python backend for setup and one selected variable.
        </p>
      </div>
      <div className="h-[320px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 12, right: 12, left: 4, bottom: 12 }}>
            <CartesianGrid stroke={gridColor} vertical={false} />
            <XAxis
              dataKey="label"
              tick={{ fontSize: 12, fontFamily }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              niceTicks
              domain={["auto", "auto"]}
              tick={{ fontSize: 12, fontFamily }}
              tickFormatter={(value) => formatDuration(value)}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip
              contentStyle={TOOLTIP_STYLE}
              separator=": "
              formatter={(value) => [formatDuration(Number(value)), "Duration"]}
            />
            <Bar
              dataKey="seconds"
              radius={[16, 16, 0, 0]}
              fill="var(--pe-color-primary-500)"
              isAnimationActive={false}
            >
              {data.map((entry) => (
                <Cell key={entry.label} fill={entry.fill} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
