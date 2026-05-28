import * as vscode from "vscode";
import type { ResolvedToken, TokenIndex } from "./tokenIndex";

const CSS_LIKE = new Set(["css", "scss", "less", "svelte", "vue"]);
const JS_LIKE = new Set(["javascript", "typescript", "javascriptreact", "typescriptreact"]);

export class DtcgCompletionProvider implements vscode.CompletionItemProvider {
	constructor(private getIndex: () => TokenIndex | null) {}

	provideCompletionItems(
		document: vscode.TextDocument,
		position: vscode.Position,
	): vscode.CompletionItem[] {
		const index = this.getIndex();
		if (!index) return [];

		const linePrefix = document.lineAt(position).text.slice(0, position.character);
		if (!this.shouldTrigger(linePrefix, document.languageId)) return [];

		return Array.from(index.byCssVar.values()).map((token) => this.toItem(token));
	}

	private shouldTrigger(linePrefix: string, lang: string): boolean {
		if (CSS_LIKE.has(lang)) {
			// var(- catches first dash; --foo catches bare custom property usage
			return /var\(-[\w-]*$/.test(linePrefix) || /--[\w-]*$/.test(linePrefix);
		}
		if (lang === "html") {
			return /--[\w-]*$/.test(linePrefix);
		}
		if (JS_LIKE.has(lang)) {
			return /['"`].*--[\w-]*$/.test(linePrefix);
		}
		return false;
	}

	private toItem(token: ResolvedToken): vscode.CompletionItem {
		const kind =
			token.type === "color" ? vscode.CompletionItemKind.Color : vscode.CompletionItemKind.Variable;

		const item = new vscode.CompletionItem(token.cssVar, kind);
		item.detail = token.swatchColor ?? token.resolvedValue;
		item.filterText = token.cssVar;

		const parts: string[] = [];
		if (token.swatchColor) {
			parts.push(`\`${token.resolvedValue}\``);
		}
		if (token.aliasChain.length > 1) {
			parts.push(token.aliasChain.map((s) => `\`${s}\``).join(" → "));
		}
		if (token.description) {
			parts.push(token.description);
		}
		if (parts.length > 0) {
			item.documentation = new vscode.MarkdownString(parts.join("\n\n"));
		}

		return item;
	}
}
