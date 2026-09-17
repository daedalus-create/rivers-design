import { Suspense, useEffect } from "react";
import { Outlet, useLocation } from "react-router-dom";
import Header from "./Header";
import Footer from "./Footer";

export default function Layout() {
  const { pathname, hash } = useLocation();

  useEffect(() => {
    if (hash) {
      const el = document.getElementById(hash.slice(1));
      if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "start" });
        return;
      }
    }
    window.scrollTo(0, 0);
  }, [pathname, hash]);

  return (
    <>
      {/* Contour drawing in the side margins. Decorative only, so it is
          hidden from assistive tech and takes no pointer events. */}
      <div className="page-backdrop" aria-hidden="true" />
      <Header />
      <main>
        {/* Suspense sits here, inside Layout, rather than around the whole
            route tree: every page but Home is a separate lazy chunk now
            (see App.jsx), and this way a chunk still loading only blanks
            the page content - the header and its nav stay put instead of
            the whole screen flashing to the fallback on every navigation. */}
        <Suspense fallback={null}>
          <Outlet />
        </Suspense>
      </main>
      <Footer />
    </>
  );
}
