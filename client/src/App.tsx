import { useEffect } from "react";
import { Routes, Route, Navigate, useLocation, useParams } from "react-router-dom";
import { PublicShell } from "./components/PublicShell";
import { DataShell } from "./components/DataShell";
import { Home } from "./pages/Home";
import { Learn } from "./pages/Learn";
import { CpapGuide } from "./pages/CpapGuide";
import { Upload } from "./pages/Upload";
import { Dashboard } from "./pages/Dashboard";
import { MyData } from "./pages/MyData";
import { Export } from "./pages/Export";
import { Articles } from "./pages/Articles";
import { Article } from "./pages/Article";
// import { Products } from "./pages/Products"; // Hidden until affiliate partnerships are set up
import { Resources } from "./pages/Resources";
import { About } from "./pages/About";
import { Privacy } from "./pages/Privacy";
import { NotFound } from "./pages/NotFound";

// Editorial body class controls typography (Fraunces for headings on the
// public/editorial pages; Inter everywhere on the My Data app pages).
function BodyClassController() {
  const { pathname } = useLocation();
  useEffect(() => {
    const isApp = pathname.startsWith("/my-data");
    document.body.classList.toggle("editorial", !isApp);
  }, [pathname]);
  return null;
}

// Tiny helpers for the deep-link redirects below — preserves the upload ID.
function DashboardRedirect() {
  const { uploadId } = useParams();
  return <Navigate to={`/my-data/dashboard/${uploadId ?? ""}`} replace />;
}

export default function App() {
  return (
    <>
      {/* Skip link for keyboard users to bypass navigation */}
      <a href="#main-content" className="skip-link">
        Skip to main content
      </a>
      <BodyClassController />
      <Routes>

        {/* ── Public (top nav, no sidebar) ── */}
        <Route element={<PublicShell />}>
          <Route path="/" element={<Home />} />

          {/* Learn — current single page; will split into a hub + topics in Phase 4 */}
          <Route path="/learn" element={<Learn />} />

          {/* CPAP Therapy — current CPAP Guide content; split in Phase 4 */}
          <Route path="/cpap-therapy" element={<CpapGuide />} />

          {/* Articles hub + individual article pages. Content lives in
              client/src/content/articles/. Adding a new article = a new
              file in that directory; no route changes needed. */}
          <Route path="/articles" element={<Articles />} />
          <Route path="/articles/:slug" element={<Article />} />

          {/* Products hidden until affiliate partnerships are set up */}
          <Route path="/products" element={<Navigate to="/" replace />} />
          <Route path="/resources" element={<Resources />} />
          <Route path="/about" element={<About />} />
          <Route path="/privacy" element={<Privacy />} />
        </Route>

        {/* ── My Data app (sidebar, no top nav) ── */}
        <Route element={<DataShell />}>
          <Route path="/my-data" element={<MyData />} />
          <Route path="/my-data/upload" element={<Upload />} />
          <Route path="/my-data/dashboard" element={<Dashboard />} />
          <Route path="/my-data/dashboard/:uploadId" element={<Dashboard />} />
          <Route path="/my-data/export" element={<Export />} />
        </Route>

        {/* ── Redirects for the old IA ── */}
        <Route path="/upload"               element={<Navigate to="/my-data/upload"    replace />} />
        <Route path="/dashboard"            element={<Navigate to="/my-data/dashboard" replace />} />
        <Route path="/dashboard/:uploadId"  element={<DashboardRedirect />} />
        <Route path="/cpap-guide"           element={<Navigate to="/cpap-therapy"      replace />} />
        <Route path="/sleep-apnea-guide"    element={<Navigate to="/learn"             replace />} />
        {/* Journal deliberately not exposed in this phase — anyone with an
            old bookmark lands back on the My Data hub. */}
        <Route path="/journal"              element={<Navigate to="/my-data"           replace />} />

        {/* 404 lives in the public shell so it looks like a normal page. */}
        <Route element={<PublicShell />}>
          <Route path="*" element={<NotFound />} />
        </Route>
      </Routes>
    </>
  );
}
