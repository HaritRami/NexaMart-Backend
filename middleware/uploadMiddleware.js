import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Define upload directories
const UPLOAD_DIRS = {
    base: path.join(__dirname, '..', 'uploads'),
    products: 'product_image',
    avatars: 'avatars',
    categories: 'category_image',
    banners: 'banner_image'
};

// Create all required directories
Object.entries(UPLOAD_DIRS).forEach(([key, dir]) => {
    const fullPath = key === 'base' ? dir : path.join(UPLOAD_DIRS.base, dir);
    if (!fs.existsSync(fullPath)) {
        fs.mkdirSync(fullPath, { recursive: true });
    }
});

// Configure storage
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        if (!req || !req.originalUrl) {
            return cb(new Error("Request object is not properly initialized"));
        }

        let uploadDir = UPLOAD_DIRS.base;

        // Determine upload directory based on route and file type
        if (req.originalUrl.includes('product')) {
            uploadDir = path.join(UPLOAD_DIRS.base, UPLOAD_DIRS.products);
        } else if (req.originalUrl.includes('user') || file.fieldname === 'avatar') {
            uploadDir = path.join(UPLOAD_DIRS.base, UPLOAD_DIRS.avatars);
        } else if (req.originalUrl.includes('category')) {
            uploadDir = path.join(UPLOAD_DIRS.base, UPLOAD_DIRS.categories);
        } else if (req.originalUrl.includes('banner')) {
            uploadDir = path.join(UPLOAD_DIRS.base, UPLOAD_DIRS.banners);
        }

        cb(null, uploadDir);
    },
    filename: function (req, file, cb) {
        if (!req) {
            return cb(new Error("Request object is not available"));
        }

        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const ext = path.extname(file.originalname);
        const filename = file.fieldname + '-' + uniqueSuffix + ext;

        if (!req.uploadedFiles) req.uploadedFiles = [];
        req.uploadedFiles.push({
            fieldname: file.fieldname,
            filename: filename,
            path: path.join(UPLOAD_DIRS.base, filename) // Fix: Removed `this.getDestination()`
        });

        cb(null, filename);
    }
});

// File filter configuration
const fileFilter = (req, file, cb) => {
    const allowedTypes = {
        'image/jpeg': true,
        'image/png': true,
        'image/gif': true,
        'image/webp': true
    };

    if (allowedTypes[file.mimetype]) {
        cb(null, true);
    } else {
        cb(new Error('Invalid file type. Only JPEG, PNG, GIF, and WebP images are allowed.'), false);
    }
};

// Create multer instance
export const upload = multer({
    storage: storage,
    fileFilter: fileFilter,
    limits: { fileSize: 5 * 1024 * 1024 } // 5MB default limit
});

// Helper function to delete old files
export const deleteFile = async (filePath) => {
    try {
        if (fs.existsSync(filePath)) {
            await fs.promises.unlink(filePath);
            return true;
        }
        return false;
    } catch (error) {
        console.error('Error deleting file:', error);
        return false;
    }
};

// Middleware to handle file uploads
export const uploadMiddleware = {
    single: (fieldName) => upload.single(fieldName),
    array: (fieldName, maxCount) => upload.array(fieldName, maxCount),
    fields: (fields) => upload.fields(fields),
    avatar: upload.single('avatar'),
    productImages: upload.array('product_images', 5),
    categoryImage: upload.single('category_image'),
    bannerImage: upload.single('banner_image'),

    // Cleanup uploaded files on error
    cleanupOnError: async (req, res, next) => {
        res.on('finish', () => {
            if (res.statusCode >= 400 && req.uploadedFiles) {
                req.uploadedFiles.forEach(file => {
                    deleteFile(file.path);
                });
            }
        });
        next();
    }
};

export default uploadMiddleware;
