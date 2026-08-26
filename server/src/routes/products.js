import { Router } from "express";
import {
  listBrands,
  getBrand,
  listCategories,
  listCategoriesForBrand,
  getCategory,
  getCategoryById,
  getCategoryChildren,
  getCategoryBreadcrumb,
  listSeries,
  getSeries,
  listProducts,
  getFeaturedProducts,
  getProductBySlug,
  listSolutions,
  listIndustries,
} from "../controllers/productsController.js";
import { getHomeContent } from "../controllers/homeContentController.js";

const router = Router();

router.get("/home-content", getHomeContent);

router.get("/brands", listBrands);
router.get("/brands/:brandSlug", getBrand);
router.get("/brands/:brandSlug/categories", listCategoriesForBrand);

router.get("/categories", listCategories);
router.get("/categories/id/:id", getCategoryById);
router.get("/categories/:id/children", getCategoryChildren);
router.get("/categories/:id/breadcrumb", getCategoryBreadcrumb);
router.get("/categories/:categorySlug", getCategory);

router.get("/series", listSeries);
router.get("/series/:brandSlug/:categorySlug/:seriesSlug", getSeries);

router.get("/products", listProducts);
router.get("/products/featured", getFeaturedProducts);
router.get("/products/detail/:slug", getProductBySlug);

router.get("/solutions", listSolutions);
router.get("/industries", listIndustries);

export default router;
