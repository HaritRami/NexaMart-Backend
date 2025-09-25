import express from "express";
import {
  createAddressController,
  getAddressController,
  updateAddressController,
  deleteAddressController,
  getUserAddressesController
} from "../controllers/address.controller.js";
import {authenticateToken} from "../middleware/auth.middleware.js"

const addressRouter = express.Router();

// Apply authentication middleware to all routes

// Get all addresses for the authenticated user
addressRouter.get("/user/:userId", authenticateToken,getUserAddressesController);

// Create new address
addressRouter.post("/", authenticateToken,createAddressController);

// Get specific address
addressRouter.get("/:addressId", authenticateToken,getAddressController);

// Update specific address
addressRouter.put("/:addressId", authenticateToken,updateAddressController);

// Delete specific address
addressRouter.delete("/:addressId", authenticateToken,deleteAddressController);

export default addressRouter;
