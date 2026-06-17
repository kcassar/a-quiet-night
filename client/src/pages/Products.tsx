import { useEffect, useState } from "react";
import { api, Product, Retailer } from "../api";
import { useDocumentMeta } from "../lib/useDocumentMeta";
import { PageHeader } from "../components/PageHeader";
import { Card } from "../components/Card";
import { Button } from "../components/Button";
import { Icon } from "../components/Icon";
import { StatusChip } from "../components/StatusChip";
import { EmptyState } from "../components/EmptyState";
import { SectionHeader } from "../components/SectionHeader";
import { RetailerCard } from "../components/RetailerCard";

export function Products() {
  useDocumentMeta({
    title: "CPAP retailers and accessories",
    description:
      "Where to buy CPAP gear in Europe — affiliate-funded directory of online retailers, plus a short list of accessories we like. Clearly disclosed.",
    path: "/products",
  });

  // Retailers (primary content)
  const [retailers, setRetailers] = useState<Retailer[]>([]);
  const [retailersError, setRetailersError] = useState<string | null>(null);

  // Individual accessories (kept as a secondary section beneath)
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [tags, setTags] = useState<string[]>([]);
  const [category, setCategory] = useState<string>("");
  const [tag, setTag] = useState<string>("");
  const [productsError, setProductsError] = useState<string | null>(null);

  useEffect(() => {
    api.getRetailers()
      .then(r => setRetailers(r.retailers))
      .catch(e => setRetailersError(e.message));
  }, []);

  useEffect(() => {
    api.getProducts({ category: category || undefined, tag: tag || undefined })
      .then(r => { setProducts(r.products); setCategories(r.categories); setTags(r.tags); })
      .catch(e => setProductsError(e.message));
  }, [category, tag]);

  return (
    <>
      <PageHeader
        title="Where to buy"
        subtitle="A short, hand-picked directory of CPAP retailers — plus a few accessories we like."
      />

      <div className="app-content">

        {/* ── Affiliate disclosure ────────────────────────────── */}
        <Card style={{
          background: "linear-gradient(140deg, color-mix(in srgb, var(--accent-blue) 14%, var(--surface)), var(--surface))",
          marginBottom: "var(--space-6)",
        }}>
          <div className="flex gap-3 items-baseline">
            <Icon name="info" size={18} />
            <div>
              <h3 style={{ margin: 0 }}>Affiliate disclosure</h3>
              <p className="muted small mt-2" style={{ margin: 0 }}>
                The retailer cards below contain affiliate links. If you buy
                something after clicking one, we may earn a small commission
                at no extra cost to you. That income keeps the rest of A
                Quiet Night free and ad-free. We never make medical claims —
                product or therapy choices belong with your sleep clinician.
              </p>
            </div>
          </div>
        </Card>

        {/* ── Retailer cards (primary) ────────────────────────── */}
        <SectionHeader
          title="CPAP retailers"
          subtitle="Online stores that ship CPAP equipment, ranked by our editorial judgement."
        />

        {retailersError ? (
          <Card>
            <EmptyState icon="info" title="Couldn't load retailers" body={retailersError} />
          </Card>
        ) : retailers.length === 0 ? (
          <Card>
            <EmptyState icon="search" title="No retailers configured yet." />
          </Card>
        ) : (
          <div className="retailer-grid">
            {retailers.map(r => <RetailerCard key={r.id} retailer={r} />)}
          </div>
        )}

        {/* ── Accessories (secondary) ─────────────────────────── */}
        <SectionHeader
          title="Accessories we like"
          subtitle="Specific items rather than stores. Filter by category or who they suit."
        />

        <div className="flex gap-3 items-center mb-6 flex-wrap">
          <div className="field" style={{ marginBottom: 0, minWidth: 200 }}>
            <label htmlFor="cat">Category</label>
            <select id="cat" value={category} onChange={e => setCategory(e.target.value)}>
              <option value="">All categories</option>
              {categories.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div className="field" style={{ marginBottom: 0, minWidth: 200 }}>
            <label htmlFor="tag">Best for</label>
            <select id="tag" value={tag} onChange={e => setTag(e.target.value)}>
              <option value="">Any</option>
              {tags.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
        </div>

        {productsError ? <p>Couldn't load products: {productsError}</p> : null}

        {products.length === 0 && !productsError ? (
          <Card>
            <EmptyState icon="search" title="No products match those filters." body="Try clearing the filters above." />
          </Card>
        ) : null}

        <div className="grid grid-2">
          {products.map(p => (
            <Card key={p.id} hoverPop>
              <div className="flex items-baseline justify-between gap-3">
                <h3 style={{ marginBottom: 4 }}>{p.name}</h3>
                <StatusChip tone="neutral">{p.category}</StatusChip>
              </div>
              <p className="muted small">{p.description}</p>
              <div className="flex flex-wrap gap-2 mt-3">
                {p.best_for_tags.map(t => <StatusChip key={t} tone="info" dot={false}>{t}</StatusChip>)}
              </div>
              <div className="grid grid-2 mt-4" style={{ gap: "var(--space-3)" }}>
                <div>
                  <h4 style={{ fontSize: "var(--fs-12)", letterSpacing: "0.16em", textTransform: "uppercase", color: "var(--text-muted)", margin: 0, marginBottom: "var(--space-2)" }}>Why it may help</h4>
                  <ul className="tight" style={{ marginTop: 0 }}>
                    {p.pros.map(x => <li key={x} style={{ fontSize: "var(--fs-14)" }}>{x}</li>)}
                  </ul>
                </div>
                <div>
                  <h4 style={{ fontSize: "var(--fs-12)", letterSpacing: "0.16em", textTransform: "uppercase", color: "var(--text-muted)", margin: 0, marginBottom: "var(--space-2)" }}>Trade-offs</h4>
                  <ul className="tight" style={{ marginTop: 0 }}>
                    {p.cons.map(x => <li key={x} style={{ fontSize: "var(--fs-14)" }}>{x}</li>)}
                  </ul>
                </div>
              </div>
              <div className="btn-row mt-4">
                {p.affiliate_url ? (
                  <Button
                    href={p.affiliate_url}
                    variant="primary"
                    size="sm"
                    iconRight={<Icon name="external" size={14} />}
                    target="_blank"
                    rel="noopener noreferrer sponsored"
                  >
                    View product
                  </Button>
                ) : null}
                {p.fallback_url ? (
                  <Button
                    href={p.fallback_url}
                    variant="ghost"
                    size="sm"
                    iconRight={<Icon name="external" size={14} />}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Manufacturer page
                  </Button>
                ) : null}
              </div>
            </Card>
          ))}
        </div>
      </div>
    </>
  );
}
