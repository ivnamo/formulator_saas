import type { CalculationResult } from "./workspace-model";

export function formatResultPrice(resultValue: CalculationResult | null): string {
  return resultValue?.price_total == null
    ? "-"
    : `${resultValue.price_total.toFixed(2)} ${resultValue.currency}/kg`;
}

export function normalizeWarningSeverity(
  warning: CalculationResult["warnings"][number],
): "blocker" | "warning" | "info" {
  if (
    warning.severity === "blocker" ||
    warning.severity === "warning" ||
    warning.severity === "info"
  ) {
    return warning.severity;
  }
  if (warning.code.endsWith("_blocker")) {
    return "blocker";
  }
  if (warning.code.endsWith("_info")) {
    return "info";
  }
  return "warning";
}

export function formatOptionalValue(value: number | null, unit: string | null = null): string {
  if (value === null) {
    return "-";
  }
  if (unit === "%") {
    return `${value.toFixed(2)}%`;
  }
  return `${value.toFixed(2)}${unit ? ` ${unit}` : ""}`;
}

export function formatSignedDelta(value: number | null, suffix = ""): string {
  if (value === null) {
    return "-";
  }
  const normalized = Math.abs(value) < 0.005 ? 0 : value;
  const sign = normalized > 0 ? "+" : "";
  return `${sign}${normalized.toFixed(2)}${suffix}`;
}

export function formatSignedInteger(value: number): string {
  return `${value > 0 ? "+" : ""}${value}`;
}
