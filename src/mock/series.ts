import { seededRandom } from "@/lib/utils";

const MONTHS = ["Jul", "Aug", "Sep", "Oct", "Nov", "Dec", "Jan", "Feb", "Mar", "Apr", "May", "Jun"];

/** A wandering monthly series, deterministic by seed. */
export function monthlySeries(
  seed: number,
  start: number,
  drift: number,
  volatility: number,
  months = 12,
): { label: string; value: number }[] {
  const rng = seededRandom(seed);
  let v = start;
  return MONTHS.slice(-months).map((label) => {
    v = Math.max(0, v + drift + (rng() - 0.5) * volatility);
    return { label, value: Math.round(v) };
  });
}

export function costTrendSeries() {
  const rng = seededRandom(7);
  let actual = 18400;
  let target = 17800;
  return MONTHS.map((label) => {
    actual = Math.max(0, actual - 120 + (rng() - 0.5) * 600);
    target = target - 90;
    return {
      label,
      actual: Math.round(actual),
      target: Math.round(target),
    };
  });
}

export function manufacturingProgress() {
  const lines = ["Line A", "Line B", "Line C", "Line D", "Line E"];
  const rng = seededRandom(13);
  return lines.map((label) => ({
    label,
    planned: 800 + Math.floor(rng() * 400),
    actual: 600 + Math.floor(rng() * 500),
  }));
}

export function supplierPerfSeries() {
  const rng = seededRandom(29);
  return MONTHS.map((label) => ({
    label,
    onTime: 78 + Math.floor(rng() * 20),
    quality: 88 + Math.floor(rng() * 11),
  }));
}

export function utilizationHeatmap() {
  const rng = seededRandom(41);
  const machines = ["CNC-01", "CNC-02", "Mill-03", "Lathe-04", "EDM-05", "Press-06", "Weld-07", "Paint-08"];
  const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  return machines.map((m) => ({
    machine: m,
    cells: days.map((d) => ({ day: d, value: Math.floor(rng() * 100) })),
  }));
}
