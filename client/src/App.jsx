import { Routes, Route, Navigate, useLocation } from "react-router-dom";
import { useEffect, useLayoutEffect, useRef } from "react";
import Header from "./components/Header.jsx";
import Footer from "./components/Footer.jsx";
import BackToTop from "./components/BackToTop.jsx";
import { useSiteSettings } from "./contexts/SiteSettingsContext.jsx";
import AdminGuard from "./components/AdminGuard.jsx";
import AdminLayout from "./components/AdminLayout.jsx";
import PopupModal from "./components/PopupModal.jsx";

import Home from "./pages/Home.jsx";
import History from "./pages/History.jsx";
import AutomationSolution from "./pages/AutomationSolution.jsx";
import SolutionPage from "./pages/SolutionPage.jsx";
import Contacts from "./pages/Contacts.jsx";
import Career from "./pages/Career.jsx";

import ProductsOverview from "./pages/products/ProductsOverview.jsx";
import ProductListingPage from "./pages/products/ProductListingPage.jsx";
import BrandCategoryChild from "./pages/products/BrandCategoryChild.jsx";
import ProductDetail from "./pages/products/ProductDetail.jsx";
import GuideOverview from "./pages/products/GuideOverview.jsx";
import SeriesGuide from "./pages/products/SeriesGuide.jsx";

import AdminLogin from "./pages/admin/AdminLogin.jsx";
import AdminDashboard from "./pages/admin/AdminDashboard.jsx";
import AdminHomeEditor from "./pages/admin/AdminHomeEditor.jsx";
import AdminHomeAutomation from "./pages/admin/AdminHomeAutomation.jsx";
import AdminHomeAutomationForm from "./pages/admin/AdminHomeAutomationForm.jsx";
import AdminHistoryEditor from "./pages/admin/AdminHistoryEditor.jsx";
import AdminHistoryTimeline from "./pages/admin/AdminHistoryTimeline.jsx";
import AdminHistoryTimelineForm from "./pages/admin/AdminHistoryTimelineForm.jsx";
import AdminHistoryStats from "./pages/admin/AdminHistoryStats.jsx";
import AdminHistoryStatForm from "./pages/admin/AdminHistoryStatForm.jsx";
import AdminHistoryOrg from "./pages/admin/AdminHistoryOrg.jsx";
import AdminHistoryOrgForm from "./pages/admin/AdminHistoryOrgForm.jsx";
import AdminProductsPageEditor from "./pages/admin/AdminProductsPageEditor.jsx";
import AdminContactsPageEditor from "./pages/admin/AdminContactsPageEditor.jsx";
import AdminCareerJobs from "./pages/admin/AdminCareerJobs.jsx";
import AdminCareerApplications from "./pages/admin/AdminCareerApplications.jsx";
import AdminFooterEditor from "./pages/admin/AdminFooterEditor.jsx";
import AdminAutomationSolution from "./pages/admin/AdminAutomationSolution.jsx";
import AdminSolutionPage from "./pages/admin/AdminSolutionPage.jsx";
import AdminCustomers from "./pages/admin/AdminCustomers.jsx";
import AdminIndustries from "./pages/admin/AdminIndustries.jsx";
import AdminIndustryForm from "./pages/admin/AdminIndustryForm.jsx";
import AdminProducts from "./pages/admin/AdminProducts.jsx";
import AdminProductForm from "./pages/admin/AdminProductForm.jsx";
import AdminProductImport from "./pages/admin/AdminProductImport.jsx";
import AdminBrandList from "./pages/admin/AdminBrandList.jsx";
import AdminBrandForm from "./pages/admin/AdminBrandForm.jsx";
import AdminCategoryList from "./pages/admin/AdminCategoryList.jsx";
import AdminCategoryForm from "./pages/admin/AdminCategoryForm.jsx";
import AdminSeriesList from "./pages/admin/AdminSeriesList.jsx";
import AdminSeriesForm from "./pages/admin/AdminSeriesForm.jsx";
import AdminSiteSettings from "./pages/admin/AdminSiteSettings.jsx";
import AdminUsers from "./pages/admin/AdminUsers.jsx";
import AdminAccount from "./pages/admin/AdminAccount.jsx";
import AdminMenu from "./pages/admin/AdminMenu.jsx";
import AdminContactRequests from "./pages/admin/AdminContactRequests.jsx";
import AdminPopup from "./pages/admin/AdminPopup.jsx";

/** Sends bookmarks of the old /admin/about/... editor URLs to /admin/history/... */
function AdminAboutRedirect() {
  const { pathname, search } = useLocation();
  return <Navigate to={pathname.replace(/^\/admin\/about/, "/admin/history") + search} replace />;
}

