import { describe, it, expect } from "vitest";
import { formatTokenValue } from "../src/valueFormatter";

describe("formatTokenValue", () => {
  it("passes through strings", () => {
    expect(formatTokenValue("#ff0000")).toBe("#ff0000");
  });

  it("passes through numbers as strings", () => {
    expect(formatTokenValue(400)).toBe("400");
  });

  it("formats dimension {value, unit}", () => {
    expect(formatTokenValue({ value: 4, unit: "px" })).toBe("4px");
    expect(formatTokenValue({ value: 0.25, unit: "rem" })).toBe("0.25rem");
  });

  it("formats OKLCH color as oklch()", () => {
    expect(
      formatTokenValue({
        colorSpace: "oklch",
        components: [0.985, 0, 0],
        alpha: 1,
        hex: "#fafafa",
      }),
    ).toBe("oklch(0.985 0 0)");
  });

  it("includes alpha in oklch() when less than 1", () => {
    expect(
      formatTokenValue({
        colorSpace: "oklch",
        components: [0.5, 0.1, 240],
        alpha: 0.5,
        hex: "#aaa",
      }),
    ).toBe("oklch(0.5 0.1 240 / 0.5)");
  });

  it("formats cubicBezier array", () => {
    expect(formatTokenValue([0.4, 0, 1, 1])).toBe("cubic-bezier(0.4, 0, 1, 1)");
  });

  it("formats shadow with nested dimension objects", () => {
    expect(
      formatTokenValue({
        offsetX: { value: 0, unit: "px" },
        offsetY: { value: 1, unit: "px" },
        blur: { value: 3, unit: "px" },
        spread: { value: 0, unit: "px" },
        color: "{color.alpha.black.10}",
      }),
    ).toBe("0px 1px 3px 0px {color.alpha.black.10}");
  });

  it("formats shadow with inset", () => {
    expect(
      formatTokenValue({
        offsetX: { value: 0, unit: "px" },
        offsetY: { value: 1, unit: "px" },
        blur: { value: 2, unit: "px" },
        spread: { value: 0, unit: "px" },
        color: "#000",
        inset: true,
      }),
    ).toBe("inset 0px 1px 2px 0px #000");
  });

  it("formats multi-layer shadow array", () => {
    const result = formatTokenValue([
      {
        offsetX: { value: 0, unit: "px" },
        offsetY: { value: 1, unit: "px" },
        blur: { value: 3, unit: "px" },
        spread: { value: 0, unit: "px" },
        color: "#000",
      },
      {
        offsetX: { value: 0, unit: "px" },
        offsetY: { value: 2, unit: "px" },
        blur: { value: 6, unit: "px" },
        spread: { value: 0, unit: "px" },
        color: "#333",
      },
    ]);
    expect(result).toBe("0px 1px 3px 0px #000, 0px 2px 6px 0px #333");
  });

  it("formats border", () => {
    expect(formatTokenValue({ width: "1px", style: "solid", color: "#ccc" })).toBe(
      "1px solid #ccc",
    );
  });

  it("formats border with dimension width", () => {
    expect(
      formatTokenValue({ width: { value: 1, unit: "px" }, style: "solid", color: "#ccc" }),
    ).toBe("1px solid #ccc");
  });

  it("formats transition without delay", () => {
    expect(formatTokenValue({ duration: "200ms", timingFunction: "ease" })).toBe("200ms ease");
  });

  it("formats transition with delay", () => {
    expect(
      formatTokenValue({
        duration: { value: 200, unit: "ms" },
        timingFunction: "ease",
        delay: { value: 50, unit: "ms" },
      }),
    ).toBe("200ms ease 50ms");
  });

  it("falls back to JSON for unknown shapes", () => {
    expect(formatTokenValue({ fontFamily: "Inter", fontSize: "16px" })).toBe(
      '{"fontFamily":"Inter","fontSize":"16px"}',
    );
  });
});
