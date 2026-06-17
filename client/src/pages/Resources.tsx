import { useEffect, useState } from "react";
import { api, GlossaryEntry } from "../api";
import { useDocumentMeta } from "../lib/useDocumentMeta";
import { PageHeader } from "../components/PageHeader";
import { Card } from "../components/Card";
import { Icon } from "../components/Icon";

export function Resources() {
  useDocumentMeta({
    title: "Resources, glossary and checklists",
    description:
      "Glossary of CPAP and sleep apnoea terms (AHI, OA, CA, leak rate, 95th percentile pressure...), plus printable checklists for your sleep clinic.",
    path: "/resources",
  });

  const [entries, setEntries] = useState<GlossaryEntry[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api.getGlossary().then(r => setEntries(r.entries)).catch(e => setError(e.message));
  }, []);

  return (
    <>
      <PageHeader title="Resources" subtitle="Glossary, checklists and external reading." />

      <div className="app-content">
        <div className="grid grid-2">
          <Card>
            <h3 style={{ marginBottom: "var(--space-2)" }}>Glossary</h3>
            <p className="muted small">Plain-English definitions for the terms you'll see on your CPAP machine and in clinic letters.</p>
            {error ? <p className="muted">Couldn't load the glossary: {error}</p> : null}
            <dl style={{ margin: "var(--space-4) 0 0" }}>
              {entries.map(e => (
                <div key={e.term} style={{ marginBottom: "var(--space-4)" }}>
                  <dt><strong>{e.term}</strong></dt>
                  <dd className="muted small" style={{ margin: "4px 0 0" }}>{e.definition}</dd>
                </div>
              ))}
            </dl>
          </Card>

          <div className="stack-4">
            <Card>
              <h3 style={{ marginBottom: "var(--space-2)" }}>Downloadable checklists</h3>
              <p className="muted small">Print these and take them to your next sleep clinic appointment.</p>
              <ul className="tight mt-3">
                <li><a href="/checklists/first-cpap-setup.txt" download>First CPAP setup checklist</a></li>
                <li><a href="/checklists/mask-leak-troubleshooting.txt" download>Mask leak troubleshooting checklist</a></li>
                <li><a href="/checklists/questions-for-clinic.txt" download>Questions for your sleep clinic</a></li>
              </ul>
              <p className="muted tiny mt-3">Plain text — print them or copy into your notes app.</p>
            </Card>

            <Card>
              <h3 style={{ marginBottom: "var(--space-2)" }}>External reading</h3>
              <ul className="tight">
                <li><a href="https://www.nhs.uk/conditions/sleep-apnoea/" target="_blank" rel="noopener noreferrer">NHS — Sleep apnoea overview <Icon name="external" size={12} /></a></li>
                <li><a href="https://www.brit-thoracic.org.uk/" target="_blank" rel="noopener noreferrer">British Thoracic Society <Icon name="external" size={12} /></a></li>
                <li><a href="https://www.americanthoracic.org/" target="_blank" rel="noopener noreferrer">American Thoracic Society <Icon name="external" size={12} /></a></li>
                <li><a href="https://www.sleepfoundation.org/sleep-apnea" target="_blank" rel="noopener noreferrer">National Sleep Foundation <Icon name="external" size={12} /></a></li>
                <li><a href="https://www.sleepapnea.org/" target="_blank" rel="noopener noreferrer">American Sleep Apnea Association <Icon name="external" size={12} /></a></li>
                <li><a href="https://www.apneaboard.com/wiki/index.php/OSCAR" target="_blank" rel="noopener noreferrer">Apnea Board — OSCAR documentation <Icon name="external" size={12} /></a></li>
              </ul>
              <p className="muted tiny mt-3">External sites are linked for convenience; we don't control their content.</p>
            </Card>
          </div>
        </div>
      </div>
    </>
  );
}
