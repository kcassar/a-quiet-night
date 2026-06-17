import { useEffect } from "react";
import { useDocumentMeta } from "../lib/useDocumentMeta";
import { PageHeader } from "../components/PageHeader";
import { Card } from "../components/Card";
import { Button } from "../components/Button";
import { EmptyState } from "../components/EmptyState";

export function NotFound() {
  useDocumentMeta({
    title: "Page not found (404)",
    description: "That page doesn't exist on A Quiet Night.",
  });

  // 404 must not be indexed. We add the meta on mount and clean it up on
  // unmount so other routes aren't affected.
  useEffect(() => {
    const meta = document.createElement("meta");
    meta.name = "robots";
    meta.content = "noindex, nofollow";
    document.head.appendChild(meta);
    return () => { meta.remove(); };
  }, []);

  return (
    <>
      <PageHeader title="404" subtitle="That page doesn't exist." />
      <div className="app-content narrow">
        <Card>
          <EmptyState
            icon="search"
            title="Page not found"
            body="That page doesn't exist (or has moved). Try the home page, or jump straight into one of the guides."
            action={
              <div className="btn-row" style={{ justifyContent: "center" }}>
                <Button to="/" variant="primary">Home</Button>
                <Button to="/learn" variant="secondary">Sleep apnoea guide</Button>
                <Button to="/cpap-guide" variant="ghost">CPAP guide</Button>
              </div>
            }
          />
        </Card>
      </div>
    </>
  );
}
