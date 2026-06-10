import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import {
  mkdtempSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { test } from "node:test";

test("packed package exports a working showBranding function", () => {
  const directory = mkdtempSync(join(tmpdir(), "branding-smoke-"));

  try {
    const packOutput = execFileSync(
      "npm",
      ["pack", "--json", "--pack-destination", directory],
      { encoding: "utf8" },
    );
    const [{ filename }] = JSON.parse(packOutput);
    const tarball = join(directory, filename);

    writeFileSync(
      join(directory, "package.json"),
      JSON.stringify({ private: true, type: "module" }),
    );
    execFileSync(
      "npm",
      ["install", "--ignore-scripts", "--no-audit", "--no-fund", tarball],
      { cwd: directory, stdio: "pipe" },
    );

    const smokeScript = `
      import assert from "node:assert/strict";
      import { showBranding } from "@01.works/branding";

      const calls = [];
      assert.equal(typeof showBranding, "function");
      showBranding({
        console: {
          group: () => {},
          info: (...args) => calls.push(args),
          groupEnd: () => {},
        },
      });
        assert.equal(calls.length, 2);
        assert.equal(calls[0]?.[0], "https://01.works");
        assert.equal(calls[1]?.[0], "https://01.software");
    `;

    execFileSync("node", ["--input-type=module", "--eval", smokeScript], {
      cwd: directory,
      stdio: "pipe",
    });
  } finally {
    rmSync(directory, { recursive: true, force: true });
  }
});
