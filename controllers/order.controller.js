import Order from "../models/order.model.js";

export const createOrder = async (req, res) => {
  try {
    const { userId, orderId, productId, productDetail, paymentId, paymentStatus, deliveryAddress, subTotalAmt, totalAmt, invoiceReceipt } = req.body;

    const newOrder = new Order({
      userId,
      orderId,
      productId,
      productDetail,
      paymentId,
      paymentStatus,
      deliveryAddress,
      subTotalAmt,
      totalAmt,
      invoiceReceipt,
    });

    await newOrder.save();
    res.status(201).json({ message: "Order created successfully", newOrder });
  } catch (error) {
    res.status(500).json({ message: "Error creating order", error: error.message });
  }
};

export const getAllOrders = async (req, res) => {
  try {
    const orders = await Order.find().populate('userId productId deliveryAddress');
    res.status(200).json(orders);
  } catch (error) {
    res.status(500).json({ message: "Error fetching orders", error: error.message });
  }
};

export const getOrderById = async (req, res) => {
  try {
    const { id } = req.params;
    const order = await Order.findById(id).populate('userId productId deliveryAddress');
    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }
    res.status(200).json(order);
  } catch (error) {
    res.status(500).json({ message: "Error fetching order", error: error.message });
  }
};

export const updateOrder = async (req, res) => {
  try {
    const { id } = req.params;
    const { userId, productId, productDetail, paymentId, paymentStatus, deliveryAddress, subTotalAmt, totalAmt, invoiceReceipt } = req.body;

    const updatedOrder = await Order.findByIdAndUpdate(
      id,
      { userId, productId, productDetail, paymentId, paymentStatus, deliveryAddress, subTotalAmt, totalAmt, invoiceReceipt },
      { new: true }
    );

    if (!updatedOrder) {
      return res.status(404).json({ message: "Order not found" });
    }

    res.status(200).json({ message: "Order updated successfully", updatedOrder });
  } catch (error) {
    res.status(500).json({ message: "Error updating order", error: error.message });
  }
};

export const deleteOrder = async (req, res) => {
  try {
    const { id } = req.params;
    const deletedOrder = await Order.findByIdAndDelete(id);

    if (!deletedOrder) {
      return res.status(404).json({ message: "Order not found" });
    }

    res.status(200).json({ message: "Order deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Error deleting order", error: error.message });
  }
};
