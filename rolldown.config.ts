import { defineConfig } from "rolldown";

export default defineConfig({
	input: "src/extension.ts",
	output: {
		format: "cjs",
		file: "dist/extension.js",
		sourcemap: true,
	},
	external: ["vscode"],
	platform: "node",
});
