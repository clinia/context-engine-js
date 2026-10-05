import path from "path";
import { fileURLToPath } from "url";
import { defaultExclude, defineConfig } from "vitest/config";

// Anchor globs to this config's directory so they resolve correctly
// regardless of the working directory vitest is invoked from.
const here = path.dirname(fileURLToPath(import.meta.url));
const fromHere = (p: string) => path.resolve(here, p);

export default defineConfig({
  test: {
    name: "context-engine-js",
    include: [fromHere("src/**/*.test.ts")],
    globals: true,
    passWithNoTests: true,
    exclude: [...defaultExclude],
  },
});
