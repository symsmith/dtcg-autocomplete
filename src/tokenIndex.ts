import { readFile } from "node:fs/promises";
import { parseTokenFile, type ParsedToken } from "./tokenParser";
import { resolveChain, resolveTerminalToken } from "./aliasResolver";

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
		const chain = resolveChain(token.rawValue, merged);
		const terminal = resolveTerminalToken(token, merged);
		const resolved: ResolvedToken = {
			...token,
			resolvedValue: chain[chain.length - 1],
			aliasChain: chain,
			swatchColor: token.swatchColor ?? terminal.swatchColor,
		};
		byCssVar.set(token.cssVar, resolved);
		byDotPath.set(dotPath, resolved);
	}

	return { byCssVar, byDotPath };
}
