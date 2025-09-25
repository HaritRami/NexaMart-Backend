import express from "express";
import {
  addToCart,
  getCart,
  updateCartQuantity,
  removeFromCart,
  getCartSummary
} from "../controllers/cart.controller.js";
import { authenticateToken } from "../middleware/auth.middleware.js";

const cartRoutes = express.Router();

// Protected routes - require authentication
cartRoutes.use(authenticateToken);

// Add to cart
cartRoutes.post("/:userId/cart", addToCart);

// Get cart items with pagination and sorting
cartRoutes.get("/:userId/cart", getCart);

// Get cart summary
cartRoutes.get("/:userId/cart/summary", getCartSummary);

// Update cart item quantity
cartRoutes.put("/cart/:cartProductId", updateCartQuantity);

// Remove item from cart
cartRoutes.delete("/cart/:cartProductId", removeFromCart);

export default cartRoutes;
