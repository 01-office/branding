# Explicit Branding Banners Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make bundled 01.works and 01.software console banners explicit opt-ins.

**Architecture:** Keep the existing banner formatter and once-guarded printer.
Change only banner selection so the default banner list is empty and explicit
boolean props add bundled banners in stable order.

**Tech Stack:** TypeScript, React optional entry point, Node test runner, pnpm.

---

### Task 1: Core Banner Options

**Files:**
- Modify: `test/banner.test.mjs`
- Modify: `src/branding.ts`

- [ ] **Step 1: Write failing tests**

Update `test/banner.test.mjs` to assert that `createBrandingBanner()` emits no
calls, `{ includeWorks: true }` emits 01.works, `{ includeSoftware: true }`
emits 01.software, and both options emit both banners.

- [ ] **Step 2: Verify red**

Run `pnpm test`. Expected: banner tests fail because the current default still
emits 01.works and `includeWorks` does not exist.

- [ ] **Step 3: Implement minimal core change**

Update `BrandingBannerConfig` with `includeWorks?: boolean`, build `banners`
from those flags, and leave formatting unchanged.

- [ ] **Step 4: Verify green**

Run `pnpm test`. Expected: updated banner tests pass or reveal React/docs tests
that still encode the old default.

### Task 2: React Props and Docs

**Files:**
- Modify: `test/react.test.mjs`
- Modify: `src/react.tsx`
- Modify: `src/index.ts`
- Modify: `README.md`

- [ ] **Step 1: Write failing React tests**

Update React resolver tests so no props returns the shared empty singleton,
`includeWorks` returns a fresh printer that logs 01.works, and
`includeWorks + includeSoftware` logs both banners.

- [ ] **Step 2: Implement React option forwarding**

Add `includeWorks?: boolean` to `BrandingProps`, pass both flags to
`createBrandingBanner`, and keep `groups` precedence.

- [ ] **Step 3: Update public docs**

Revise README examples so default `showBranding()` is described as a no-op
singleton and bundled branding uses explicit `includeWorks`/`includeSoftware`.

- [ ] **Step 4: Verify all**

Run `pnpm test` and `pnpm run typecheck`. Expected: both pass.
