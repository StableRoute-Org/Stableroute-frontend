import { readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";
import { render, screen } from "@testing-library/react";
import { Badge } from "../Badge";
import { Button } from "../Button";

const REPO_ROOT = resolve(__dirname, "..", "..", "..");
const STYLEGUIDE_PATH = resolve(REPO_ROOT, "docs", "STYLEGUIDE.md");
const BADGE_SOURCE = resolve(REPO_ROOT, "src", "components", "Badge.tsx");
const BUTTON_SOURCE = resolve(REPO_ROOT, "src", "components", "Button.tsx");
const GLOBALS_CSS = resolve(REPO_ROOT, "src", "app", "globals.css");
const TAILWIND_CONFIG = resolve(REPO_ROOT, "tailwind.config.ts");

function readDoc(): string {
  if (!existsSync(STYLEGUIDE_PATH)) {
    throw new Error(
      `Missing styleguide at ${STYLEGUIDE_PATH}. Run 'git status' — the docs/STYLEGUIDE.md file should exist on this branch.`,
    );
  }
  return readFileSync(STYLEGUIDE_PATH, "utf8");
}

describe("docs/STYLEGUIDE.md", () => {
  it("exists and is non-empty", () => {
    const doc = readDoc();
    expect(doc.length).toBeGreaterThan(200);
  });

  it("documents every Badge variant exported by src/components/Badge.tsx", () => {
    const doc = readDoc();
    const source = readFileSync(BADGE_SOURCE, "utf8");

    // Extract the Variant union from the source.
    const variantMatch = source.match(/type Variant = ([^;]+);/);
    expect(variantMatch).not.toBeNull();
    const variants = (variantMatch![1] as string)
      .split("|")
      .map((v) => v.trim().replace(/['"]/g, ""))
      .filter(Boolean);

    for (const variant of variants) {
      expect(doc).toContain(variant);
    }
  });

  it("documents every Button variant exported by src/components/Button.tsx", () => {
    const doc = readDoc();
    const source = readFileSync(BUTTON_SOURCE, "utf8");

    const variantMatch = source.match(/type Variant = ([^;]+);/);
    expect(variantMatch).not.toBeNull();
    const variants = (variantMatch![1] as string)
      .split("|")
      .map((v) => v.trim().replace(/['"]/g, ""))
      .filter(Boolean);

    for (const variant of variants) {
      expect(doc).toContain(variant);
    }
  });

  it("references both source files and the global CSS variables", () => {
    const doc = readDoc();
    const globals = readFileSync(GLOBALS_CSS, "utf8");

    expect(doc).toMatch(/src\/components\/Badge\.tsx/);
    expect(doc).toMatch(/src\/components\/Button\.tsx/);
    expect(doc).toMatch(/src\/app\/globals\.css/);

    for (const variable of ["--foreground", "--background"]) {
      expect(globals).toContain(variable);
      expect(doc).toContain(variable);
    }
  });

  it("documents the focus-ring convention used in Button", () => {
    const doc = readDoc();
    const source = readFileSync(BUTTON_SOURCE, "utf8");

    expect(source).toContain("focus-visible:outline-blue-500");
    expect(doc).toContain("focus-visible:outline-blue-500");
  });

  it("the focus ring renders into the DOM on a Button", () => {
    // Behavior-level test: the focus-ring class must actually be applied to
    // the rendered <button> element, not just present in the source.
    render(<Button>go</Button>);
    const btn = screen.getByRole("button", { name: /go/ });
    expect(btn.className).toMatch(/focus-visible:outline-blue-500/);
  });

  it("the danger Badge variant renders a rose-toned class", () => {
    render(<Badge variant="danger">x</Badge>);
    expect(screen.getByText("x").className).toMatch(/rose/);
  });

  it("points at the tailwind config so contributors can extend it", () => {
    const doc = readDoc();
    expect(doc).toMatch(/tailwind\.config\.ts/);
    // The config file should still exist on disk (sanity check).
    expect(existsSync(TAILWIND_CONFIG)).toBe(true);
  });
});
