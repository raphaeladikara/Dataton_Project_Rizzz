import { AdminConsole } from "./admin-console";

/**
 * Static. There is no server in this product, so there is nothing here to
 * authenticate against — the panel reads the same published evidence files the
 * rest of the app does, and holds no session data. It used to sit behind a
 * passcode backed by an API route, which was the only thing in the repository
 * that contradicted "PWA statis tanpa backend".
 */
export default function TechnicalPanelPage() {
  return <AdminConsole />;
}
