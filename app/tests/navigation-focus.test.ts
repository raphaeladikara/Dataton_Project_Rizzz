import assert from "node:assert/strict";
import test from "node:test";

import { compactNavigationTransition, focusNavigationDestination } from "../src/ui/navigationFocus";

test("navigation focus makes the destination programmatically focusable and focuses it", () => {
  const attributes = new Map<string, string>();
  let focusOptions: FocusOptions | undefined;
  const destination = {
    hasAttribute(name: string) { return attributes.has(name); },
    setAttribute(name: string, value: string) { attributes.set(name, value); },
    focus(options?: FocusOptions) { focusOptions = options; },
  };
  const root = {
    getElementById(id: string) { return id === "evidence" ? destination : null; },
  };

  assert.equal(focusNavigationDestination(root, "evidence"), true);
  assert.equal(attributes.get("tabindex"), "-1");
  assert.deepEqual(focusOptions, { preventScroll: true });
});

test("navigation focus preserves an existing tabindex and reports a missing destination", () => {
  const attributes = new Map([["tabindex", "0"]]);
  let focused = false;
  const destination = {
    hasAttribute(name: string) { return attributes.has(name); },
    setAttribute(name: string, value: string) { attributes.set(name, value); },
    focus() { focused = true; },
  };

  assert.equal(focusNavigationDestination({ getElementById: () => destination }, "guide-heading"), true);
  assert.equal(attributes.get("tabindex"), "0");
  assert.equal(focused, true);
  assert.equal(focusNavigationDestination({ getElementById: () => null }, "missing"), false);
});

test("compact navigation selection closes and names the destination focus target", () => {
  assert.deepEqual(
    compactNavigationTransition(true, { type: "select", destinationId: "evidence" }),
    { open: false, focusTarget: "evidence" },
  );
});

test("Escape closes compact navigation and restores its trigger", () => {
  assert.deepEqual(
    compactNavigationTransition(true, { type: "escape", compact: true }),
    { open: false, focusTarget: "trigger" },
  );
});

test("leaving compact navigation closes it without focusing the hidden trigger", () => {
  const wide = compactNavigationTransition(true, { type: "breakpoint", compact: false });
  assert.deepEqual(wide, { open: false, focusTarget: null });
  assert.deepEqual(
    compactNavigationTransition(wide.open, { type: "breakpoint", compact: true }),
    { open: false, focusTarget: null },
  );
  assert.deepEqual(
    compactNavigationTransition(true, { type: "escape", compact: false }),
    { open: false, focusTarget: null },
  );
});

test("outside dismissal closes without stealing focus, while toggle only changes state", () => {
  assert.deepEqual(
    compactNavigationTransition(true, { type: "outside" }),
    { open: false, focusTarget: null },
  );
  assert.deepEqual(
    compactNavigationTransition(false, { type: "toggle" }),
    { open: true, focusTarget: null },
  );
});
