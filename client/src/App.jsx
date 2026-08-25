import { Routes, Route, useLocation } from "react-router-dom";
import { useEffect } from "react";
import Header from "./components/Header.jsx";
import Footer from "./components/Footer.jsx";
import AdminGuard from "./components/AdminGuard.jsx";
import AdminLayout from "./components/AdminLayout.jsx";

import Home from "./pages/Home.jsx";
import History from "./pages/History.jsx";
import AutomationSolution from "./pages/AutomationSolution.jsx";
import Contacts from "./pages/Contacts.jsx";

import ProductsOverview from "./pages/products/ProductsOverview.jsx";
import BrandPage from "./pages/products/BrandPage.jsx";
import CategoryPage from "./pages/products/CategoryPage.jsx";
import BrandCategoryChild from "./pages/products/BrandCategoryChild.jsx";
import ProductDetail from "./pages/products/ProductDetail.jsx";

import AdminLogin from "./pages/admin/AdminLogin.jsx";
import AdminDashboard from "./pages/admin/AdminDashboard.jsx";
import AdminHomeEditor from "./pages/admin/AdminHomeEditor.jsx";
import AdminProducts from "./pages/admin/AdminProducts.jsx";
import AdminProductForm from "./pages/admin/AdminProductForm.jsx";
import AdminBrandList from "./pages/admin/AdminBrandList.jsx";
import AdminBrandForm from "./pages/admin/AdminBrandForm.jsx";
import AdminCategoryList from "./pages/admin/AdminCategoryList.jsx";
import AdminCategoryForm from "./pages/admin/AdminCategoryForm.jsx";
import AdminSeriesList from "./pages/admin/AdminSeriesList.jsx";
import AdminSeriesForm from "./pages/admin/AdminSeriesForm.jsx";

function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
}

export default function App() {
  const { pathname } = useLocation();
  const isAdmin = pathname.startsWith("/admin");

  return (
    <div className="page-shell">
      <ScrollToTop />
      {!isAdmin && <Header />}
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/history" element={<History />} />
        <Route path="/automation-solution" element={<AutomationSolution />} />
        <Route path="/contacts" element={<Contacts />} />

        {/* 01 — products overview */}
        <Route path="/products" element={<ProductsOverview />} />
        {/* 02 — brand page */}
        <Route path="/products/:brandSlug" element={<BrandPage />} />
        {/* 03 — category page (scoped to brand) */}
        <Route path="/products/:brandSlug/:categorySlug" element={<CategoryPage />} />
        {/* recursive subcategory drill-down (unlimited depth) */}
        <Route path="/products/:brandSlug/:categorySlug/cat/*" element={<CategoryPage />} />
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
          <Route path="products/:id/edit" element={<AdminProductForm />} />
        </Route>
      </Routes>
      {!isAdmin && <Footer />}
    </div>
  );
}
