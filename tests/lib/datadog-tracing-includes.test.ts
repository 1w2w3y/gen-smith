import { describe, it, expect } from "vitest";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { datadogTracingIncludes } from "../../scripts/datadog-tracing-includes";

const projectRoot = process.cwd();
const includes = datadogTracingIncludes(projectRoot);
const packageOf = (glob: string) =>
  glob.replace(/^\.\/node_modules\//, "").replace(/\/\*\*\/\*$/, "");
const packages = includes.map(packageOf);

describe("datadogTracingIncludes", () => {
  it("includes dd-trace and its preload dependencies", () => {
    expect(packages).toEqual(expect.arrayContaining(["dd-trace"]));
  });

  it("includes the transitive dependencies the preload resolves at runtime", () => {
    // import-in-the-middle imports these from get-exports.mjs; missing
    // cjs-module-lexer is what crashed the standalone image.
    expect(packages).toEqual(
      expect.arrayContaining([
        "import-in-the-middle",
        "cjs-module-lexer",
        "es-module-lexer",
        "module-details-from-path",
      ])
    );
  });

  it("covers every dependency of every included package", () => {
    const covered = new Set(packages);
    for (const name of packages) {
      const manifest = JSON.parse(
        readFileSync(
          path.join(projectRoot, "node_modules", name, "package.json"),
          "utf8"
        )
      ) as { dependencies?: Record<string, string> };
      for (const dependency of Object.keys(manifest.dependencies ?? {})) {
        const nested = path.join(
          projectRoot,
          "node_modules",
          name,
          "node_modules",
          dependency
        );
        if (existsSync(nested)) continue; // shipped inside its parent
        expect(covered, `${name} depends on ${dependency}`).toContain(
          dependency
        );
      }
    }
  });

  it("emits globs that exist on disk", () => {
    for (const name of packages) {
      expect(
        existsSync(path.join(projectRoot, "node_modules", name)),
        name
      ).toBe(true);
    }
  });

  it("skips packages nested inside an already included package", () => {
    for (const glob of includes) {
      expect(glob.startsWith("./node_modules/")).toBe(true);
      expect(packageOf(glob)).not.toContain("node_modules");
    }
  });
});
