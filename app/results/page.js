"use client";
import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { normaliseCode } from "@/lib/timetable";

// RESULTS PAGE: the student's personal exam timetable.
// The selected subject codes live in the URL (?codes=...), so editing the
// selection just updates the URL and the timetable is extracted again.
function Results() {
  const router = useRouter();
  const params = useSearchParams();
  const codes = [...new Set((params.get("codes") || "").split(",").map(normaliseCode).filter(Boolean))];
  const codesKey = codes.join(",");

  const [exams, setExams] = useState(null);
  const [notFound, setNotFound] = useState([]);
  const [error, setError] = useState("");

  // Edit panel state
  const [editing, setEditing] = useState(false);
  const [allSubjects, setAllSubjects] = useState(null);
  const [draft, setDraft] = useState([]);
  const [search, setSearch] = useState("");
  const [editError, setEditError] = useState("");

  useEffect(() => {
    setError("");
    setNotFound([]);
    fetch("/api/extract", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ codes: codesKey.split(",") }),
    }).then(async (res) => {
      const data = await res.json();
      if (res.status === 401) return router.push("/");
      if (!res.ok) {
        setExams([]);
        return setError(data.error);
      }
      setExams(data.exams);
      setNotFound(data.notFound);
    });
  }, [codesKey, router]);

  function showCodes(newCodes) {
    router.replace("/results?codes=" + encodeURIComponent(newCodes.join(",")));
  }

  async function openEdit() {
    setEditError("");
    setSearch("");
    setDraft(codes); // start with the subjects already chosen
    setEditing(true);
    if (!allSubjects) {
      const res = await fetch("/api/subjects");
      if (res.status === 401) return router.push("/");
      const data = await res.json();
      setAllSubjects(data.subjects);
    }
  }

  function toggle(code) {
    setDraft((prev) => (prev.includes(code) ? prev.filter((c) => c !== code) : [...prev, code]));
  }

  function applyEdit() {
    if (draft.length === 0) return setEditError("Please select at least one subject.");
    setEditing(false);
    showCodes(draft);
  }

  function removeSubject(code) {
    showCodes(codes.filter((c) => c !== code));
  }

  const term = search.trim().toLowerCase();
  const visibleSubjects = (allSubjects || []).filter(
    (s) => !term || s.code.toLowerCase().includes(term) || s.name.toLowerCase().includes(term)
  );

  return (
    <>
      <div className="title-row">
        <h2>My Exam Timetable</h2>
        {!editing && (
          <button type="button" onClick={openEdit}>
            ✎ Edit subjects
          </button>
        )}
      </div>

      {editing && (
        <div className="edit-panel">
          <strong>Add or remove subjects</strong>
          <p className="hint">Your current subjects are already ticked. Tick the ones you forgot, untick any you don&apos;t need.</p>
          {editError && <div className="error">{editError}</div>}
          <input type="text" placeholder="Search subject code or name" value={search} onChange={(e) => setSearch(e.target.value)} />
          <div className="subjects">
            {allSubjects === null && <p>Loading…</p>}
            {allSubjects && visibleSubjects.length === 0 && <p className="hint">No subjects match your search.</p>}
            {visibleSubjects.map((s) => (
              <label key={s.code}>
                <input type="checkbox" checked={draft.includes(s.code)} onChange={() => toggle(s.code)} /> {s.code} – {s.name}
              </label>
            ))}
          </div>
          <p className="hint">{draft.length} subject(s) selected</p>
          <button type="button" onClick={applyEdit}>Update timetable</button>{" "}
          <button type="button" className="secondary" onClick={() => setEditing(false)}>Cancel</button>
        </div>
      )}

      {error && <div className="error">{error}</div>}
      {notFound.length > 0 && (
        <div className="error">Subject not found in timetable: {notFound.join(", ")}</div>
      )}
      {exams === null && !error && <p>Loading…</p>}
      {exams && exams.length === 0 && !error && <p>No exams matched your subjects.</p>}
      {exams && exams.length > 0 && (
        <table>
          <thead>
            <tr>
              <th>Subject Code</th>
              <th>Subject</th>
              <th>Exam Date</th>
              <th>Exam Time</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {exams.map((e) => (
              <tr key={e.subject_code}>
                <td>{e.subject_code}</td>
                <td>{e.subject_name}</td>
                <td>{e.date}</td>
                <td>{e.time}</td>
                <td>
                  <button
                    type="button"
                    className="remove"
                    title="Remove this subject"
                    aria-label={"Remove " + e.subject_code}
                    disabled={exams.length === 1}
                    onClick={() => removeSubject(e.subject_code)}
                  >
                    ✕
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
      <p>
        <Link href={"/subjects?codes=" + encodeURIComponent(codesKey)}>← Change subjects</Link> ·{" "}
        <Link href="/upload">Upload another timetable</Link>
      </p>
    </>
  );
}

export default function ResultsPage() {
  return (
    <Suspense fallback={<p>Loading…</p>}>
      <Results />
    </Suspense>
  );
}
