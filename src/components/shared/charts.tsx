"use client";

import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

const axisProps = {
  stroke: "hsl(var(--muted-foreground))",
  fontSize: 11,
  tickLine: false,
  axisLine: false,
} as const;

function ChartTooltip({ active, payload, label, valuePrefix = "", valueSuffix = "" }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border border-border bg-surface-overlay/95 px-3 py-2 text-xs shadow-md backdrop-blur-xl">
      {label && <p className="mb-1 font-medium text-foreground">{label}</p>}
      {payload.map((p: any, i: number) => (
        <div key={i} className="flex items-center gap-2">
          <span className="size-2 rounded-full" style={{ background: p.color || p.fill }} />
          <span className="text-muted-foreground">{p.name}:</span>
          <span className="font-semibold tabular text-foreground">
            {valuePrefix}
            {typeof p.value === "number" ? p.value.toLocaleString() : p.value}
            {valueSuffix}
          </span>
        </div>
      ))}
    </div>
  );
}

export function AreaTrend({
  data,
  dataKey = "value",
  xKey = "label",
  color = "hsl(var(--primary))",
  height = 220,
  prefix = "",
  showAxis = true,
  secondKey,
  secondColor = "hsl(var(--info))",
}: {
  data: any[];
  dataKey?: string;
  xKey?: string;
  color?: string;
  height?: number;
  prefix?: string;
  showAxis?: boolean;
  secondKey?: string;
  secondColor?: string;
}) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <AreaChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id={`grad-${dataKey}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity={0.32} />
            <stop offset="100%" stopColor={color} stopOpacity={0} />
          </linearGradient>
          {secondKey && (
            <linearGradient id={`grad-${secondKey}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={secondColor} stopOpacity={0.22} />
              <stop offset="100%" stopColor={secondColor} stopOpacity={0} />
            </linearGradient>
          )}
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
        {showAxis && <XAxis dataKey={xKey} {...axisProps} />}
        {showAxis && <YAxis {...axisProps} width={44} />}
        <Tooltip content={<ChartTooltip valuePrefix={prefix} />} cursor={{ stroke: "hsl(var(--border-strong))" }} />
        {secondKey && (
          <Area
            type="monotone"
            dataKey={secondKey}
            stroke={secondColor}
            strokeWidth={2}
            fill={`url(#grad-${secondKey})`}
          />
        )}
        <Area
          type="monotone"
          dataKey={dataKey}
          stroke={color}
          strokeWidth={2}
          fill={`url(#grad-${dataKey})`}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}

export function BarChartMini({
  data,
  dataKey = "value",
  xKey = "label",
  color = "hsl(var(--primary))",
  height = 220,
  prefix = "",
  suffix = "",
}: {
  data: any[];
  dataKey?: string;
  xKey?: string;
  color?: string;
  height?: number;
  prefix?: string;
  suffix?: string;
}) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
        <XAxis dataKey={xKey} {...axisProps} />
        <YAxis {...axisProps} width={40} />
        <Tooltip content={<ChartTooltip valuePrefix={prefix} valueSuffix={suffix} />} cursor={{ fill: "hsl(var(--accent) / 0.5)" }} />
        <Bar dataKey={dataKey} fill={color} radius={[4, 4, 0, 0]} maxBarSize={42} />
      </BarChart>
    </ResponsiveContainer>
  );
}

export function MultiBar({
  data,
  keys,
  xKey = "label",
  height = 240,
  prefix = "",
}: {
  data: any[];
  keys: { key: string; color: string; name: string }[];
  xKey?: string;
  height?: number;
  prefix?: string;
}) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
        <XAxis dataKey={xKey} {...axisProps} />
        <YAxis {...axisProps} width={44} />
        <Tooltip content={<ChartTooltip valuePrefix={prefix} />} cursor={{ fill: "hsl(var(--accent) / 0.5)" }} />
        {keys.map((k) => (
          <Bar key={k.key} dataKey={k.key} name={k.name} fill={k.color} radius={[3, 3, 0, 0]} maxBarSize={28} />
        ))}
      </BarChart>
    </ResponsiveContainer>
  );
}

export function LineTrend({
  data,
  keys,
  xKey = "label",
  height = 240,
}: {
  data: any[];
  keys: { key: string; color: string; name: string }[];
  xKey?: string;
  height?: number;
}) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <LineChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
        <XAxis dataKey={xKey} {...axisProps} />
        <YAxis {...axisProps} width={40} />
        <Tooltip content={<ChartTooltip />} cursor={{ stroke: "hsl(var(--border-strong))" }} />
        {keys.map((k) => (
          <Line
            key={k.key}
            type="monotone"
            dataKey={k.key}
            name={k.name}
            stroke={k.color}
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 4 }}
          />
        ))}
      </LineChart>
    </ResponsiveContainer>
  );
}

export function DonutChart({
  data,
  height = 220,
  innerRadius = 56,
  outerRadius = 84,
}: {
  data: { name: string; value: number; color: string }[];
  height?: number;
  innerRadius?: number;
  outerRadius?: number;
}) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <PieChart>
        <Pie
          data={data}
          dataKey="value"
          nameKey="name"
          innerRadius={innerRadius}
          outerRadius={outerRadius}
          paddingAngle={2}
          strokeWidth={0}
        >
          {data.map((d, i) => (
            <Cell key={i} fill={d.color} />
          ))}
        </Pie>
        <Tooltip content={<ChartTooltip />} />
      </PieChart>
    </ResponsiveContainer>
  );
}
