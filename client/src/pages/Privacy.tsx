import { useDocumentMeta } from "../lib/useDocumentMeta";
import { PageHeader } from "../components/PageHeader";
import { Card } from "../components/Card";

export function Privacy() {
  useDocumentMeta({
    title: "Privacy & terms",
    description:
      "Privacy policy, data retention, medical disclaimer, affiliate disclosure and terms of use for A Quiet Night.",
    path: "/privacy",
  });

  return (
    <>
      <PageHeader title="Privacy & terms" subtitle="What we keep, what we delete, and how decisions get made." />

      <div className="app-content narrow">
        <Card>
          <h2 style={{ marginBottom: "var(--space-3)" }}>Medical disclaimer</h2>
          <p>
            A Quiet Night is for educational and informational purposes only.
            Nothing on this site is medical advice. We do not diagnose
            conditions, prescribe treatment, or recommend pressure changes. Any
            decision to change your therapy, mask, medication or lifestyle
            should be made with a qualified sleep clinician.
          </p>
        </Card>

        <Card className="mt-4">
          <h2 style={{ marginBottom: "var(--space-3)" }}>Upload privacy</h2>
          <p>
            If you upload a CPAP ZIP file, the file is stored briefly in a
            temporary folder on the server, scanned for unsafe content,
            extracted, parsed for summary metrics, and then both the original
            ZIP <strong>and</strong> the extracted folder are deleted by default.
          </p>
          <p>
            The summary metrics (one row per night) are stored in our database
            so the dashboard can re-load if you visit the page again. They
            never leave our server and are never sold or shared.
          </p>
        </Card>

        <Card className="mt-4">
          <h2 style={{ marginBottom: "var(--space-3)" }}>Data retention</h2>
          <ul className="tight">
            <li>Uploaded ZIP file: deleted immediately after parsing.</li>
            <li>Extracted SD-card folder: deleted immediately after parsing.</li>
            <li>Per-night summary numbers: kept until you ask us to delete them.</li>
          </ul>
          <p className="mt-3">We don't log filenames, raw uploaded content or any free-text health information.</p>
        </Card>

        <Card className="mt-4">
          <h2 style={{ marginBottom: "var(--space-3)" }}>Affiliate disclosure</h2>
          <p>
            Some links on the products page are affiliate links. If you buy a
            product after clicking one, we may earn a commission at no extra
            cost to you. We don't accept payment to recommend specific products
            on educational pages.
          </p>
        </Card>

        <Card className="mt-4">
          <h2 style={{ marginBottom: "var(--space-3)" }}>Cookies and analytics</h2>
          <p>
            The MVP doesn't run third-party analytics or advertising trackers.
            If we add lightweight, privacy-respecting analytics later, we'll
            update this notice and only enable them with your consent.
          </p>
        </Card>

        <Card className="mt-4">
          <h2 style={{ marginBottom: "var(--space-3)" }}>Terms of use</h2>
          <p>
            By using this site you agree that the content is informational
            only, that you'll discuss any therapy changes with a clinician,
            and that you won't upload data you're not comfortable sharing
            with the server processing it.
          </p>
        </Card>
      </div>
    </>
  );
}
