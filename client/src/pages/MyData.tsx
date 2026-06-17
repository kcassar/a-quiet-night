import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useDocumentMeta } from "../lib/useDocumentMeta";
import { PageHeader } from "../components/PageHeader";
import { Card } from "../components/Card";
import { Button } from "../components/Button";
import { Icon } from "../components/Icon";
import { EmptyState } from "../components/EmptyState";

const LAST_UPLOAD_KEY = "sac:lastUploadId";

// Landing/hub page for /my-data. Shows a "start here" empty state when
// the user has no uploads yet, or a quick link to their most recent
// dashboard if they have one. The dashboard itself lives at
// /my-data/dashboard.
export function MyData() {
  useDocumentMeta({
    title: "My Data — A Quiet Night",
    description:
      "Upload OSCAR or CPAP data and explore a calm, plain-English dashboard. Private by default. No accounts.",
    path: "/my-data",
  });

  const [lastUploadId, setLastUploadId] = useState<string | null>(null);

  useEffect(() => {
    try {
      const last = localStorage.getItem(LAST_UPLOAD_KEY);
      if (last) setLastUploadId(last);
    } catch { /* ignore */ }
  }, []);

  return (
    <>
      <PageHeader
        title="My Data"
        subtitle="A private, one-time-use tool for understanding your CPAP data."
        actions={
          <Button to="/my-data/upload" variant="primary" size="sm" iconLeft={<Icon name="upload" size={14} />}>
            <span style={{ fontSize: "var(--fs-13)" }}>Upload</span>
          </Button>
        }
      />

      <div className="app-content">
        {lastUploadId ? (
          <Card>
            <div className="flex gap-3 items-baseline justify-between flex-wrap">
              <div>
                <h2 style={{ margin: 0 }}>Welcome back.</h2>
                <p className="muted small mt-2" style={{ margin: 0 }}>
                  Your most recent dashboard is still here.
                </p>
              </div>
              <div className="flex gap-2">
                <Button to={`/my-data/dashboard/${lastUploadId}`} variant="primary">
                  Open dashboard
                </Button>
                <Button to="/my-data/upload" variant="secondary">
                  Upload new data
                </Button>
              </div>
            </div>
          </Card>
        ) : (
          <Card>
            <EmptyState
              icon="upload"
              title="Nothing uploaded yet."
              body={
                <>
                  Drop in a ZIP from your CPAP SD card or an OSCAR export. We
                  extract, parse and delete the raw files automatically — only
                  the per-night summary numbers are kept so the dashboard
                  works on return visits.
                </>
              }
              action={
                <div className="btn-row" style={{ justifyContent: "center" }}>
                  <Button to="/my-data/upload" variant="primary" iconLeft={<Icon name="upload" size={14} />}>
                    Upload CPAP data
                  </Button>
                  <Button to="/cpap-therapy" variant="ghost">
                    Or read the CPAP guide first
                  </Button>
                </div>
              }
            />
          </Card>
        )}

        {/* Three-card overview of what you'll find in this section. */}
        <div className="grid grid-3 mt-6">
          <Card hoverPop>
            <div className="empty-icon" style={{ margin: "0 0 var(--space-3)" }}>
              <Icon name="upload" size={22} />
            </div>
            <h3 style={{ marginBottom: "var(--space-2)" }}>Upload</h3>
            <p className="muted small">
              A 3-step guided upload. ZIP only, scanned and sandboxed
              before extraction.
            </p>
            <p className="small mt-3">
              <Link to="/my-data/upload">Open upload →</Link>
            </p>
          </Card>
          <Card hoverPop>
            <div className="empty-icon" style={{ margin: "0 0 var(--space-3)" }}>
              <Icon name="spark" size={22} />
            </div>
            <h3 style={{ marginBottom: "var(--space-2)" }}>Dashboard</h3>
            <p className="muted small">
              Per-night metrics, trends, distribution and patterns — with
              plain-English explanations and a softer view for new users.
            </p>
            <p className="small mt-3">
              <Link to="/my-data/dashboard">Open dashboard →</Link>
            </p>
          </Card>
          <Card hoverPop>
            <div className="empty-icon" style={{ margin: "0 0 var(--space-3)" }}>
              <Icon name="download" size={22} />
            </div>
            <h3 style={{ marginBottom: "var(--space-2)" }}>Export</h3>
            <p className="muted small">
              Download a print-ready PDF or CSV of your summary to take
              to your sleep clinic.
            </p>
            <p className="small mt-3">
              <Link to="/my-data/export">Open export →</Link>
            </p>
          </Card>
        </div>
      </div>
    </>
  );
}
