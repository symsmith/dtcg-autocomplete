import { formatTokenValue, extractSwatchColor } from "./valueFormatter";

export interface ParsedToken {
	dotPath: string;
	cssVar: string;
	type: string;
	rawValue: string;
	swatchColor?: string;
	description?: string;
}

type DtcgNode = {
	$value?: unknown;
	$type?: string;
	$description?: string;
	[key: string]: unknown;
};

function isObject(v: unknown): v is DtcgNode {
	return typeof v === "object" && v !== null && !Array.isArray(v);
}

export function parseTokenFile(json: unknown): Map<string, ParsedToken> {
	const result = new Map<string, ParsedToken>();
	if (isObject(json)) walk(json, [], "", result);
	return result;
}

function walk(
	node: DtcgNode,
	path: string[],
	inheritedType: string,
	result: Map<string, ParsedToken>,
): void {
	const type = node.$type ?? inheritedType;

	if ("$value" in node) {
		const dotPath = path.join(".");
		result.set(dotPath, {
			dotPath,
			cssVar: "--" + path.join("-"),
			type,
			rawValue: formatTokenValue(node.$value),
			swatchColor: extractSwatchColor(node.$value),
			description: node.$description,
		});
		return;
	}

	for (const key of Object.keys(node)) {
		if (key.startsWith("$")) continue;
		const child = node[key];
		if (!isObject(child)) continue;
		walk(child, [...path, key], type, result);
	}
}
