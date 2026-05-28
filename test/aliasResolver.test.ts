import { describe, expect, it } from "vitest";
import { resolveAlias } from "../src/aliasResolver";
import type { ParsedToken } from "../src/tokenParser";

function makeMap(entries: Record<string, string>): Map<string, ParsedToken> {
	return new Map(
		Object.entries(entries).map(([dotPath, rawValue]) => [
			dotPath,
			{
				dotPath,
				cssVar: "--" + dotPath.replace(/\./g, "-"),
				type: "color",
				rawValue,
			},
		]),
	);
}

describe("resolveAlias", () => {
	it("passes through a non-alias value", () => {
		const result = resolveAlias("#ff0000", new Map());
		expect(result.resolvedValue).toBe("#ff0000");
		expect(result.chain).toEqual(["#ff0000"]);
		expect(result.terminal).toBeUndefined();
	});

	it("resolves a direct alias", () => {
		const map = makeMap({ "color.red": "#ff0000" });
		const result = resolveAlias("{color.red}", map);
		expect(result.resolvedValue).toBe("#ff0000");
		expect(result.chain).toEqual(["{color.red}", "#ff0000"]);
		expect(result.terminal?.dotPath).toBe("color.red");
	});

	it("resolves a two-hop alias chain", () => {
		const map = makeMap({
			"color.base": "#ff0000",
			"color.alias": "{color.base}",
		});
		const result = resolveAlias("{color.alias}", map);
		expect(result.resolvedValue).toBe("#ff0000");
		expect(result.chain).toEqual(["{color.alias}", "{color.base}", "#ff0000"]);
		expect(result.terminal?.dotPath).toBe("color.base");
	});

	it("resolves a three-hop alias chain", () => {
		const map = makeMap({ a: "#fff", b: "{a}", c: "{b}" });
		const result = resolveAlias("{c}", map);
		expect(result.resolvedValue).toBe("#fff");
		expect(result.chain).toEqual(["{c}", "{b}", "{a}", "#fff"]);
	});

	it("returns raw value when alias target is missing", () => {
		const result = resolveAlias("{does.not.exist}", new Map());
		expect(result.resolvedValue).toBe("{does.not.exist}");
		expect(result.chain).toEqual(["{does.not.exist}"]);
		expect(result.terminal).toBeUndefined();
	});

	it("caps at max depth on circular reference", () => {
		const map = makeMap({ a: "{b}", b: "{a}" });
		const result = resolveAlias("{a}", map);
		expect(result.resolvedValue).toMatch(/^\{/);
		expect(result.chain.length).toBe(11); // initial + 10 iterations
	});

	it("respects custom maxDepth", () => {
		const map = makeMap({ a: "{b}", b: "{c}", c: "#000" });
		expect(resolveAlias("{a}", map, 1).resolvedValue).toBe("{b}");
		expect(resolveAlias("{a}", map, 3).resolvedValue).toBe("#000");
	});

	it("propagates terminal swatchColor", () => {
		const leaf: ParsedToken = {
			dotPath: "color.red",
			cssVar: "--color-red",
			type: "color",
			rawValue: "#ff0000",
			swatchColor: "#ff0000",
		};
		const alias: ParsedToken = {
			dotPath: "color.primary",
			cssVar: "--color-primary",
			type: "color",
			rawValue: "{color.red}",
		};
		const map = new Map([
			["color.red", leaf],
			["color.primary", alias],
		]);
		const result = resolveAlias("{color.primary}", map);
		expect(result.terminal?.swatchColor).toBe("#ff0000");
	});
});
