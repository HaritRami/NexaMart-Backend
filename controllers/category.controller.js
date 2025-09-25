import CategoryModel from "../models/category.model.js";
import fs from 'fs';
import path from 'path';
import axios from 'axios';
import XLSX from 'xlsx';
import { nanoid } from 'nanoid';

// Create category with image
export const createCategoryController = async (req, res) => {
  try {
    const { name, description } = req.body;
    const image = req.file ? `/uploads/category_image/${req.file.filename}` : ""

    const category = new CategoryModel({
      name,
      description,
      image
    });

    const savedCategory = await category.save();
    res.status(201).json({
      success: true,
      data: savedCategory
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};






















// Update category with image
export const updateCategoryController = async (req, res) => {
  try {
    const { name, description } = req.body;
    const categoryId = req.params.categoryId;

    const category = await CategoryModel.findById(categoryId);
    if (!category) {
      return res.status(404).json({
        success: false,
        message: "Category not found"
      });
    }

    // If new image is uploaded, delete old image
    if (req.file) {
      if (category.image) {
        const oldImagePath = path.join('uploads', category.image);
        if (fs.existsSync(oldImagePath)) {
          fs.unlinkSync(oldImagePath);
        }
      }
      category.image = `/uploads/category_image/${req.file.filename}`;
    }

    category.name = name;
    category.description = description;

    const updatedCategory = await category.save();
    res.json({
      success: true,
      data: updatedCategory
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

// Delete category with image
export const deleteCategoryController = async (req, res) => {
  try {
    const category = await CategoryModel.findById(req.params.categoryId);
    if (!category) {
      return res.status(404).json({
        success: false,
        message: "Category not found"
      });
    }

    // Delete image if exists
    if (category.image) {
      const imagePath = path.join('uploads', category.image);
      if (fs.existsSync(imagePath)) {
        fs.unlinkSync(imagePath);
      }
    }

    await category.deleteOne();
    res.json({
      success: true,
      message: "Category deleted successfully"
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

// Modified getAllCategoriesController with improved search
export const getAllCategoriesController = async (req, res) => {
  try {
    const {
      search,
      sortField = 'name',
      sortOrder = 'asc',
      page = 1,
      limit = 5
    } = req.query;

    // Build search query with improved matching
    let query = {};
    if (search) {
      const searchRegex = new RegExp(search.trim(), 'i');
      query = {
        $or: [
          { name: { $regex: searchRegex } },
          { description: { $regex: searchRegex } },
          { barcodeId: { $regex: searchRegex } }
        ]
      };
    }

    // Calculate pagination
    const skip = (page - 1) * limit;

    // Build sort object
    const sort = {};
    sort[sortField] = sortOrder === 'asc' ? 1 : -1;

    // Get total count for pagination
    const total = await CategoryModel.countDocuments(query);

    // Get categories with search, sort and pagination
    const categories = await CategoryModel
      .find(query)
      .sort(sort)
      .skip(skip)
      .limit(parseInt(limit))
      .select('name description image barcodeId createdAt updatedAt'); // Optimize by selecting only needed fields

    // Send response with metadata
    res.json({
      success: true,
      data: categories,
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
    console.error('Error in getAllCategoriesController:', error);
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

// Get category by ID
export const getCategoryByIdController = async (req, res) => {
  try {
    const category = await CategoryModel.findById(req.params.categoryId);
    if (!category) {
      return res.status(404).json({
        success: false,
        message: "Category not found"
      });
    }
    res.json({
      success: true,
      data: category
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

// Get category by barcode ID
export const getCategoryByBarcodeController = async (req, res) => {
  try {
    const category = await CategoryModel.findOne({ barcodeId: req.params.barcodeId });
    if (!category) {
      return res.status(404).json({
        success: false,
        message: "Category not found"
      });
    }
    res.json({
      success: true,
      data: category
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

export const importCategoriesController = async (req, res) => {
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
        
        // If image URL is provided in Excel
        if (row.ImageURL) {
          try {
            // Download image
            const imageResponse = await axios.get(row.ImageURL, { responseType: 'arraybuffer' });
            
            // Generate unique filename
            const fileName = `${Date.now()}-${Math.round(Math.random() * 1E9)}.jpg`;
            const uploadPath = path.join('uploads', 'category_image', fileName);
            
            // Ensure directory exists
            if (!fs.existsSync(path.join('uploads', 'category_image'))) {
              fs.mkdirSync(path.join('uploads', 'category_image'), { recursive: true });
            }
            
            // Save image
            fs.writeFileSync(uploadPath, Buffer.from(imageResponse.data));
            imagePath = `/uploads/category_image/${fileName}`;
          } catch (imageError) {
            console.error('Error downloading image:', imageError);
            // Continue with import even if image download fails
          }
        }

        const category = new CategoryModel({
          name: row.Name,
          description: row.Description || "",
          image: imagePath,
          barcodeId: nanoid(10)
        });

        await category.save();
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
      message: `Successfully imported ${results.success.length} categories`,
      results
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};
