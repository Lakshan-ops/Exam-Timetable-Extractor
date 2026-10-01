import { getDb } from "./db";

// Load the timetable this student uploaded.
export function loadExams(userId) {
  return getDb()
    .prepare(
      "SELECT subject_code, subject_name, exam_date AS date, exam_time AS time FROM exams WHERE user_id = ?"
    )
    .all(userId);
}
