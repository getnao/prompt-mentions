import resolve from "@rollup/plugin-node-resolve";
import commonjs from "@rollup/plugin-commonjs";
import typescript from "@rollup/plugin-typescript";
import terser from "@rollup/plugin-terser";
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
				sourcemap: false,
			},
			{
				file: "dist/index.js",
				format: "esm",
				sourcemap: false,
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
			terser({
				compress: {
					pure_getters: true,
					passes: 2,
				},
				mangle: {
					// Keep class names for better debugging
					keep_classnames: true,
				},
				format: {
					comments: false,
				},
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
