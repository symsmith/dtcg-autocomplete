import type { ParsedToken } from "./tokenParser";

const ALIAS_RE = /^\{(.+)\}$/;

export interface AliasResult {
	resolvedValue: string;
	chain: string[];
	terminal: ParsedToken | undefined;
}

export function resolveAlias(
	value: string,
	byDotPath: Map<string, ParsedToken>,
	maxDepth = 10,
): AliasResult {
	const chain: string[] = [value];
	let current = value;
	let terminal: ParsedToken | undefined;

	for (let depth = 0; depth < maxDepth; depth++) {
		const match = ALIAS_RE.exec(current);
		if (!match) break;
		const token = byDotPath.get(match[1]);
		if (!token) break;
		terminal = token;
		current = token.rawValue;
		chain.push(current);
	}

	return { resolvedValue: current, chain, terminal };
}
