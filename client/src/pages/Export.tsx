import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useDocumentMeta } from "../lib/useDocumentMeta";
import { PageHeader } from "../components/PageHeader";
import { Card } from "../components/Card";
import { Button } from "../components/Button";
import { Icon } from "../components/Icon";
import { EmptyState } from "../components/EmptyState";

const LAST_UPLOAD_KEY = "sac:lastUploadId";

// Lightweight hub for taking your data out — PDF for a clinician, CSV
// for spreadsheets. Acts on the most-recent upload. The actual export
// endpoints (/api/upload/:id/export/{pdf,csv}) are unchanged.
export function Export() {
  useDocumentMeta({
    title: "Export your data",
    description:
      "Download a clinician-friendly PDF or a CSV summary of your CPAP data from A Quiet Night.",
    path: "/my-data/export",
  });

  const [uploadId, setUploadId] = useState<string | null>(null);

  useEffect(() => {
    try {
      const last = localStorage.getItem(LAST_UPLOAD_KEY);
      if (last) setUploadId(last);
    } catch { /* ignore */ }
  }, []);

  return (
    <>
      <PageHeader
        title="Export"
        subtitle="Download a clinician-friendly summary of your most recent upload."
      />

      <div className="app-content narrow">
        {!uploadId ? (
          <Card>
            <EmptyState
              icon="download"
              title="Nothing to export yet."
              body="Upload your CPAP data first, then come back here for a print-ready PDF or a CSV."
              action={
                <Button to="/my-data/upload" variant="primary" iconLeft={<Icon name="upload" size={14} />}>
                  Upload CPAP data
                </Button>
              }
            />
          </Card>
        ) : (
          <>
            <Card>
              <div className="flex items-baseline justify-between gap-3 mb-3 flex-wrap">
                <div>
                  <h3 style={{ margin: 0 }}>PDF report</h3>
                  <p className="muted small mt-2" style={{ margin: 0 }}>
                    Five-page summary: headline metrics, trends, distribution,
                    heat calendar, and a per-night table. Designed to be
                    printed and handed to your clinic.
                  </p>
                </div>
                <Button
                  href={`/api/upload/${uploadId}/export/pdf`}
                  variant="primary"
                  iconLeft={<Icon name="download" size={14} />}
                >
                  Download PDF
                </Button>
              </div>
            </Card>

            <Card className="mt-4">
              <div className="flex items-baseline justify-between gap-3 mb-3 flex-wrap">
                <div>
                  <h3 style={{ margin: 0 }}>CSV summary</h3>
                  <p className="muted small mt-2" style={{ margin: 0 }}>
                    One row per night, useful for spreadsheets or other tools.
                  </p>
                </div>
                <Button
                  href={`/api/upload/${uploadId}/export/csv`}
                  variant="secondary"
                  iconLeft={<Icon name="download" size={14} />}
                >
                  Download CSV
                </Button>
              </div>
            </Card>

            <p className="muted small mt-6">
              Want a different upload? Open the{" "}
              <Link to={`/my-data/dashboard/${uploadId}`}>dashboard</Link>{" "}
              or{" "}
              <Link to="/my-data/upload">upload a new file</Link>.
            </p>
          </>
        )}
      </div>
    </>
  );
}
