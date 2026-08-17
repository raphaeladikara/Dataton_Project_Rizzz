import { NextResponse } from "next/server";
import { ADMIN_COOKIE, adminConfigured, createAdminSession, verifyAdminPassword } from "../../../../src/admin/auth";

export async function POST(request: Request) {
  const noStore = { "Cache-Control": "no-store" };
  if (!adminConfigured()) return NextResponse.json({ error: "Admin belum dikonfigurasi." }, { status: 503, headers: noStore });
  const body = await request.json().catch(() => null) as { password?: unknown } | null;
  if (typeof body?.password !== "string" || !verifyAdminPassword(body.password)) {
    return NextResponse.json({ error: "Passcode tidak valid." }, { status: 401, headers: noStore });
  }
  const session = createAdminSession();
  const response = NextResponse.json({ ok: true }, { headers: noStore });
  response.cookies.set(ADMIN_COOKIE, session.token, {
    httpOnly: true,
    sameSite: "strict",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: session.maxAge,
  });
  return response;
}
