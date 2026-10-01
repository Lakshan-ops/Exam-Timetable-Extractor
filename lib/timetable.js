// TIMETABLE PROCESSING: read the uploaded CSV and match the student's subjects.
// Kept separate from the pages so the core logic is easy to test and explain.

export const REQUIRED_COLUMNS = ["subject_code", "subject_name", "date", "time"];

// Split one CSV line into cells (supports "quoted, values").
function splitCsvLine(line) {
  const cells = [];
  let current = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (ch === "," && !inQuotes) {
      cells.push(current.trim());
      current = "";
    } else {
      current += ch;
    }
  }
  cells.push(current.trim());
  return cells;
}

// Normalise a subject code: "ict  2223" -> "ICT 2223"
export function normaliseCode(code) {
  return String(code).trim().split(/\s+/).join(" ").toUpperCase();
}

// Turn the CSV text into a list of exams. Throws an Error with a friendly message.
export function readTimetable(text) {
  const lines = text.replace(/^﻿/, "").split(/\r?\n/).filter((l) => l.trim() !== "");
  if (lines.length === 0) throw new Error("The timetable file is empty.");

  const headers = splitCsvLine(lines[0]).map((h) => h.toLowerCase());
  const missing = REQUIRED_COLUMNS.filter((c) => !headers.includes(c));
  if (missing.length) throw new Error("Timetable is missing column(s): " + missing.join(", "));

  const exams = [];
  for (const line of lines.slice(1)) {
    const cells = splitCsvLine(line);
    const row = {};
    headers.forEach((h, i) => (row[h] = cells[i] ?? ""));
    if (!row.subject_code) continue; // skip rows without a subject code
    exams.push({
      subject_code: normaliseCode(row.subject_code),
      subject_name: row.subject_name,
      date: row.date,
      time: row.time,
    });
  }
  return exams;
}

// Returns { matches: exams sorted by date, notFound: codes not in the timetable }.
// Case-insensitive, and duplicate codes are ignored.
export function matchSubjects(exams, selectedCodes) {
  const wanted = new Set(selectedCodes.map(normaliseCode).filter(Boolean));
  const matches = exams.filter((e) => wanted.has(e.subject_code));
  const found = new Set(matches.map((e) => e.subject_code));
  const notFound = [...wanted].filter((c) => !found.has(c)).sort();
  matches.sort((a, b) => a.date.localeCompare(b.date));
  return { matches, notFound };
}
