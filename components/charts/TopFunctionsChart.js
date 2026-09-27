"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import getCssVar from "@/lib/getCssVar";
import { formatCompactNumber, formatDuration } from "@/lib/formatters";

const TOOLTIP_STYLE = {
  background: "var(--pe-color-bg-primary)",
  border: "1px solid var(--pe-color-border-light)",
  borderRadius: 12,
  padding: "8px 12px",
};

function truncateLabel(label) {
  return label.length > 34 ? `${label.slice(0, 34)}…` : label;
}

export default function TopFunctionsChart({ rows, title, description }) {
  const primaryColor = getCssVar("--pe-color-primary-500");
  const gridColor = getCssVar("--pe-color-gray-200");
  const fontFamily = getCssVar("--pe-font-family-primary");

  return (
    <div className="panel rounded-[1.75rem] p-5">
      <div className="mb-4">
        <h2 className="text-lg font-semibold">{title}</h2>
        <p className="mt-1 text-sm text-pe-text-secondary">{description}</p>
      </div>
      <div className="h-[360px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={rows}
            layout="vertical"
            margin={{ top: 4, right: 18, left: 12, bottom: 4 }}
          >
            <CartesianGrid stroke={gridColor} horizontal={false} />
            <XAxis
              type="number"
              niceTicks
              domain={["auto", "auto"]}
              tick={{ fontSize: 12, fontFamily }}
              tickFormatter={(value) => formatDuration(Number(value))}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              type="category"
              dataKey="label"
              width={180}
              tick={{ fontSize: 12, fontFamily }}
              tickFormatter={truncateLabel}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip
              contentStyle={TOOLTIP_STYLE}
              separator=": "
              formatter={(value, name, item) => {
                if (name === "cumulativeSeconds") {
                  return [formatDuration(Number(value)), "Cumulative time"];
                }

                return [formatCompactNumber(Number(value)), "Calls"];
              }}
              labelFormatter={(_, payload) => payload?.[0]?.payload?.label || ""}
            />
            <Bar
              dataKey="cumulativeSeconds"
              fill={primaryColor}
              radius={[0, 12, 12, 0]}
              isAnimationActive={false}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
