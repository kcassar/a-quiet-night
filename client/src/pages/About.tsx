import { Link } from "react-router-dom";
import { useDocumentMeta } from "../lib/useDocumentMeta";
import { PageHeader } from "../components/PageHeader";
import { Card } from "../components/Card";

export function About() {
  useDocumentMeta({
    title: "About",
    description:
      "Why A Quiet Night exists, how the site is funded, and our privacy approach.",
    path: "/about",
  });

  return (
    <>
      <PageHeader title="About" subtitle="Why A Quiet Night exists, and how it stays free." />

      <div className="app-content narrow">
        <Card>
          <h2 style={{ marginBottom: "var(--space-3)" }}>Our mission</h2>
          <p>
            Most online information about sleep apnoea is either too clinical
            to be useful, or too commercial to trust. A Quiet Night is built
            to sit in the middle: clear writing, useful tools, and zero gimmicks.
          </p>
        </Card>
        <Card className="mt-4">
          <h2 style={{ marginBottom: "var(--space-3)" }}>The site is free</h2>
          <p>
            You don't pay anything to use this site. There's no premium tier,
            no paywalled "advanced" dashboard, no subscription. Everything you
            can see is everything we offer.
          </p>
        </Card>
        <Card className="mt-4">
          <h2 style={{ marginBottom: "var(--space-3)" }}>How we fund it</h2>
          <p>
            We plan to add affiliate links to a curated list of CPAP-related
            products in the future. If you buy through one of those links, we
            may receive a small commission at no extra cost to you. Affiliate
            content will be kept off our medical guidance pages — we don't want
            commercial incentives to influence what we say about therapy.
          </p>
        </Card>
        <Card className="mt-4">
          <h2 style={{ marginBottom: "var(--space-3)" }}>Privacy approach</h2>
          <p>
            The default for any CPAP data you upload is: we extract it, parse
            it, show you the dashboard, and delete the raw files. Nothing is
            shared with third parties. See the{" "}
            <Link to="/privacy">privacy &amp; terms</Link> page for the full
            policy.
          </p>
        </Card>
      </div>
    </>
  );
}
