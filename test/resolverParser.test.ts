import { describe, it, expect } from "vitest";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { getVariantExclusions } from "../src/resolverParser";

const fixturesDir = join(fileURLToPath(new URL(".", import.meta.url)), "fixtures");
const resolverPath = join(fixturesDir, "tokens.resolver.json");

describe("getVariantExclusions", () => {
	it("returns absolute paths for non-default modifier contexts", async () => {
		const excluded = await getVariantExclusions(resolverPath);
		expect(excluded.size).toBe(1);
		expect(excluded.has(join(fixturesDir, "dark-tokens.json"))).toBe(true);
	});

	it("does not exclude files from the default context", async () => {
		const excluded = await getVariantExclusions(resolverPath);
		expect(excluded.has(join(fixturesDir, "tokens.json"))).toBe(false);
	});
});
