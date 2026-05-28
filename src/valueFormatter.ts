type JsonObject = { [key: string]: unknown };

export function formatTokenValue(value: unknown): string {
  if (typeof value === "string") return value;
  if (typeof value === "number") return String(value);
  if (Array.isArray(value)) {
    if (isCubicBezier(value)) return `cubic-bezier(${value.join(", ")})`;
    if (value.length > 0 && isShadowObject(value[0])) {
      return value.map((s) => formatShadow(s as JsonObject)).join(", ");
    }
    return JSON.stringify(value);
  }
  if (!isObject(value)) return JSON.stringify(value);
  if (isDimension(value)) return `${value.value}${value.unit}`;
  if (isOklchColor(value)) {
    const [l, c, h] = value.components;
    const base = `oklch(${l} ${c} ${h})`;
    return value.alpha < 1 ? `oklch(${l} ${c} ${h} / ${value.alpha})` : base;
  }
  if (isShadowObject(value)) return formatShadow(value);
  if (isBorder(value)) return `${formatDim(value.width)} ${value.style} ${value.color}`;
  if (isTransition(value)) {
    const delay = value.delay ? ` ${formatDim(value.delay)}` : "";
    return `${formatDim(value.duration)} ${value.timingFunction}${delay}`;
  }
  return JSON.stringify(value);
}

function formatShadow(v: JsonObject): string {
  const inset = v.inset === true ? "inset " : "";
  return `${inset}${formatDim(v.offsetX)} ${formatDim(v.offsetY)} ${formatDim(v.blur)} ${formatDim(v.spread)} ${v.color}`;
}

function formatDim(v: unknown): string {
  if (typeof v === "string") return v;
  if (isObject(v) && isDimension(v)) return `${v.value}${v.unit}`;
  return String(v);
}

function isObject(v: unknown): v is JsonObject {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}

function isDimension(v: JsonObject): v is { value: string | number; unit: string } {
  return "value" in v && "unit" in v && Object.keys(v).length === 2;
}

function isOklchColor(
  v: JsonObject,
): v is { colorSpace: string; components: number[]; alpha: number; hex: string } {
  return "colorSpace" in v && "components" in v && "alpha" in v;
}

export function extractSwatchColor(value: unknown): string | undefined {
  if (!isObject(value)) return undefined;
  if (isOklchColor(value)) return value.hex;
  return undefined;
}

function isShadowObject(v: unknown): v is JsonObject {
  return (
    isObject(v) && "offsetX" in v && "offsetY" in v && "blur" in v && "spread" in v && "color" in v
  );
}

function isBorder(v: JsonObject): v is { width: unknown; style: string; color: string } {
  return "width" in v && "style" in v && "color" in v && !("offsetX" in v);
}

function isTransition(
  v: JsonObject,
): v is { duration: unknown; timingFunction: string; delay?: unknown } {
  return "duration" in v && "timingFunction" in v;
}

function isCubicBezier(v: unknown[]): v is [number, number, number, number] {
  return v.length === 4 && v.every((n) => typeof n === "number");
}
