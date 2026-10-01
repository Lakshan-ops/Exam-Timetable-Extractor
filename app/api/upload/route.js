import { currentUser } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { readTimetable } from "@/lib/timetable";

const bad = (message) => Response.json({ error: message }, { status: 400 });

// POST /api/upload  (form data with a "timetable" CSV file)
export async function POST(request) {
  const user = await currentUser();
  if (!user) return Response.json({ error: "Please log in." }, { status: 401 });

  const form = await request.formData().catch(() => null);
  const file = form?.get("timetable");
  if (!file || typeof file === "string" || file.size === 0 || !file.name) {
    return bad("Please choose a timetable file to upload.");
  }
  if (!file.name.toLowerCase().endsWith(".csv")) {
    return bad("Only .csv timetable files are supported.");
  }

  let text;
  try {
    text = new TextDecoder("utf-8", { fatal: true }).decode(await file.arrayBuffer());
  } catch {
    return bad("Could not read the file. Please upload a plain-text CSV file.");
  }

  let exams;
  try {
    exams = readTimetable(text);
  } catch (err) {
    return bad(err.message);
  }
  if (exams.length === 0) return bad("The timetable file has no exams in it.");

  // Replace this student's previous timetable with the new one.
  const db = getDb();
  const insert = db.prepare(
    "INSERT INTO exams (user_id, subject_code, subject_name, exam_date, exam_time) VALUES (?, ?, ?, ?, ?)"
  );
  db.transaction(() => {
    db.prepare("DELETE FROM exams WHERE user_id = ?").run(user.id);
    for (const e of exams) insert.run(user.id, e.subject_code, e.subject_name, e.date, e.time);
  })();

  return Response.json({ count: exams.length });
}
