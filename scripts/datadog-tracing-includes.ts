import { existsSync, readFileSync } from "node:fs";
import path from "node:path";

/**
 * dd-trace is loaded through the `--import dd-trace/initialize.mjs` preload in
 * NODE_OPTIONS, so nothing in the app's module graph references it and Next's
 * static file tracer leaves it out of `output: "standalone"`. Every package the
 * preload touches at runtime has to be forced into the trace by hand.
 *
 * Naming those packages one by one is what broke the standalone image before:
 * the list missed `cjs-module-lexer`, an import-in-the-middle dependency, and
 * the preload threw ERR_MODULE_NOT_FOUND before Next ever started. It passed
 * locally because a full `node_modules` sits above `.next/standalone`, so Node
 * resolves the missing package from the parent directory. Walking the real
 * dependency graph keeps the list from drifting on the next dd-trace bump.
 */
const TRACING_ENTRY_POINTS = ["dd-trace"];

function readDependencyNames(packageDir: string): string[] {
  let manifest: {
    dependencies?: Record<string, string>;
    optionalDependencies?: Record<string, string>;
  };
  try {
    manifest = JSON.parse(
      readFileSync(path.join(packageDir, "package.json"), "utf8")
    );
  } catch {
    return [];
  }
  return [
    ...Object.keys(manifest.dependencies ?? {}),
    ...Object.keys(manifest.optionalDependencies ?? {}),
  ];
}

/**
 * Resolve `name` the way Node would from `fromDir`, but never above
 * `projectRoot` — a package found outside the project is one the standalone
 * image would not have.
 */
function resolvePackageDir(
  name: string,
  fromDir: string,
  projectRoot: string
): string | null {
  let dir = fromDir;
  for (;;) {
    const candidate = path.join(dir, "node_modules", name);
    if (existsSync(path.join(candidate, "package.json"))) return candidate;
    if (dir === projectRoot) return null;
    const parent = path.dirname(dir);
    if (parent === dir) return null;
    dir = parent;
  }
}

/**
 * Glob patterns for dd-trace and everything it depends on, relative to the
 * project root, ready for `outputFileTracingIncludes`.
 */
export function datadogTracingIncludes(
  projectRoot: string = process.cwd()
): string[] {
  const packageDirs = new Set<string>();

  const visit = (name: string, fromDir: string) => {
    const packageDir = resolvePackageDir(name, fromDir, projectRoot);
    // Optional dependencies for other platforms (prebuilt native bindings)
    // are absent by design.
    if (!packageDir || packageDirs.has(packageDir)) return;
    packageDirs.add(packageDir);
    for (const dependency of readDependencyNames(packageDir)) {
      visit(dependency, packageDir);
    }
  };

  for (const entryPoint of TRACING_ENTRY_POINTS) visit(entryPoint, projectRoot);

  if (packageDirs.size === 0) {
    throw new Error(
      `Cannot build: ${TRACING_ENTRY_POINTS.join(", ")} not found under ` +
        `${projectRoot}/node_modules. Install dependencies before building, ` +
        "or the standalone image will crash on the dd-trace preload."
    );
  }

  return [...packageDirs]
    .map((packageDir) =>
      path.relative(projectRoot, packageDir).split(path.sep).join("/")
    )
    // A nested package lives inside its parent, which is already included.
    .filter(
      (relativePath) =>
        relativePath.split("/").filter((segment) => segment === "node_modules")
          .length === 1
    )
    .sort()
    .map((relativePath) => `./${relativePath}/**/*`);
}
