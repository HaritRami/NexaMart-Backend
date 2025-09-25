import SubCategory from "../models/subCategory.model.js";
import fs from 'fs';
import path from 'path';
import axios from 'axios';
import XLSX from 'xlsx';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Create SubCategory
export const createSubCategory = async (req, res) => {
  try {
    const { name, category } = req.body;

    // Handle image path
    const image = req.file ? `/uploads/subcategory_image/${req.file.filename}` : "";

    const subCategory = new SubCategory({
      name,
      category,
      image
    });

    const savedSubCategory = await subCategory.save();
    const populatedSubCategory = await SubCategory.findById(savedSubCategory._id)
      .populate('category');

    res.status(201).json({
      success: true,
      data: populatedSubCategory
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

// Get all SubCategories with pagination, search and sort
export const getAllSubCategories = async (req, res) => {
  try {
    const {
      search,
      sortField = 'name',
      sortOrder = 'asc',
      page = 1,
      limit = 5
    } = req.query;

    // Build search query
    let query = {};
    if (search) {
      const searchRegex = new RegExp(search.trim(), 'i');
      query = {
        $or: [
          { name: { $regex: searchRegex } }
        ]
      };
    }

    // Calculate pagination
    const skip = (page - 1) * limit;

    // Build sort object
    const sort = {};
    sort[sortField] = sortOrder === 'asc' ? 1 : -1;

    // Get total count for pagination
    const total = await SubCategory.countDocuments(query);

    // Get subcategories with search, sort and pagination
    const subCategories = await SubCategory
      .find(query)
      .populate('category')
      .sort(sort)
      .skip(skip)
      .limit(parseInt(limit))
      .select('name image category barcodeId createdAt updatedAt');

    res.status(200).json({
      success: true,
      data: subCategories,
      pagination: {
        total,
        page: parseInt(page),
        pages: Math.ceil(total / limit)
      },
      metadata: {
        searchTerm: search || '',
        sortField,
        sortOrder
      }
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

// Get SubCategory by ID
export const getSubCategoryById = async (req, res) => {
  try {
    const subCategory = await SubCategory.findById(req.params.id)
      .populate('category');

    if (!subCategory) {
      return res.status(404).json({
        success: false,
        message: "SubCategory not found"
      });
    }

    res.status(200).json({
      success: true,
      data: subCategory
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

// Update SubCategory
export const updateSubCategory = async (req, res) => {
  try {
    const { name, category } = req.body;
    const subCategoryId = req.params.id;

    const subCategory = await SubCategory.findById(subCategoryId);
    if (!subCategory) {
      return res.status(404).json({
        success: false,
        message: "SubCategory not found"
      });
    }

    // Handle image update
    if (req.file) {
      // Delete old image if it exists
      if (subCategory.image) {
        const oldImagePath = path.join(__dirname, '..', subCategory.image);
        if (fs.existsSync(oldImagePath)) {
          fs.unlinkSync(oldImagePath);
        }
      }
      subCategory.image = `/uploads/subcategory_image/${req.file.filename}`;
    }

    subCategory.name = name;
    subCategory.category = category;

    const updatedSubCategory = await subCategory.save();
    const populatedSubCategory = await SubCategory.findById(updatedSubCategory._id)
      .populate('category');

    res.json({
      success: true,
      data: populatedSubCategory
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

// Delete SubCategory
export const deleteSubCategory = async (req, res) => {
  try {
    const subCategory = await SubCategory.findById(req.params.id);
    if (!subCategory) {
      return res.status(404).json({
        success: false,
        message: "SubCategory not found"
      });
    }

    // Delete image if exists
    if (subCategory.image) {
      const imagePath = path.join(__dirname, '..', subCategory.image);
      if (fs.existsSync(imagePath)) {
        fs.unlinkSync(imagePath);
      }
    }

    await subCategory.deleteOne();
    res.json({
      success: true,
      message: "SubCategory deleted successfully"
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

// Import SubCategories from Excel
export const importSubCategories = async (req, res) => {
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
        let imagePath = "";

        if (row.ImageURL) {
          try {
            const imageResponse = await axios.get(row.ImageURL, { responseType: 'arraybuffer' });
            const fileName = `${Date.now()}-${Math.round(Math.random() * 1E9)}.jpg`;
            const uploadPath = path.join('uploads', 'subcategory_image', fileName);

            if (!fs.existsSync(path.join('uploads', 'subcategory_image'))) {
              fs.mkdirSync(path.join('uploads', 'subcategory_image'), { recursive: true });
            }

            fs.writeFileSync(uploadPath, Buffer.from(imageResponse.data));
            imagePath = `/uploads/subcategory_image/${fileName}`;
          } catch (imageError) {
            console.error('Error downloading image:', imageError);
          }
        }

        const subCategory = new SubCategory({
          name: row.Name,
          category: row.CategoryId,
          image: imagePath
        });

        await subCategory.save();
        results.success.push({
          name: row.Name,
          imageStatus: imagePath ? 'Uploaded' : 'Not provided'
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
      message: `Successfully imported ${results.success.length} subcategories`,
      results
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

// Add this controller for barcode lookup
export const getSubCategoryByBarcodeController = async (req, res) => {
  try {
    const { barcodeId } = req.params;
    const subCategory = await SubCategory.findOne({ barcodeId })
      .populate('category');

    if (!subCategory) {
      return res.status(404).json({
        success: false,
        message: "SubCategory not found"
      });
    }

    res.status(200).json({
      success: true,
      data: subCategory
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};
