import resolve from "@rollup/plugin-node-resolve";
import commonjs from "@rollup/plugin-commonjs";
import typescript from "@rollup/plugin-typescript";
import dts from "rollup-plugin-dts";
import peerDepsExternal from "rollup-plugin-peer-deps-external";

export default [
	// Main build (ESM + CJS)
	{
		input: "src/index.ts",
		output: [
			{
				file: "dist/index.cjs",
				format: "cjs",
				sourcemap: true,
			},
			{
				file: "dist/index.js",
				format: "esm",
				sourcemap: true,
			},
		],
		plugins: [
			peerDepsExternal(),
			resolve(),
			commonjs(),
			typescript({
				tsconfig: "./tsconfig.json",
				declarationDir: "dist/types",
			}),
		],
	},
	// Bundle type declarations
	{
		input: "dist/types/index.d.ts",
		output: [{ file: "dist/index.d.ts", format: "esm" }],
		plugins: [dts()],
	},
];
