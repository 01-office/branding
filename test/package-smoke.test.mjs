import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import {
  mkdtempSync,
  readdirSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { test } from "node:test";

test("packed package exports a working showBranding function", () => {
  const directory = mkdtempSync(join(tmpdir(), "console-smoke-"));

  try {
    // `pnpm pack` runs `prepare` (which builds dist) and writes the tarball into
    // the destination dir. Read the .tgz from disk rather than parsing stdout,
    // since the build lifecycle prints banners that would corrupt --json output.
    execFileSync(
      "pnpm",
      ["pack", "--pack-destination", directory],
      { encoding: "utf8", stdio: "pipe" },
    );
    const filename = readdirSync(directory).find((file) =>
      file.endsWith(".tgz"),
    );
    assert.ok(filename, "pnpm pack did not produce a .tgz tarball");
    const tarball = join(directory, filename);

    writeFileSync(
      join(directory, "package.json"),
      JSON.stringify({ private: true, type: "module" }),
    );
    execFileSync(
      "pnpm",
      ["add", "--ignore-scripts", tarball],
      { cwd: directory, stdio: "pipe" },
    );

    const smokeScript = `
      import assert from "node:assert/strict";
      import { showBranding } from "@01.works/console";

      const calls = [];
      assert.equal(typeof showBranding, "function");
      showBranding({
        console: {
          group: () => {},
          info: (...args) => calls.push(args),
          groupEnd: () => {},
        },
      });
        assert.equal(calls.length, 1);
        assert.ok(calls.some((args) => args[0].includes("https://01.works")));
        assert.ok(calls.every((args) => !args[0].includes("https://01.software")));
    `;

    execFileSync("node", ["--input-type=module", "--eval", smokeScript], {
      cwd: directory,
      stdio: "pipe",
    });
  } finally {
    rmSync(directory, { recursive: true, force: true });
  }
});
