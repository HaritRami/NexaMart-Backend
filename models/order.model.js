import mongoose from "mongoose";

const orderSchema = new mongoose.Schema(
  {
    userId: [
      {
        type: mongoose.Schema.ObjectId,
        ref: "User",
      },
    ],
    orderId: {
      type: String,
      required: [true, "Provide OrderId"],
      unique: true,
    },
    productId: {
      type: mongoose.Schema.ObjectId,
      ref: "Product",
    },
    productDetail: {
      name: {
        type: String,
        required: true, // Optional: Add validation based on your use case
      },
      images: {
        type: [String],
        default: [],
      },
    },
    paymentId: {
      type: String, // Updated to string, assuming payment ID is a reference or identifier
      default: "",  // Default empty string if not set
    },
    paymentStatus: {
      type: String,
      default: "", // Default is an empty string
    },
    deliveryAddress: {
      type: mongoose.Schema.ObjectId,
      ref: "Address", // Fixed the reference to the Address model
    },
    subTotalAmt: {
      type: Number,
      default: 0,
    },
    totalAmt: {
      type: Number,
      default: 0,
    },
    invoiceReceipt: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true } // Correct placement of timestamps
);

const OrderModel = mongoose.model("Order", orderSchema);
export default OrderModel;
