// import CartProductModel from "../models/cart.model.js";
import CartProductModel from "../models/cartProduct.model.js";
import ProductModel from "../models/product.model.js";
import User from "../models/user.model.js";

// Add to cart or update quantity if product exists
export const addToCart = async (req, res) => {
  try {
    const { productId, quantity } = req.body;
    const { userId } = req.params;

    // Validate user exists
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found"
      });
    }

    // Validate product exists and has sufficient stock
    const product = await ProductModel.findById(productId);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found"
      });
    }

    if (product.stock < quantity) {
      return res.status(400).json({
        success: false,
        message: "Insufficient stock available"
      });
    }

    // Check if product already exists in cart
    let cartProduct = await CartProductModel.findOne({ productId, userId });
    
    if (cartProduct) {
      // Update existing cart item
      const newQuantity = cartProduct.quantity + quantity;
      
      if (newQuantity > product.stock) {
        return res.status(400).json({
          success: false,
          message: "Cannot add more items than available in stock"
        });
      }

      cartProduct.quantity = newQuantity;
      const updatedCartProduct = await cartProduct.save();

      const populatedCart = await CartProductModel.findById(updatedCartProduct._id)
        .populate('productId')
        .populate('userId', 'name email');

      return res.status(200).json({
        success: true,
        message: "Cart updated successfully",
        data: populatedCart
      });
    } else {
      // Create new cart item
      cartProduct = new CartProductModel({
        productId,
        quantity,
        userId
      });

      const savedCartProduct = await cartProduct.save();
      const populatedCart = await CartProductModel.findById(savedCartProduct._id)
        .populate('productId')
        .populate('userId', 'name email');

      return res.status(201).json({
        success: true,
        message: "Product added to cart successfully",
        data: populatedCart
      });
    }
  } catch (error) {
    console.error('Error in addToCart:', error);
    return res.status(500).json({
      success: false,
      message: error.message || "Error adding product to cart"
    });
  }
};

// Get cart items with pagination and sorting
export const getCart = async (req, res) => {
  try {
    const { userId } = req.params;
    const {
      sortField = 'createdAt',
      sortOrder = 'desc',
      page = 1,
      limit = 10
    } = req.query;

    // Validate user exists
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found"
      });
    }

    // Calculate pagination
    const skip = (page - 1) * limit;

    // Build sort object
    const sort = {};
    sort[sortField] = sortOrder === 'asc' ? 1 : -1;

    // Get total count
    const total = await CartProductModel.countDocuments({ userId });

    // Get cart items with population
    const cartItems = await CartProductModel.find({ userId })
      .populate('productId')
      .populate('userId', 'name email')
      .sort(sort)
      .skip(skip)
      .limit(parseInt(limit));

    // Calculate cart totals
    const cartTotals = cartItems.reduce((acc, item) => {
      const price = item.productId.price * item.quantity;
      const discount = item.productId.discount ? (price * item.productId.discount) / 100 : 0;
      
      return {
        totalPrice: acc.totalPrice + price,
        totalDiscount: acc.totalDiscount + discount
      };
    }, { totalPrice: 0, totalDiscount: 0 });

    return res.status(200).json({
      success: true,
      data: cartItems,
      pagination: {
        total,
        page: parseInt(page),
        pages: Math.ceil(total / limit)
      },
      cartTotals: {
        totalPrice: cartTotals.totalPrice,
        totalDiscount: cartTotals.totalDiscount,
        finalPrice: cartTotals.totalPrice - cartTotals.totalDiscount
      }
    });
  } catch (error) {
    console.error('Error in getCart:', error);
    return res.status(500).json({
      success: false,
      message: error.message || "Error fetching cart items"
    });
  }
};

// Update cart item quantity
export const updateCartQuantity = async (req, res) => {
  try {
    const { cartProductId } = req.params;
    const { quantity } = req.body;

    if (!quantity || quantity < 1) {
      return res.status(400).json({
        success: false,
        message: "Invalid quantity provided"
      });
    }

    const cartProduct = await CartProductModel.findById(cartProductId);
    if (!cartProduct) {
      return res.status(404).json({
        success: false,
        message: "Cart item not found"
      });
    }

    // Check product stock
    const product = await ProductModel.findById(cartProduct.productId);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found"
      });
    }

    if (quantity > product.stock) {
      return res.status(400).json({
        success: false,
        message: "Requested quantity exceeds available stock"
      });
    }

    cartProduct.quantity = quantity;
    const updatedCartProduct = await cartProduct.save();

    const populatedCart = await CartProductModel.findById(updatedCartProduct._id)
      .populate('productId')
      .populate('userId', 'name email');

    return res.status(200).json({
      success: true,
      message: "Cart quantity updated successfully",
      data: populatedCart
    });
  } catch (error) {
    console.error('Error in updateCartQuantity:', error);
    return res.status(500).json({
      success: false,
      message: error.message || "Error updating cart quantity"
    });
  }
};

// Remove item from cart
export const removeFromCart = async (req, res) => {
  try {
    const { cartProductId } = req.params;

    const cartProduct = await CartProductModel.findById(cartProductId);
    if (!cartProduct) {
      return res.status(404).json({
        success: false,
        message: "Cart item not found"
      });
    }

    await cartProduct.deleteOne();

    return res.status(200).json({
      success: true,
      message: "Item removed from cart successfully",
      data: { deletedId: cartProductId }
    });
  } catch (error) {
    console.error('Error in removeFromCart:', error);
    return res.status(500).json({
      success: false,
      message: error.message || "Error removing item from cart"
    });
  }
};

// Get cart summary (total items, total price, etc.)
export const getCartSummary = async (req, res) => {
  try {
    const { userId } = req.params;

    const cartItems = await CartProductModel.find({ userId })
      .populate('productId');

    const summary = cartItems.reduce((acc, item) => {
      const price = item.productId.price * item.quantity;
      const discount = item.productId.discount ? (price * item.productId.discount) / 100 : 0;
      
      return {
        totalItems: acc.totalItems + item.quantity,
        totalPrice: acc.totalPrice + price,
        totalDiscount: acc.totalDiscount + discount
      };
    }, { totalItems: 0, totalPrice: 0, totalDiscount: 0 });

    return res.status(200).json({
      success: true,
      data: {
        ...summary,
        finalPrice: summary.totalPrice - summary.totalDiscount
      }
    });
  } catch (error) {
    console.error('Error in getCartSummary:', error);
    return res.status(500).json({
      success: false,
      message: error.message || "Error getting cart summary"
    });
  }
};
