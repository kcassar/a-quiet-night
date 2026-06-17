import { useState, useRef, ChangeEvent, DragEvent } from "react";
import { useNavigate } from "react-router-dom";
import { useDocumentMeta } from "../lib/useDocumentMeta";
import { PageHeader } from "../components/PageHeader";
import { Button } from "../components/Button";
import { Card } from "../components/Card";
import { ProgressSteps } from "../components/ProgressSteps";
import { Accordion } from "../components/Accordion";
import { DisclaimerBanner } from "../components/DisclaimerBanner";
import { Icon } from "../components/Icon";
import { StatusChip } from "../components/StatusChip";

const LAST_UPLOAD_KEY = "sac:lastUploadId";

export function Upload() {
  useDocumentMeta({
    title: "Upload your CPAP data",
    description:
      "Drop a ZIP from your CPAP SD card or OSCAR export and get a clean per-night dashboard. Files are extracted, parsed and deleted automatically.",
    path: "/upload",
  });

  const navigate = useNavigate();
  const [file, setFile] = useState<File | null>(null);
  const [drag, setDrag] = useState(false);
  const [consent, setConsent] = useState(false);
  const [retain, setRetain] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Step indicator: 0 = prepare, 1 = upload, 2 = view dashboard.
  // We jump to 1 the moment a file is selected.
  const stepIndex = submitting ? 1 : file ? 1 : 0;

  function pickFile(f: File | null) {
    setError(null);
    if (!f) return setFile(null);
    if (!f.name.toLowerCase().endsWith(".zip")) {
      setError("Please choose a .zip file.");
      return;
    }
    setFile(f);
  }

  function onSelect(e: ChangeEvent<HTMLInputElement>) {
    pickFile(e.target.files?.[0] ?? null);
  }

  function onDrop(e: DragEvent<HTMLDivElement>) {
    e.preventDefault();
    setDrag(false);
    pickFile(e.dataTransfer.files?.[0] ?? null);
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!file || !consent || submitting) return;
    setSubmitting(true);
    setError(null);

    const formData = new FormData();
    formData.append("file", file);
    formData.append("consent", "true");
    formData.append("retain", retain ? "true" : "false");

    try {
      const res = await fetch("/api/upload", { method: "POST", body: formData });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(body.error || "Upload failed.");
        setSubmitting(false);
        return;
      }
      const uploadId = body.uploadId as string;
      try { localStorage.setItem(LAST_UPLOAD_KEY, uploadId); } catch { /* ignore */ }
      navigate(`/dashboard/${uploadId}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Network error — is the server running?");
      setSubmitting(false);
    }
  }

  return (
    <>
      <PageHeader
        title="Upload your CPAP data"
        subtitle="Drop a ZIP and get a per-night dashboard. Files are deleted after parsing."
      />

      <div className="app-content narrow">

        <DisclaimerBanner>
          A Quiet Night doesn't diagnose or recommend pressure changes. Please discuss any therapy adjustments with your sleep clinician.
        </DisclaimerBanner>

        <ProgressSteps
          currentIndex={stepIndex}
          steps={[
            { title: "Prepare a ZIP", description: "Copy your CPAP SD card to a folder, then zip it." },
            { title: "Upload", description: "Drop the file below. We extract, parse, and delete the raw files." },
            { title: "View dashboard", description: "We'll redirect you to your dashboard automatically." },
          ]}
        />

        {/* Long instructions tucked into an accordion to keep the page calm. */}
        <Accordion title="How to prepare your ZIP">
          <ol className="tight">
            <li>Take the SD card out of your CPAP machine and insert it into your computer.</li>
            <li>Copy the contents of the SD card into a folder.</li>
            <li>Right-click the folder and choose <em>compress</em> / <em>send to ZIP</em>.</li>
            <li>Upload the resulting <code>.zip</code> file below.</li>
          </ol>
          <p className="muted small mt-3">
            If you've used the free OSCAR application, you can also upload a ZIP of your OSCAR CSV or HTML exports.
          </p>
        </Accordion>

        <form onSubmit={submit} style={{ marginTop: "var(--space-6)" }}>
          <Card>
            <div
              className={`dropzone${drag ? " drag" : ""}`}
              onDragOver={e => { e.preventDefault(); setDrag(true); }}
              onDragLeave={() => setDrag(false)}
              onDrop={onDrop}
              onClick={() => inputRef.current?.click()}
              role="button"
              tabIndex={0}
              onKeyDown={e => { if (e.key === "Enter" || e.key === " ") inputRef.current?.click(); }}
              aria-label={file ? `Selected file: ${file.name}. Press Enter to replace.` : "Choose a ZIP file to upload"}
              aria-describedby="dropzone-instructions"
            >
              <div className="dropzone-icon"><Icon name="upload" size={20} aria-hidden="true" /></div>
              <strong>{file ? "Replace file" : "Drop your .zip here"}</strong>
              <div id="dropzone-instructions" className="muted small">or click to choose a file (max 250 MB)</div>
              <input
                ref={inputRef}
                type="file"
                accept=".zip,application/zip"
                onChange={onSelect}
                style={{ display: "none" }}
                aria-label="Upload ZIP file"
              />
              {file ? (
                <div className="file-meta" aria-live="polite">
                  <StatusChip tone="success">Selected</StatusChip>{" "}
                  <strong>{file.name}</strong> · {(file.size / (1024 * 1024)).toFixed(1)} MB
                </div>
              ) : null}
            </div>

            <div className="stack-3 mt-6">
              <label className="checkbox" htmlFor="consent">
                <input
                  id="consent"
                  type="checkbox"
                  checked={consent}
                  onChange={e => setConsent(e.target.checked)}
                />
                <span>
                  I understand this is <strong>not medical advice</strong> and I should
                  speak to my clinician before making therapy changes.
                </span>
              </label>

              <label className="checkbox" htmlFor="retain">
                <input
                  id="retain"
                  type="checkbox"
                  checked={retain}
                  onChange={e => setRetain(e.target.checked)}
                />
                <span>
                  Keep the extracted files on the server (optional). By default we
                  delete them after parsing.
                </span>
              </label>
            </div>

            {error ? (
              <div
                role="alert"
                aria-live="assertive"
                className="card mt-4"
                style={{
                  borderColor: "color-mix(in srgb, var(--discuss) 50%, var(--border))",
                  background: "var(--status-discuss-bg)",
                  padding: "var(--space-4) var(--space-5)",
                }}
              >
                <strong style={{ color: "var(--discuss)" }}>Upload failed</strong>
                <p className="small" style={{ margin: "var(--space-2) 0 0", color: "var(--text)" }}>{error}</p>
              </div>
            ) : null}

            <div className="btn-row mt-6">
              <Button
                type="submit"
                variant="primary"
                size="lg"
                disabled={!file || !consent || submitting}
              >
                {submitting ? "Uploading…" : "Upload and analyse"}
              </Button>
              <Button
                type="button"
                variant="ghost"
                onClick={() => {
                  setFile(null); setError(null);
                  if (inputRef.current) inputRef.current.value = "";
                }}
                disabled={submitting}
              >
                Clear
              </Button>
            </div>
          </Card>
        </form>

        {/* Privacy reassurance — visible by default. */}
        <Card className="mt-6">
          <div className="flex items-baseline justify-between gap-3">
            <h3 style={{ margin: 0 }}>What happens to your file</h3>
            <StatusChip tone="success">Private by default</StatusChip>
          </div>
          <ul className="tight mt-3 muted">
            <li>Your ZIP is stored only briefly in a secure temp folder.</li>
            <li>We scan it, extract it inside a sandbox, and reject anything unsafe (path traversal, executables, nested archives, zip bombs).</li>
            <li>Once parsed, both the ZIP and the extracted folder are deleted automatically.</li>
            <li>We keep only the derived per-night summary numbers so the dashboard works on return visits.</li>
          </ul>
        </Card>
      </div>
    </>
  );
}
