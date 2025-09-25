import express from "express";
import { upload } from "../middleware/uploadMiddleware.js";
import {
  createSubCategory,
  getAllSubCategories,
  getSubCategoryById,
  updateSubCategory,
  deleteSubCategory,
  importSubCategories,
  getSubCategoryByBarcodeController
} from "../controllers/subCategory.controller.js";
import multer from 'multer';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import fs from 'fs';
import path from 'path';

const subCategoryRouter = express.Router();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Configure multer storage
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = path.join(__dirname, '..', 'uploads', 'subcategory_image');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + '-' + file.originalname);
  }
});

// Add this multer configuration for Excel files
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

subCategoryRouter.post("/", upload.single('image'), createSubCategory);
subCategoryRouter.get("/", getAllSubCategories);
subCategoryRouter.get("/:id", getSubCategoryById);
subCategoryRouter.put("/:id", upload.single('image'), updateSubCategory);
subCategoryRouter.delete("/:id", deleteSubCategory);
subCategoryRouter.post("/import", excelUpload.single('file'), importSubCategories);
subCategoryRouter.get("/barcode/:barcodeId", getSubCategoryByBarcodeController);

export default subCategoryRouter;
