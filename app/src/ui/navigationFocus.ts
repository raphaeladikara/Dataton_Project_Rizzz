type FocusableDestination = {
  hasAttribute(name: string): boolean;
  setAttribute(name: string, value: string): void;
  focus(options?: FocusOptions): void;
};

type NavigationRoot = {
  getElementById(id: string): FocusableDestination | null;
};

/** Moves keyboard focus to content reached from the compact primary menu. */
export function focusNavigationDestination(root: NavigationRoot, destinationId: string) {
  const destination = root.getElementById(destinationId);
  if (!destination) return false;
  if (!destination.hasAttribute("tabindex")) destination.setAttribute("tabindex", "-1");
  destination.focus({ preventScroll: true });
  return true;
}
