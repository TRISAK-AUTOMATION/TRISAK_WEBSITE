import { Routes, Route, Navigate, useLocation } from "react-router-dom";
import { useEffect, useRef } from "react";
import Header from "./components/Header.jsx";
import Footer from "./components/Footer.jsx";
import { useSiteSettings } from "./contexts/SiteSettingsContext.jsx";
import AdminGuard from "./components/AdminGuard.jsx";
import AdminLayout from "./components/AdminLayout.jsx";
import PopupModal from "./components/PopupModal.jsx";

import Home from "./pages/Home.jsx";
import History from "./pages/History.jsx";
import AutomationSolution from "./pages/AutomationSolution.jsx";
import Contacts from "./pages/Contacts.jsx";

import ProductsOverview from "./pages/products/ProductsOverview.jsx";
import ProductListingPage from "./pages/products/ProductListingPage.jsx";
import BrandCategoryChild from "./pages/products/BrandCategoryChild.jsx";
import ProductDetail from "./pages/products/ProductDetail.jsx";

import AdminLogin from "./pages/admin/AdminLogin.jsx";
import AdminDashboard from "./pages/admin/AdminDashboard.jsx";
import AdminHomeEditor from "./pages/admin/AdminHomeEditor.jsx";
import AdminAboutEditor from "./pages/admin/AdminAboutEditor.jsx";
import AdminHistoryTimeline from "./pages/admin/AdminHistoryTimeline.jsx";
import AdminHistoryTimelineForm from "./pages/admin/AdminHistoryTimelineForm.jsx";
import AdminHistoryStats from "./pages/admin/AdminHistoryStats.jsx";
import AdminHistoryStatForm from "./pages/admin/AdminHistoryStatForm.jsx";
import AdminHistoryOrg from "./pages/admin/AdminHistoryOrg.jsx";
import AdminHistoryOrgForm from "./pages/admin/AdminHistoryOrgForm.jsx";
import AdminProductsPageEditor from "./pages/admin/AdminProductsPageEditor.jsx";
import AdminContactsPageEditor from "./pages/admin/AdminContactsPageEditor.jsx";
import AdminFooterEditor from "./pages/admin/AdminFooterEditor.jsx";
import AdminAutomationSolution from "./pages/admin/AdminAutomationSolution.jsx";
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
import AdminMenu from "./pages/admin/AdminMenu.jsx";
import AdminContactRequests from "./pages/admin/AdminContactRequests.jsx";
import AdminPopup from "./pages/admin/AdminPopup.jsx";

function ScrollToTop() {
  const { pathname, state, key } = useLocation();
  const keepScroll = Boolean(state?.keepScroll);
  const last = useRef(null);
  useEffect(() => {
    const prev = last.current;
    last.current = { pathname, keepScroll };
    if (prev) {
      // query-only change (e.g. ?page=2, ?category=…): same page, keep the scroll position
      if (prev.pathname === pathname) return;
      // product filters rewrite the path as boxes are ticked (/products/omron →
      // /products/omron/sensors…); stepping to or from such an entry (including
      // with Back/Forward) is the same listing, so don't jump to the top
      if (keepScroll || prev.keepScroll) return;
    }
    window.scrollTo(0, 0);
  }, [pathname, keepScroll, key]);
  return null;
}

export default function App() {
  const { pathname } = useLocation();
  const isAdmin = pathname.startsWith("/admin");
  const siteSettings = useSiteSettings();
  // Show the Header unless an admin has explicitly turned it off. While
  // settings are loading (or failed to load) we keep the Header visible.
  const showHeader = !isAdmin && siteSettings?.header_visible !== false;

  return (
    <div className={`page-shell${!isAdmin && !showHeader ? " page-shell--no-header" : ""}`}>
      <ScrollToTop />
      {showHeader && <Header />}
      {!isAdmin && <PopupModal />}
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/history" element={<History />} />
        <Route path="/automation-solution" element={<AutomationSolution />} />
        <Route path="/contacts" element={<Contacts />} />

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
          <Route path="about" element={<AdminAboutEditor />} />
          <Route path="about/timeline" element={<AdminHistoryTimeline />} />
          <Route path="about/timeline/new" element={<AdminHistoryTimelineForm />} />
          <Route path="about/timeline/:id/edit" element={<AdminHistoryTimelineForm />} />
          <Route path="about/statistics" element={<AdminHistoryStats />} />
          <Route path="about/statistics/new" element={<AdminHistoryStatForm />} />
          <Route path="about/statistics/:id/edit" element={<AdminHistoryStatForm />} />
          <Route path="about/organization" element={<AdminHistoryOrg />} />
          <Route path="about/organization/new" element={<AdminHistoryOrgForm />} />
          <Route path="about/organization/:id/edit" element={<AdminHistoryOrgForm />} />
          <Route path="products-page" element={<AdminProductsPageEditor />} />
          <Route path="contact" element={<AdminContactsPageEditor />} />
          <Route path="footer" element={<AdminFooterEditor />} />
          <Route path="automation-solution" element={<AdminAutomationSolution />} />
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

          <Route path="products" element={<AdminProducts />} />
          <Route path="products/new" element={<AdminProductForm />} />
          <Route path="products/import" element={<AdminProductImport />} />
          <Route path="products/:id/edit" element={<AdminProductForm />} />

          <Route path="settings/website" element={<AdminSiteSettings />} />
          <Route path="menu" element={<AdminMenu />} />
          <Route path="contact-requests" element={<AdminContactRequests />} />
          {/* old URL — keep bookmarks working */}
          <Route path="leads" element={<Navigate to="/admin/contact-requests" replace />} />

          <Route path="popups" element={<AdminPopup />} />
        </Route>
      </Routes>
      {!isAdmin && <Footer />}
    </div>
  );
}
