import * as vscode from "vscode";
import type { TokenIndex } from "./tokenIndex";

export class DtcgHoverProvider implements vscode.HoverProvider {
	constructor(private getIndex: () => TokenIndex | null) {}

	provideHover(document: vscode.TextDocument, position: vscode.Position): vscode.Hover | undefined {
		const index = this.getIndex();
		if (!index) return;

		const range = document.getWordRangeAtPosition(position, /--[\w-]+/);
		if (!range) return;

		const cssVar = document.getText(range);
		const token = index.byCssVar.get(cssVar);
		if (!token) return;

		const parts = [`**${cssVar}** = \`${token.resolvedValue}\``];
		if (token.description) {
			parts.push(token.description);
		}
		if (token.aliasChain.length > 1) {
			parts.push(token.aliasChain.map((s) => `\`${s}\``).join(" → "));
		}

		return new vscode.Hover(new vscode.MarkdownString(parts.join("\n\n")));
	}
}
