// LOGIN COMPONENT helpers: check passwords and keep the student logged in.
import { cookies } from "next/headers";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import { getDb } from "./db";

const COOKIE = "session";

// Returns the user if username + password are correct, otherwise null.
export function checkLogin(username, password) {
  const user = getDb().prepare("SELECT * FROM users WHERE username = ?").get(username);
  if (!user) return null;
  return bcrypt.compareSync(password, user.password_hash) ? user : null;
}

export async function startSession(userId) {
  const token = crypto.randomUUID();
  getDb().prepare("INSERT INTO sessions (token, user_id) VALUES (?, ?)").run(token, userId);
  const store = await cookies();
  store.set(COOKIE, token, { httpOnly: true, sameSite: "lax", path: "/" });
}

export async function endSession() {
  const store = await cookies();
  const token = store.get(COOKIE)?.value;
  if (token) getDb().prepare("DELETE FROM sessions WHERE token = ?").run(token);
  store.delete(COOKIE);
}

// Returns the logged-in user, or null if nobody is logged in.
export async function currentUser() {
  const store = await cookies();
  const token = store.get(COOKIE)?.value;
  if (!token) return null;
  return (
    getDb()
      .prepare(
        "SELECT users.id, users.username FROM sessions JOIN users ON users.id = sessions.user_id WHERE token = ?"
      )
      .get(token) || null
  );
}
