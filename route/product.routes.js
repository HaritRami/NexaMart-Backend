import express from "express";
import { upload } from "../middleware/uploadMiddleware.js";
import {
  createProduct,
  getAllProducts,
  getProductById,
  updateProduct,
  deleteProduct,
  importProducts,
  getProductByBarcodeController,
  getProductsByCategory
} from "../controllers/product.controller.js";
import multer from 'multer';

const productRouter = express.Router();

// Configure Excel upload
const excelUpload = multer({
  storage: multer.memoryStorage(),
  fileFilter: (req, file, cb) => {
    if (
      file.mimetype === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
      file.mimetype === 'application/vnd.ms-excel'
    ) {
      cb(null, true);
    } else {
      cb(new Error('Please upload an Excel file'));
    }
  }
});

productRouter.post("/", upload.array('images', 5), createProduct);
productRouter.get("/", getAllProducts);
productRouter.get("/:productId", getProductById);
productRouter.put("/:productId", upload.array('images', 5), updateProduct);
productRouter.delete("/:productId", deleteProduct);
productRouter.post("/import", excelUpload.single('file'), importProducts);
productRouter.get("/barcode/:barcodeId", getProductByBarcodeController);
productRouter.get("/category/:categoryName", getProductsByCategory);

export default productRouter;
