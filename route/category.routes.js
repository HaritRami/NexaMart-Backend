// import express from "express";
// import { upload } from "../middleware/uploadMiddleware.js";
// import { authenticateToken } from "../middleware/auth.middleware.js";
// import {
//     createCategoryController,
//     getAllCategoriesController,
//     getCategoryByIdController,
//     updateCategoryController,
//     deleteCategoryController,
//     getCategoryByBarcodeController,
//     importCategoriesController
// } from "../controllers/category.controller.js";
// import multer from 'multer';

// const categoryRouter = express.Router();

// // Protect all routes with authentication
// categoryRouter.use(authenticateToken);

// // Add this multer configuration for Excel files
// const excelUpload = multer({
//     storage: multer.memoryStorage(),
//     fileFilter: (req, file, cb) => {
//         if (
//             file.mimetype === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
//             file.mimetype === 'application/vnd.ms-excel'
//         ) {
//             cb(null, true);
//         } else {
//             cb(new Error('Please upload an Excel file'));
//         }
//     }
// });

// // Routes with file upload
// categoryRouter.post("/", upload.single('image'), createCategoryController);
// categoryRouter.put("/:categoryId", upload.single('image'), updateCategoryController);
// categoryRouter.post("/import", excelUpload.single('file'), importCategoriesController);

// // Regular routes
// categoryRouter.get("/", getAllCategoriesController);
// categoryRouter.get("/:categoryId", getCategoryByIdController);
// categoryRouter.delete("/:categoryId", deleteCategoryController);
// categoryRouter.get("/barcode/:barcodeId", getCategoryByBarcodeController);

// export default categoryRouter;



import express from "express";
import { upload } from "../middleware/uploadMiddleware.js";
import {
    createCategoryController,
    getAllCategoriesController,
    getCategoryByIdController,
    updateCategoryController,
    deleteCategoryController,
    getCategoryByBarcodeController,
    importCategoriesController
} from "../controllers/category.controller.js";
import multer from 'multer';
import {authenticateToken} from "../middleware/auth.middleware.js"
const categoryRouter = express.Router();

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

categoryRouter.post("/", upload.single('image'), createCategoryController);
categoryRouter.get("/", getAllCategoriesController);
categoryRouter.get("/:categoryId", getCategoryByIdController);
categoryRouter.put("/:categoryId", upload.single('image'), updateCategoryController);
categoryRouter.delete("/:categoryId", authenticateToken,deleteCategoryController);
categoryRouter.post("/import", excelUpload.single('file'), importCategoriesController);
categoryRouter.get("/barcode/:barcodeId", getCategoryByBarcodeController);

export default categoryRouter;
