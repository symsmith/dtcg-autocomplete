import { readFile } from "node:fs/promises";
import { parseTokenFile, type ParsedToken } from "./tokenParser";
import { resolveAlias } from "./aliasResolver";

export interface ResolvedToken extends ParsedToken {
	resolvedValue: string;
	aliasChain: string[];
}

export interface TokenIndex {
	byCssVar: Map<string, ResolvedToken>;
	byDotPath: Map<string, ResolvedToken>;
}

export async function buildIndex(filePaths: string[]): Promise<TokenIndex> {
	const merged = new Map<string, ParsedToken>();

	for (const filePath of filePaths) {
		try {
			const raw = await readFile(filePath, "utf8");
			const tokens = parseTokenFile(JSON.parse(raw));
			for (const [dotPath, token] of tokens) {
				merged.set(dotPath, token);
			}
		} catch {
			// skip files that fail to parse
		}
	}

	const byCssVar = new Map<string, ResolvedToken>();
	const byDotPath = new Map<string, ResolvedToken>();

	for (const [dotPath, token] of merged) {
		const { resolvedValue, chain, terminal } = resolveAlias(token.rawValue, merged);
		const resolved: ResolvedToken = {
			...token,
			resolvedValue,
			aliasChain: chain,
			swatchColor: token.swatchColor ?? terminal?.swatchColor,
		};
		byCssVar.set(token.cssVar, resolved);
		byDotPath.set(dotPath, resolved);
	}

	return { byCssVar, byDotPath };
}
