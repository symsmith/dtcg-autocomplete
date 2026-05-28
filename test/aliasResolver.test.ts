import { describe, expect, it } from "vitest";
import { resolveChain, resolveValue } from "../src/aliasResolver";
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

describe("resolveValue", () => {
  it("passes through non-alias values", () => {
    expect(resolveValue("#ff0000", new Map())).toBe("#ff0000");
  });

  it("resolves a direct alias", () => {
    const map = makeMap({ "color.red": "#ff0000" });
    expect(resolveValue("{color.red}", map)).toBe("#ff0000");
  });

  it("resolves a two-hop alias chain", () => {
    const map = makeMap({
      "color.base": "#ff0000",
      "color.alias": "{color.base}",
    });
    expect(resolveValue("{color.alias}", map)).toBe("#ff0000");
  });

  it("resolves a three-hop alias chain", () => {
    const map = makeMap({
      a: "#fff",
      b: "{a}",
      c: "{b}",
    });
    expect(resolveValue("{c}", map)).toBe("#fff");
  });

  it("returns raw value when alias target is missing", () => {
    expect(resolveValue("{does.not.exist}", new Map())).toBe("{does.not.exist}");
  });

  it("returns raw value on circular reference (max depth exceeded)", () => {
    const map = makeMap({
      a: "{b}",
      b: "{a}",
    });
    const result = resolveValue("{a}", map);
    expect(result).toMatch(/^\{/);
  });

  it("returns single-item chain for direct value", () => {
    expect(resolveChain("#ff0000", new Map())).toEqual(["#ff0000"]);
  });

  it("returns full chain for multi-hop alias", () => {
    const map = makeMap({ a: "{b}", b: "{c}", c: "#000" });
    expect(resolveChain("{a}", map)).toEqual(["{a}", "{b}", "{c}", "#000"]);
  });

  it("respects custom maxDepth", () => {
    const map = makeMap({ a: "{b}", b: "{c}", c: "#000" });
    expect(resolveValue("{a}", map, 0, 1)).toBe("{b}");
    expect(resolveValue("{a}", map, 0, 3)).toBe("#000");
  });
});
