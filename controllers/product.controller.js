import ProductModel from "../models/product.model.js";
import fs from 'fs';
import path from 'path';
import XLSX from 'xlsx';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// CREATE a new product
export const createProduct = async (req, res) => {
  try {
    const {
      name, category, subCategory, unit, stock,
      price, discount, description, moreDetail, Public
    } = req.body;

    // Update image paths to include full URL
    const images = req.files ? req.files.map(file => `/uploads/product_image/${file.filename}`) : [];

    const newProduct = new ProductModel({
      name,
      images,
      category,
      subCategory,
      unit,
      stock,
      price,
      discount,
      description,
      moreDetail,
      Public
    });

    await newProduct.save();

    const populatedProduct = await ProductModel.findById(newProduct._id)
      .populate('category')
      .populate('subCategory');

    // Add full URLs to images in response
    const productWithFullUrls = {
      ...populatedProduct.toObject(),
      images: populatedProduct.images.map(image => `http://localhost:5000${image}`)
    };

    res.status(201).json({
      success: true,
      message: "Product created successfully",
      data: productWithFullUrls
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error creating product",
      error: error.message
    });
  }
};

// READ all products with pagination, search and sort
export const getAllProducts = async (req, res) => {
  try {
    const {
      search,
      sortField = 'createdAt',
      sortOrder = 'desc',
      page = 1,
      limit = 10
    } = req.query;

    // Build search query
    let query = {};
    if (search) {
      query = {
        $or: [
          { name: { $regex: search, $options: 'i' } },
          { description: { $regex: search, $options: 'i' } }
        ]
      };
    }

    // Calculate pagination
    const skip = (page - 1) * limit;

    // Build sort object
    const sort = {};
    sort[sortField] = sortOrder === 'asc' ? 1 : -1;

    // Get total count
    const total = await ProductModel.countDocuments(query);

    // Get products
    const products = await ProductModel
      .find(query)
      .populate('category')
      .populate('subCategory')
      .sort(sort)
      .skip(skip)
      .limit(parseInt(limit));

    // Add full URLs to images in response
    const productsWithFullUrls = products.map(product => ({
      ...product.toObject(),
      images: product.images.map(image => `http://localhost:5000${image}`)
    }));

    res.status(200).json({
      success: true,
      data: productsWithFullUrls,
      pagination: {
        total,
        page: parseInt(page),
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error fetching products",
      error: error.message
    });
  }
};

// READ a single product by ID
export const getProductById = async (req, res) => {
  try {
    const { productId } = req.params;
    const product = await ProductModel.findById(productId)
      .populate('category')
      .populate('subCategory');

    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    res.status(200).json(product);
  } catch (error) {
    res.status(500).json({ message: "Error fetching product", error: error.message });
  }
};

// UPDATE a product
export const updateProduct = async (req, res) => {
  try {
    const { productId } = req.params;
    const updateData = { ...req.body };

    // Handle new images if they are uploaded
    if (req.files && req.files.length > 0) {
      // Get the old product to delete its images
      const oldProduct = await ProductModel.findById(productId);
      if (oldProduct && oldProduct.images) {
        // Delete old images from filesystem
        oldProduct.images.forEach(imagePath => {
          const fullPath = path.join(__dirname, '..', imagePath);
          if (fs.existsSync(fullPath)) {
            fs.unlinkSync(fullPath);
          }
        });
      }

      // Add new image paths
      updateData.images = req.files.map(file => `/uploads/product_image/${file.filename}`);
    }

    const updatedProduct = await ProductModel.findByIdAndUpdate(
      productId,
      updateData,
      { new: true }
    ).populate('category').populate('subCategory');

    if (!updatedProduct) {
      return res.status(404).json({
        success: false,
        message: "Product not found"
      });
    }

    res.status(200).json({
      success: true,
      message: "Product updated successfully",
      data: updatedProduct
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error updating product",
      error: error.message
    });
  }
};

// DELETE a product
export const deleteProduct = async (req, res) => {
  try {
    const { productId } = req.params;

    // Get the product to delete its images
    const product = await ProductModel.findById(productId);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found"
      });
    }

    // Delete images from filesystem
    if (product.images) {
      product.images.forEach(imagePath => {
        const fullPath = path.join(__dirname, '..', imagePath);
        if (fs.existsSync(fullPath)) {
          fs.unlinkSync(fullPath);
        }
      });
    }

    await ProductModel.findByIdAndDelete(productId);

    res.status(200).json({
      success: true,
      message: "Product deleted successfully"
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error deleting product",
      error: error.message
    });
  }
};

// Import products from Excel
export const importProducts = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "Please upload an Excel file"
      });
    }

    const workbook = XLSX.read(req.file.buffer, { type: 'buffer' });
    const worksheet = workbook.Sheets[workbook.SheetNames[0]];
    const data = XLSX.utils.sheet_to_json(worksheet);

    const results = {
      success: [],
      errors: []
    };

    for (let row of data) {
      try {
        const product = new ProductModel({
          name: row.Name,
          category: row.CategoryId,
          subCategory: row.SubCategoryId,
          unit: row.Unit,
          stock: row.Stock,
          price: row.Price,
          discount: row.Discount,
          description: row.Description,
          Public: row.Public === 'true'
        });

        await product.save();
        results.success.push({
          name: row.Name
        });
      } catch (error) {
        results.errors.push({
          name: row.Name,
          error: error.message
        });
      }
    }

    res.json({
      success: true,
      message: `Successfully imported ${results.success.length} products`,
      results
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

// Get product by barcode
export const getProductByBarcodeController = async (req, res) => {
  try {
    const { barcodeId } = req.params;
    const product = await ProductModel.findOne({ barcodeId })
      .populate('category')
      .populate('subCategory');

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found"
      });
    }

    res.status(200).json({
      success: true,
      data: product
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

// Add this new function to get products by category name
export const getProductsByCategory = async (req, res) => {
  try {
    const { categoryName } = req.params;
    
    // Find products where category name matches
    const products = await ProductModel.find()
      .populate({
        path: 'category',
        match: { name: categoryName }
      })
      .populate('subCategory');

    // Filter out products where category is null (meaning category name didn't match)
    const filteredProducts = products.filter(product => product.category.length > 0);

    // Add full URLs to images in response
    const productsWithFullUrls = filteredProducts.map(product => ({
      ...product.toObject(),
      images: product.images.map(image => `http://localhost:5000${image}`)
    }));

    res.status(200).json({
      success: true,
      data: productsWithFullUrls,
      count: productsWithFullUrls.length
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error fetching products by category",
      error: error.message
    });
  }
};
