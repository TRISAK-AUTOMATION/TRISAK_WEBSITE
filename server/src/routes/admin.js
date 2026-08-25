import { Router } from "express";
import { requireAdmin } from "../middleware/adminAuth.js";
import { upload } from "../middleware/upload.js";
import {
  login,
  logout,
  listBrandsAdmin,
  getBrandAdmin,
  createBrand,
  updateBrand,
  toggleBrandStatus,
  reorderBrand,
  deleteBrand,
  listCategoriesAdmin,
  getCategoryAdmin,
  createCategory,
  updateCategory,
  toggleCategoryStatus,
  reorderCategory,
  deleteCategory,
  listSeriesAdmin,
  getSeriesAdmin,
  createSeries,
  updateSeries,
  toggleSeriesStatus,
  reorderSeries,
  deleteSeries,
  listProductsAdmin,
  getProductAdmin,
  createProduct,
  updateProduct,
  deleteProduct,
  uploadImage,
} from "../controllers/adminController.js";
import { updateHomeContent } from "../controllers/homeContentController.js";

const router = Router();

// public
router.post("/admin/login", login);

// everything below requires a valid session token
router.use("/admin", requireAdmin);

router.post("/admin/logout", logout);

router.put("/admin/home-content", updateHomeContent);

router.get("/admin/brands", listBrandsAdmin);
router.get("/admin/brands/:id", getBrandAdmin);
router.post("/admin/brands", createBrand);
router.put("/admin/brands/:id", updateBrand);
router.patch("/admin/brands/:id/status", toggleBrandStatus);
router.post("/admin/brands/:id/reorder", reorderBrand);
router.delete("/admin/brands/:id", deleteBrand);

router.get("/admin/categories", listCategoriesAdmin);
router.get("/admin/categories/:id", getCategoryAdmin);
router.post("/admin/categories", createCategory);
router.put("/admin/categories/:id", updateCategory);
router.patch("/admin/categories/:id/status", toggleCategoryStatus);
router.post("/admin/categories/:id/reorder", reorderCategory);
router.delete("/admin/categories/:id", deleteCategory);

router.get("/admin/series", listSeriesAdmin);
router.get("/admin/series/:id", getSeriesAdmin);
router.post("/admin/series", createSeries);
router.put("/admin/series/:id", updateSeries);
router.patch("/admin/series/:id/status", toggleSeriesStatus);
router.post("/admin/series/:id/reorder", reorderSeries);
router.delete("/admin/series/:id", deleteSeries);

router.get("/admin/products", listProductsAdmin);
router.get("/admin/products/:id", getProductAdmin);
router.post("/admin/products", createProduct);
router.put("/admin/products/:id", updateProduct);
router.delete("/admin/products/:id", deleteProduct);

router.post("/admin/upload", upload.single("image"), uploadImage);

export default router;
