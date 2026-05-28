import * as vscode from "vscode";
import type { TokenIndex } from "./tokenIndex";

export class DtcgColorProvider implements vscode.DocumentColorProvider {
	constructor(private getIndex: () => TokenIndex | null) {}

	provideDocumentColors(document: vscode.TextDocument): vscode.ColorInformation[] {
		const index = this.getIndex();
		if (!index) return [];

		const results: vscode.ColorInformation[] = [];
		const text = document.getText();
		const re = /var\((--[\w-]+)\)/g;
		let match: RegExpExecArray | null;

		while ((match = re.exec(text)) !== null) {
			const token = index.byCssVar.get(match[1]);
			if (!token || token.type !== "color") continue;

			const hex =
				token.swatchColor ??
				(token.resolvedValue.startsWith("#") ? token.resolvedValue : undefined);
			if (!hex) continue;

			const color = hexToVscodeColor(hex);
			if (!color) continue;

			const start = document.positionAt(match.index);
			const end = document.positionAt(match.index + match[0].length);
			results.push(new vscode.ColorInformation(new vscode.Range(start, end), color));
		}

		return results;
	}

	provideColorPresentations(
		_color: vscode.Color,
		context: { document: vscode.TextDocument; range: vscode.Range },
	): vscode.ColorPresentation[] {
		return [new vscode.ColorPresentation(context.document.getText(context.range))];
	}
}

function hexToVscodeColor(hex: string): vscode.Color | undefined {
	const m = /^#([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})?$/i.exec(hex);
	if (!m) return undefined;
	return new vscode.Color(
		parseInt(m[1], 16) / 255,
		parseInt(m[2], 16) / 255,
		parseInt(m[3], 16) / 255,
		m[4] ? parseInt(m[4], 16) / 255 : 1,
	);
}
