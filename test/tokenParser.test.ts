import { describe, it, expect } from "vitest";
import { parseTokenFile } from "../src/tokenParser";

describe("parseTokenFile", () => {
	it("produces correct cssVar from nested path", () => {
		const tokens = parseTokenFile({
			color: { surface: { default: { $value: "#fff" } } },
		});
		expect(tokens.get("color.surface.default")?.cssVar).toBe("--color-surface-default");
	});

	it("inherits $type from ancestor group", () => {
		const tokens = parseTokenFile({
			color: { $type: "color", primary: { $value: "#f00" } },
		});
		expect(tokens.get("color.primary")?.type).toBe("color");
	});

	it("uses leaf $type over inherited", () => {
		const tokens = parseTokenFile({
			color: {
				$type: "color",
				size: { $type: "dimension", $value: "4px" },
			},
		});
		expect(tokens.get("color.size")?.type).toBe("dimension");
	});

	it("extracts $description", () => {
		const tokens = parseTokenFile({
			spacing: { sm: { $value: "4px", $description: "Small spacing" } },
		});
		expect(tokens.get("spacing.sm")?.description).toBe("Small spacing");
	});

	it("sets description undefined when absent", () => {
		const tokens = parseTokenFile({
			spacing: { sm: { $value: "4px" } },
		});
		expect(tokens.get("spacing.sm")?.description).toBeUndefined();
	});

	it("skips $ keys when walking groups", () => {
		const tokens = parseTokenFile({
			color: { $type: "color", $description: "ignore", primary: { $value: "#f00" } },
		});
		expect(tokens.size).toBe(1);
		expect(tokens.has("color.primary")).toBe(true);
	});

	it("handles deeply nested groups", () => {
		const tokens = parseTokenFile({
			a: { b: { c: { d: { $value: "1px" } } } },
		});
		expect(tokens.get("a.b.c.d")?.cssVar).toBe("--a-b-c-d");
	});

	it("stores rawValue verbatim including aliases", () => {
		const tokens = parseTokenFile({
			color: { alias: { $value: "{color.primary}" } },
		});
		expect(tokens.get("color.alias")?.rawValue).toBe("{color.primary}");
	});

	it("formats dimension $value", () => {
		const tokens = parseTokenFile({
			spacing: { sm: { $value: { value: 4, unit: "px" } } },
		});
		expect(tokens.get("spacing.sm")?.rawValue).toBe("4px");
	});
});
