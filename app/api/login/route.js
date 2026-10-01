import { checkLogin, startSession } from "@/lib/auth";

// POST /api/login  { username, password }
export async function POST(request) {
  const { username = "", password = "" } = await request.json().catch(() => ({}));
  if (!String(username).trim() || !password) {
    return Response.json({ error: "Please enter both username and password." }, { status: 400 });
  }
  const user = checkLogin(String(username).trim(), String(password));
  if (!user) {
    return Response.json({ error: "Wrong username or password." }, { status: 401 });
  }
  await startSession(user.id);
  return Response.json({ username: user.username });
}
