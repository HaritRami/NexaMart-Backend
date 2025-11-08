import express from "express";
import { createRazorOrder } from "../controllers/paymentController.js";

const router = express.Router();
router.post("/razor/create-order", createRazorOrder);

export default router;
