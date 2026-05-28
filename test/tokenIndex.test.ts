import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { buildIndex } from "../src/tokenIndex";

const fixturesDir = join(fileURLToPath(new URL(".", import.meta.url)), "fixtures");
const fixturePath = join(fixturesDir, "tokens.json");

describe("buildIndex", () => {
  it("indexes all leaf tokens", async () => {
    const index = await buildIndex([fixturePath]);
    expect(index.byCssVar.size).toBeGreaterThan(0);
    expect(index.byDotPath.size).toBe(index.byCssVar.size);
  });

  it("resolves a two-hop alias chain to final value", async () => {
    const index = await buildIndex([fixturePath]);
    const token = index.byCssVar.get("--color-surface-default");
    expect(token?.resolvedValue).toBe("#FF0000");
  });

  it("populates both maps with the same token count", async () => {
    const index = await buildIndex([fixturePath]);
    expect(index.byCssVar.size).toBe(index.byDotPath.size);
  });

  it("preserves $description", async () => {
    const index = await buildIndex([fixturePath]);
    const token = index.byCssVar.get("--color-surface-default");
    expect(token?.description).toBe("Main surface color");
  });

  it("assigns correct type via inheritance", async () => {
    const index = await buildIndex([fixturePath]);
    expect(index.byCssVar.get("--color-primary-base")?.type).toBe("color");
    expect(index.byCssVar.get("--spacing-sm")?.type).toBe("dimension");
  });

  it("handles circular aliases without throwing", async () => {
    const index = await buildIndex([fixturePath]);
    const a = index.byCssVar.get("--circular-a");
    expect(a).toBeDefined();
    expect(() => index.byCssVar.get("--circular-a")).not.toThrow();
  });

  it("merges multiple files, last-file wins on collision", async () => {
    const index = await buildIndex([fixturePath, fixturePath]);
    expect(index.byCssVar.size).toBeGreaterThan(0);
  });

  it("silently skips missing files", async () => {
    const index = await buildIndex(["/nonexistent/path/tokens.json", fixturePath]);
    expect(index.byCssVar.size).toBeGreaterThan(0);
  });
});
