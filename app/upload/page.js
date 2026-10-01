"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

// UPLOAD PAGE
export default function UploadPage() {
  const router = useRouter();
  const [file, setFile] = useState(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  // Only logged-in students may use this page.
  useEffect(() => {
    fetch("/api/subjects").then((res) => {
      if (res.status === 401) router.push("/");
    });
  }, [router]);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    if (!file) return setError("Please choose a timetable file to upload.");
    setBusy(true);
    const form = new FormData();
    form.append("timetable", file);
    const res = await fetch("/api/upload", { method: "POST", body: form });
    const data = await res.json();
    setBusy(false);
    if (res.status === 401) return router.push("/");
    if (!res.ok) return setError(data.error);
    router.push("/subjects");
  }

  return (
    <>
      <h2>Upload Exam Timetable</h2>
      <p className="hint">
        Upload the university exam timetable as a CSV file with the columns
        subject_code, subject_name, date, time.
      </p>
      {error && <div className="error">{error}</div>}
      <form onSubmit={handleSubmit}>
        <label htmlFor="timetable">Timetable file (.csv)</label>
        <input type="file" id="timetable" accept=".csv" onChange={(e) => setFile(e.target.files[0] || null)} />
        <button type="submit" disabled={busy}>{busy ? "Uploading…" : "Upload"}</button>
      </form>
    </>
  );
}
