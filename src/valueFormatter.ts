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
	return formatObject(value);
}

function formatObject(v: JsonObject): string {
	if (isDimension(v)) return `${v.value}${v.unit}`;
	if (isOklchColor(v)) {
		const [l, c, h] = v.components;
		const base = `oklch(${l} ${c} ${h})`;
		return v.alpha < 1 ? `oklch(${l} ${c} ${h} / ${v.alpha})` : base;
	}
	if (isShadowObject(v)) return formatShadow(v);
	if (isBorder(v)) {
		const b = v as { width: unknown; style: string; color: string };
		return `${formatDim(b.width)} ${b.style} ${b.color}`;
	}
	if (isTransition(v)) {
		const t = v as { duration: unknown; timingFunction: string; delay?: unknown };
		const delay = t.delay ? ` ${formatDim(t.delay)}` : "";
		return `${formatDim(t.duration)} ${t.timingFunction}${delay}`;
	}
	return JSON.stringify(v);
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

function isBorder(v: JsonObject): boolean {
	return "width" in v && "style" in v && "color" in v && !("offsetX" in v);
}

function isTransition(v: JsonObject): boolean {
	return "duration" in v && "timingFunction" in v;
}

function isCubicBezier(v: unknown[]): v is [number, number, number, number] {
	return v.length === 4 && v.every((n) => typeof n === "number");
}
