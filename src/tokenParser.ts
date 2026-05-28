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

export function parseTokenFile(json: unknown): Map<string, ParsedToken> {
	const result = new Map<string, ParsedToken>();
	walk(json as DtcgNode, [], "", result);
	return result;
}

function walk(
	node: DtcgNode,
	path: string[],
	inheritedType: string,
	result: Map<string, ParsedToken>,
): void {
	const type = (node.$type as string | undefined) ?? inheritedType;

	if ("$value" in node) {
		const dotPath = path.join(".");
		result.set(dotPath, {
			dotPath,
			cssVar: "--" + path.join("-"),
			type,
			rawValue: formatTokenValue(node.$value),
			swatchColor: extractSwatchColor(node.$value),
			description: node.$description as string | undefined,
		});
		return;
	}

	for (const key of Object.keys(node)) {
		if (key.startsWith("$")) continue;
		walk(node[key] as DtcgNode, [...path, key], type, result);
	}
}
