import { currentUser } from "@/lib/auth";
import { loadExams } from "@/lib/exams";
import { matchSubjects } from "@/lib/timetable";

// POST /api/extract  { codes: ["ICT 2223", ...] }  -> the student's exams
export async function POST(request) {
  const user = await currentUser();
  if (!user) return Response.json({ error: "Please log in." }, { status: 401 });

  const exams = loadExams(user.id);
  if (exams.length === 0) {
    return Response.json({ error: "Please upload your exam timetable first." }, { status: 400 });
  }

  const body = await request.json().catch(() => ({}));
  const codes = Array.isArray(body.codes) ? body.codes.map(String).filter((c) => c.trim()) : [];
  if (codes.length === 0) {
    return Response.json({ error: "Please select at least one subject." }, { status: 400 });
  }

  const { matches, notFound } = matchSubjects(exams, codes);
  return Response.json({ exams: matches, notFound });
}
