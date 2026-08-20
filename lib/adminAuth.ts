import { NextRequest } from "next/server";

export const ADMIN_COOKIE = "afsf_admin_session";

export function isAdminRequest(req: NextRequest): boolean {
  const cookie = req.cookies.get(ADMIN_COOKIE)?.value;
  const expected = process.env.ADMIN_PASSWORD;
  return Boolean(expected) && cookie === expected;
}
