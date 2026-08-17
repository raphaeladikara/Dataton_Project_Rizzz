import { cookies } from "next/headers";
import { ADMIN_COOKIE, adminConfigured, verifyAdminSession } from "../../src/admin/auth";
import { AdminConsole } from "./admin-console";
import { AdminLogin } from "./admin-login";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const cookieStore = await cookies();
  const authenticated = verifyAdminSession(cookieStore.get(ADMIN_COOKIE)?.value);
  return authenticated ? <AdminConsole /> : <AdminLogin configured={adminConfigured()} />;
}
