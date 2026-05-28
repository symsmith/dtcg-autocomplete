import * as vscode from "vscode";
import { DtcgColorProvider } from "./colorProvider";
import { DtcgCompletionProvider } from "./completionProvider";
import { DtcgHoverProvider } from "./hoverProvider";
import { getVariantExclusions } from "./resolverParser";
import { buildIndex, type TokenIndex } from "./tokenIndex";

const LANGUAGES = [
	"css",
	"scss",
	"less",
	"html",
	"javascript",
	"typescript",
	"javascriptreact",
	"typescriptreact",
	"svelte",
	"vue",
];

let currentIndex: TokenIndex | null = null;

export async function activate(context: vscode.ExtensionContext): Promise<void> {
	const getIndex = () => currentIndex;

	const rebuild = async () => {
		const cfg = vscode.workspace.getConfiguration("dtcg-autocomplete");
		const glob = cfg.get<string>("tokenGlob", "**/tokens/**/*.json");
		const excludeGlob = cfg.get<string>("excludeGlob", "");
		const exclude = ["**/node_modules/**", excludeGlob].filter(Boolean).join(",");
		const uris = await vscode.workspace.findFiles(glob, `{${exclude}}`);

		const resolverGlob = cfg.get<string>("resolverGlob", "**/*.resolver.json");
		const resolverUris = await vscode.workspace.findFiles(resolverGlob, "**/node_modules/**");
		const variantExclusions = new Set<string>();
		for (const uri of resolverUris) {
			try {
				const exclusions = await getVariantExclusions(uri.fsPath);
				for (const p of exclusions) variantExclusions.add(p);
			} catch {
				/* skip unparseable resolver files */
			}
		}

		const paths = uris.map((u) => u.fsPath).filter((p) => !variantExclusions.has(p));
		currentIndex = await buildIndex(paths);
	};

	await rebuild();

	const selectors = LANGUAGES.map((language) => ({ language }));

	context.subscriptions.push(
		vscode.languages.registerCompletionItemProvider(
			selectors,
			new DtcgCompletionProvider(getIndex),
			"-",
		),
		vscode.languages.registerHoverProvider(selectors, new DtcgHoverProvider(getIndex)),
		vscode.languages.registerColorProvider(selectors, new DtcgColorProvider(getIndex)),
		vscode.commands.registerCommand("dtcg-autocomplete.reloadIndex", rebuild),
	);

	const glob = vscode.workspace
		.getConfiguration("dtcg-autocomplete")
		.get<string>("tokenGlob", "**/tokens/**/*.json");

	const watcher = vscode.workspace.createFileSystemWatcher(glob);
	watcher.onDidChange(rebuild);
	watcher.onDidCreate(rebuild);
	watcher.onDidDelete(rebuild);
	context.subscriptions.push(watcher);
}

export function deactivate(): void {
	currentIndex = null;
}
