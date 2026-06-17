import { Link, Outlet } from "react-router-dom";
import { PublicTopNav } from "./PublicTopNav";

// Layout for every public page (everything outside /my-data).
//
// Editorial feel: top nav + breathable content area + quiet footer. No
// sidebar, no bottom nav. The body class is set to "editorial" by
// BodyClassController in App.tsx so headings use Fraunces.
export function PublicShell() {
  return (
    <div className="public-shell">
      <PublicTopNav />
      <main id="main-content" className="public-main">
        <Outlet />
      </main>
      <PublicFooter />
    </div>
  );
}

function PublicFooter() {
  const year = new Date().getFullYear();
  return (
    <footer className="public-footer">
      <div className="public-footer-inner">
        <div className="public-footer-brand">
          <strong>A Quiet Night</strong>
          <p className="muted small">
            Plain-English sleep apnoea &amp; CPAP companion.
            Educational only — not medical advice.
          </p>
        </div>
        <div className="public-footer-columns">
          <div>
            <h4>Learn</h4>
            <ul>
              <li><Link to="/learn">Sleep apnoea</Link></li>
              <li><Link to="/cpap-therapy">CPAP therapy</Link></li>
              <li><Link to="/articles">Articles</Link></li>
            </ul>
          </div>
          <div>
            <h4>Use</h4>
            <ul>
              <li><Link to="/my-data/upload">Upload data</Link></li>
              <li><Link to="/my-data/dashboard">Dashboard</Link></li>
              {/* <li><Link to="/products">Products</Link></li> */}{/* Hidden until affiliate partnerships are set up */}
            </ul>
          </div>
          <div>
            <h4>About</h4>
            <ul>
              <li><Link to="/about">About us</Link></li>
              <li><Link to="/resources">Resources</Link></li>
              <li><Link to="/privacy">Privacy &amp; terms</Link></li>
            </ul>
          </div>
        </div>
      </div>
      <div className="public-footer-bottom">
        © {year} A Quiet Night.
      </div>
    </footer>
  );
}
