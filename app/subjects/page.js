"use client";
import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { normaliseCode } from "@/lib/timetable";

// SUBJECT SELECTION PAGE
// If we come back from the results page (?codes=...), the previous choices stay ticked.
function Subjects() {
  const router = useRouter();
  const params = useSearchParams();
  const [subjects, setSubjects] = useState(null);
  const [selected, setSelected] = useState(() =>
    (params.get("codes") || "").split(",").map(normaliseCode).filter(Boolean)
  );
  const [typed, setTyped] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/subjects").then(async (res) => {
      if (res.status === 401) return router.push("/");
      const data = await res.json();
      setSubjects(data.subjects);
    });
  }, [router]);

  function toggle(code) {
    setSelected((prev) => (prev.includes(code) ? prev.filter((c) => c !== code) : [...prev, code]));
  }

  function handleSubmit(e) {
    e.preventDefault();
    // Ticked subjects + subject codes typed in the box (comma separated)
    const codes = [...selected, ...typed.split(",")].map((c) => c.trim()).filter(Boolean);
    if (codes.length === 0) return setError("Please select at least one subject.");
    router.push("/results?codes=" + encodeURIComponent(codes.join(",")));
  }

  if (subjects === null) return <p>Loading…</p>;

  if (subjects.length === 0) {
    return (
      <>
        <h2>Select Your Subjects</h2>
        <div className="error">Please upload your exam timetable first.</div>
        <Link href="/upload">Go to upload</Link>
      </>
    );
  }

  return (
    <>
      <h2>Select Your Subjects</h2>
      {error && <div className="error">{error}</div>}
      <form onSubmit={handleSubmit}>
        <label>Tick your subjects</label>
        <div className="subjects">
          {subjects.map((s) => (
            <label key={s.code}>
              <input type="checkbox" checked={selected.includes(s.code)} onChange={() => toggle(s.code)} /> {s.code} – {s.name}
            </label>
          ))}
        </div>
        <label htmlFor="typed">Or type subject codes</label>
        <input type="text" id="typed" placeholder="e.g. ICT 2223, ICT 2233" value={typed} onChange={(e) => setTyped(e.target.value)} />
        <p className="hint">Separate several codes with commas.</p>
        <button type="submit">Extract Timetable</button>
      </form>
    </>
  );
}

export default function SubjectsPage() {
  return (
    <Suspense fallback={<p>Loading…</p>}>
      <Subjects />
    </Suspense>
  );
}
