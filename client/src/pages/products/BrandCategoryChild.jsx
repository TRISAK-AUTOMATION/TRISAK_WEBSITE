import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { api } from "../../api/client.js";
import SeriesPage from "./SeriesPage.jsx";
import ProductDetail from "./ProductDetail.jsx";

/**
 * The route /products/:brandSlug/:categorySlug/:seriesSlug is ambiguous:
 * that third segment could be a Series slug, OR — for a product that
 * doesn't belong to any series — a Product slug directly. Product slugs
 * are globally unique, so we try that lookup first; if it 404s, we know
 * it's a series and hand off to SeriesPage (which does its own fetch).
 */
export default function BrandCategoryChild() {
  const { seriesSlug } = useParams();
  const [isProduct, setIsProduct] = useState(null); // null = still checking

  useEffect(() => {
    let cancelled = false;
    setIsProduct(null);
    api
      .getProductBySlug(seriesSlug)
      .then(() => {
        if (!cancelled) setIsProduct(true);
      })
      .catch(() => {
        if (!cancelled) setIsProduct(false);
      });
    return () => {
      cancelled = true;
    };
  }, [seriesSlug]);

  if (isProduct === null) {
    return (
      <section className="section" style={{ paddingTop: 160 }}>
        <div className="container">
          <p className="empty-state">Loading…</p>
        </div>
      </section>
    );
  }

  return isProduct ? <ProductDetail /> : <SeriesPage />;
}
