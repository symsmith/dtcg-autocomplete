import { readFile } from "node:fs/promises";
import { resolve, dirname } from "node:path";

interface Ref {
	$ref: string;
}
interface ResolverSet {
	type: "set";
	sources: Ref[];
}
interface ResolverModifier {
	type: "modifier";
	default: string;
	contexts: Record<string, Ref[]>;
}
type ResolverEntry = ResolverSet | ResolverModifier;
interface ResolverFile {
	resolutionOrder: ResolverEntry[];
}

export async function getVariantExclusions(resolverPath: string): Promise<Set<string>> {
	const raw = await readFile(resolverPath, "utf8");
	const resolver = JSON.parse(raw) as ResolverFile;
	const dir = dirname(resolverPath);
	const excluded = new Set<string>();

	for (const entry of resolver.resolutionOrder) {
		if (entry.type !== "modifier") continue;
		for (const [context, refs] of Object.entries(entry.contexts)) {
			if (context === entry.default) continue;
			for (const ref of refs) {
				excluded.add(resolve(dir, ref.$ref));
			}
		}
	}

	return excluded;
}
