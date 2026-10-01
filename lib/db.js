// DATA STORAGE: one SQLite file (exams.db) with three tables.
//   users    -> username + hashed password
//   sessions -> login sessions (random token stored in a cookie)
//   exams    -> the timetable rows each student uploaded
import Database from "better-sqlite3";
import bcrypt from "bcryptjs";
import path from "path";

let db;

export function getDb() {
  if (!db) {
    db = new Database(path.join(process.cwd(), "exams.db"));
    createTables(db);
    seedDemoUsers(db);
  }
  return db;
}

function createTables(db) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS sessions (
      token TEXT PRIMARY KEY,
      user_id INTEGER NOT NULL REFERENCES users(id)
    );
    CREATE TABLE IF NOT EXISTS exams (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL REFERENCES users(id),
      subject_code TEXT NOT NULL,
      subject_name TEXT NOT NULL,
      exam_date TEXT NOT NULL,
      exam_time TEXT NOT NULL
    );
  `);
}

// Demo accounts so the app can be demonstrated straight away.
function seedDemoUsers(db) {
  const demo = [
    ["student1", "pass123"],
    ["student2", "pass456"],
  ];
  const insert = db.prepare(
    "INSERT OR IGNORE INTO users (username, password_hash) VALUES (?, ?)"
  );
  for (const [username, password] of demo) {
    const exists = db.prepare("SELECT 1 FROM users WHERE username = ?").get(username);
    if (!exists) insert.run(username, bcrypt.hashSync(password, 10));
  }
}
