import { Router } from "express";
import { requireAdmin } from "../middleware/adminAuth.js";
import { upload } from "../middleware/upload.js";
import {
  login,
  logout,
  listBrandsAdmin,
  createBrand,
  updateBrand,
  deleteBrand,
  listCategoriesAdmin,
  createCategory,
  updateCategory,
  deleteCategory,
  listSeriesAdmin,
  createSeries,
  updateSeries,
  deleteSeries,
  listProductsAdmin,
  getProductAdmin,
  createProduct,
  updateProduct,
  deleteProduct,
  uploadImage,
} from "../controllers/adminController.js";

const router = Router();

// public
router.post("/admin/login", login);

// everything below requires a valid session token
router.use("/admin", requireAdmin);

router.post("/admin/logout", logout);

router.get("/admin/brands", listBrandsAdmin);
router.post("/admin/brands", createBrand);
router.put("/admin/brands/:id", updateBrand);
router.delete("/admin/brands/:id", deleteBrand);

router.get("/admin/categories", listCategoriesAdmin);
router.post("/admin/categories", createCategory);
router.put("/admin/categories/:id", updateCategory);
router.delete("/admin/categories/:id", deleteCategory);

router.get("/admin/series", listSeriesAdmin);
router.post("/admin/series", createSeries);
router.put("/admin/series/:id", updateSeries);
router.delete("/admin/series/:id", deleteSeries);

router.get("/admin/products", listProductsAdmin);
router.get("/admin/products/:id", getProductAdmin);
router.post("/admin/products", createProduct);
router.put("/admin/products/:id", updateProduct);
router.delete("/admin/products/:id", deleteProduct);

router.post("/admin/upload", upload.single("image"), uploadImage);

export default router;
