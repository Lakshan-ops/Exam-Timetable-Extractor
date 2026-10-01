import { currentUser } from "@/lib/auth";
import { loadExams } from "@/lib/exams";

// GET /api/subjects -> list of subjects in the uploaded timetable
export async function GET() {
  const user = await currentUser();
  if (!user) return Response.json({ error: "Please log in." }, { status: 401 });

  const seen = new Map();
  for (const e of loadExams(user.id)) seen.set(e.subject_code, e.subject_name);
  const subjects = [...seen].map(([code, name]) => ({ code, name }));
  subjects.sort((a, b) => a.code.localeCompare(b.code));

  return Response.json({ username: user.username, subjects });
}
