import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["src/index.ts"],
  format: ["esm"],
  target: "es2022",
  outDir: "dist",
  clean: true,
  sourcemap: true,
  // Declarations are emitted separately via `tsc6 -p tsconfig.build.json`.
  // tsup's dts pass injects a `baseUrl` compiler option, which TypeScript 6.0
  // reports as a deprecation error (TS5101). Emitting from our own tsconfig
  // (which sets no baseUrl) keeps the build deprecation-clean.
  dts: false,
});