function ScrollToTop() {
  const { pathname, hash, state, key } = useLocation();
  const keepScroll = Boolean(state?.keepScroll);
  const last = useRef(null);
  useEffect(() => {
    const prev = last.current;
    last.current = { pathname, keepScroll };
    // a link to a section (/automation-solution/x#svc-1) lands on that section
    const target = hash && document.getElementById(decodeURIComponent(hash.slice(1)));
    if (target) {
      // layout position (offsetTop), not getBoundingClientRect: a scroll-reveal
      // section is still translated down when the page opens
      let y = 0;
      for (let n = target; n; n = n.offsetParent) y += n.offsetTop;
      window.scrollTo(0, y - (parseFloat(getComputedStyle(target).scrollMarginTop) || 0));
      return;
    }
    if (prev) {
      // query-only change (e.g. ?page=2, ?category=…): same page, keep the scroll position
      if (prev.pathname === pathname) return;
      // product filters rewrite the path as boxes are ticked (/products/omron →
      // /products/omron/sensors…); stepping to or from such an entry (including
      // with Back/Forward) is the same listing, so don't jump to the top
      if (keepScroll || prev.keepScroll) return;
    }
    window.scrollTo(0, 0);
  }, [pathname, hash, keepScroll, key]);
  return null;
}

/**
 * A short fade-in when the visitor moves to another page, so the new page
 * arrives instead of snapping in. The page's own elements are faded in place
 * (no wrapper: the header's styling looks at the shell's direct children);
 * the fixed header and floating buttons stay put. Not on the first load (the
 * pages have their own entrance), not for query-only or filter-path changes
 * (same page), not in admin, and not when reduced motion is asked for.
 */
const PAGE_FADE = { duration: 280, easing: "cubic-bezier(0.33, 1, 0.68, 1)" }; // ease-out, still visible

function usePageFade(shellRef) {
  const { pathname, state } = useLocation();
  const keepScroll = Boolean(state?.keepScroll);
  const last = useRef(null);
  useLayoutEffect(() => {
    const prev = last.current;
    last.current = { pathname, keepScroll };
    if (!prev || prev.pathname === pathname || keepScroll || prev.keepScroll) return;
    if (pathname.startsWith("/admin") || prev.pathname.startsWith("/admin")) return;
    if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return;
    const shell = shellRef.current;
    if (!shell || typeof shell.animate !== "function") return;
    for (const el of shell.children) {
      if (el.classList.contains("site-header") || getComputedStyle(el).position === "fixed") continue;
      el.animate([{ opacity: 0 }, { opacity: 1 }], PAGE_FADE);
    }
  }, [pathname, keepScroll, shellRef]);
}

