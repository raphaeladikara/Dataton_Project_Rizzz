type FocusableDestination = {
  hasAttribute(name: string): boolean;
  setAttribute(name: string, value: string): void;
  focus(options?: FocusOptions): void;
};

type NavigationRoot = {
  getElementById(id: string): FocusableDestination | null;
};

export type NavigationDestinationId = "home-heading" | "guide-heading" | "evidence" | "privacy";

export type CompactNavigationAction =
  | { type: "toggle" }
  | { type: "escape" }
  | { type: "outside" }
  | { type: "select"; destinationId: NavigationDestinationId };

export type CompactNavigationState = {
  open: boolean;
  focusTarget: "trigger" | NavigationDestinationId | null;
};

/** Pure state/focus contract for the compact menu. */
export function compactNavigationTransition(
  open: boolean,
  action: CompactNavigationAction,
): CompactNavigationState {
  if (action.type === "toggle") return { open: !open, focusTarget: null };
  if (action.type === "escape") return { open: false, focusTarget: "trigger" };
  if (action.type === "select") return { open: false, focusTarget: action.destinationId };
  return { open: false, focusTarget: null };
}

/** Moves keyboard focus to content reached from the compact primary menu. */
export function focusNavigationDestination(root: NavigationRoot, destinationId: string) {
  const destination = root.getElementById(destinationId);
  if (!destination) return false;
  if (!destination.hasAttribute("tabindex")) destination.setAttribute("tabindex", "-1");
  destination.focus({ preventScroll: true });
  return true;
}