export default function App() {
  const { pathname } = useLocation();
  const isAdmin = pathname.startsWith("/admin");
  const siteSettings = useSiteSettings();
  // Show the Header unless an admin has explicitly turned it off. While
  // settings are loading (or failed to load) we keep the Header visible.
  // no site header on admin pages (or when hidden in Settings): .page-shell--no-header drops its reserved space
  const showHeader = !isAdmin && siteSettings?.header_visible !== false;
  const glassButtons = !isAdmin && siteSettings?.glass_buttons === true;
  const shellRef = useRef(null);
  usePageFade(shellRef);

  // On <html> so portaled modals (contact / apply forms) pick it up too.
  useEffect(() => {
    document.documentElement.classList.toggle("glass-buttons", glassButtons);
  }, [glassButtons]);

  return (
    <div ref={shellRef} className={`page-shell${!showHeader ? " page-shell--no-header" : ""}`}>
      <ScrollToTop />
      {showHeader && <Header />}
      {!isAdmin && <PopupModal />}
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/history" element={<History />} />
        <Route path="/automation-solution" element={<AutomationSolution />} />
        <Route path="/automation-solution/:slug" element={<SolutionPage />} />
        <Route path="/contacts" element={<Contacts />} />
        <Route path="/career" element={<Career />} />

        {/* Products guide: the main series grouped by product type. The static
            "series" segment wins over the catalog's :brandSlug routes below. */}
        <Route path="/products/series" element={<GuideOverview />} />
        {/* a product type, e.g. /products/series/plc-hmi */}
        <Route path="/products/series/:typeSlug" element={<GuideOverview />} />
        {/* a series, e.g. /products/series/plc-hmi/nx-series */}
        <Route path="/products/series/:typeSlug/:seriesSlug" element={<SeriesGuide />} />

        {/* 01 — products overview */}
        <Route path="/products" element={<ProductsOverview />} />
        {/* The product listing. The four routes below are deliberately the SAME
            element: the filter sidebar moves between these URL shapes as boxes are
            ticked, and one shared element keeps the page mounted (no reload or
            refetch) while the URL — the source of truth for the filters — changes. */}
        {/* all latest products, grouped by category (static path wins over :brandSlug) */}
        <Route path="/products/latest" element={<ProductListingPage />} />
        {/* 02 — brand page */}
        <Route path="/products/:brandSlug" element={<ProductListingPage />} />
        {/* 03 — category page (scoped to brand) */}
        <Route path="/products/:brandSlug/:categorySlug" element={<ProductListingPage />} />
        {/* recursive subcategory drill-down (unlimited depth) */}
        <Route path="/products/:brandSlug/:categorySlug/cat/*" element={<ProductListingPage />} />
        {/* 04 — series page, OR a series-less product detail (resolved at runtime) */}
        <Route path="/products/:brandSlug/:categorySlug/:seriesSlug" element={<BrandCategoryChild />} />
        {/* 05 — product detail (product that belongs to a series) */}
        <Route
          path="/products/:brandSlug/:categorySlug/:seriesSlug/:productSlug"
          element={<ProductDetail />}
        />

        {/* admin */}
        <Route path="/admin/login" element={<AdminLogin />} />
        <Route
          path="/admin"
          element={
            <AdminGuard>
              <AdminLayout />
            </AdminGuard>
          }
        >
          <Route index element={<AdminDashboard />} />
          <Route path="home" element={<AdminHomeEditor />} />
          <Route path="home/automation-solutions" element={<AdminHomeAutomation />} />
          <Route path="home/automation-solutions/new" element={<AdminHomeAutomationForm />} />
          <Route path="home/automation-solutions/:id/edit" element={<AdminHomeAutomationForm />} />
          <Route path="history" element={<AdminHistoryEditor />} />
          <Route path="history/timeline" element={<AdminHistoryTimeline />} />
          <Route path="history/timeline/new" element={<AdminHistoryTimelineForm />} />
          <Route path="history/timeline/:id/edit" element={<AdminHistoryTimelineForm />} />
          <Route path="history/statistics" element={<AdminHistoryStats />} />
          <Route path="history/statistics/new" element={<AdminHistoryStatForm />} />
          <Route path="history/statistics/:id/edit" element={<AdminHistoryStatForm />} />
          <Route path="history/organization" element={<AdminHistoryOrg />} />
          <Route path="history/organization/new" element={<AdminHistoryOrgForm />} />
          <Route path="history/organization/:id/edit" element={<AdminHistoryOrgForm />} />
          {/* Old /admin/about URLs (the History editor's previous path) */}
          <Route path="about/*" element={<AdminAboutRedirect />} />
          <Route path="products-page" element={<AdminProductsPageEditor />} />
          <Route path="contact" element={<AdminContactsPageEditor />} />
          <Route path="career" element={<AdminCareerJobs />} />
          <Route path="career/applications" element={<AdminCareerApplications />} />
          <Route path="footer" element={<AdminFooterEditor />} />
          <Route path="automation-solution" element={<AdminAutomationSolution />} />
          <Route path="automation-solution/:id" element={<AdminSolutionPage />} />
          <Route path="customers" element={<AdminCustomers />} />
          <Route path="industries" element={<AdminIndustries />} />
          <Route path="industries/new" element={<AdminIndustryForm />} />
          <Route path="industries/:id/edit" element={<AdminIndustryForm />} />

          <Route path="brands" element={<AdminBrandList />} />
          <Route path="brands/new" element={<AdminBrandForm />} />
          <Route path="brands/:id/edit" element={<AdminBrandForm />} />

          <Route path="categories" element={<AdminCategoryList />} />
          <Route path="categories/new" element={<AdminCategoryForm />} />
          <Route path="categories/:id/edit" element={<AdminCategoryForm />} />

          <Route path="series" element={<AdminSeriesList />} />
          <Route path="series/new" element={<AdminSeriesForm />} />
          <Route path="series/:id/edit" element={<AdminSeriesForm />} />

          <Route path="products" element={<AdminProducts key="catalog" />} />
          <Route path="product-pages" element={<AdminProducts key="pages" pagesOnly />} />
          <Route path="products/new" element={<AdminProductForm />} />
          <Route path="products/import" element={<AdminProductImport />} />
          <Route path="products/:id/edit" element={<AdminProductForm />} />

          <Route path="settings/website" element={<AdminSiteSettings />} />
          <Route path="settings/users" element={<AdminUsers />} />
          <Route path="account" element={<AdminAccount />} />
          <Route path="menu" element={<AdminMenu />} />
          <Route path="contact-requests" element={<AdminContactRequests />} />
          {/* old URL — keep bookmarks working */}
          <Route path="leads" element={<Navigate to="/admin/contact-requests" replace />} />

          <Route path="popups" element={<AdminPopup />} />
        </Route>
      </Routes>
      {!isAdmin && <Footer />}
      {!isAdmin && <BackToTop />}
    </div>
  );
}
