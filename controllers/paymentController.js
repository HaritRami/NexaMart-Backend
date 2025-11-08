import { PaymentStrategy } from "../Services/Payments/paymentStrategy.js";
import { RazorpayPayment } from "../Services/Payments/razorpayPayment.js";
export const createRazorOrder = async (req, res) => {
  try {
    const { amount } = req.body;

    const razorpayGateway = new PaymentStrategy(new RazorpayPayment());

    const order = await razorpayGateway.createOrder({
      amount: amount * 100,
      currency: "INR",
      receipt: "order_rcptid_" + Date.now()
    });

    res.json({ success: true, order });
  } catch (error) {
    console.error("Order Error:", error);
    res.status(500).json({ success: false, message: "Payment Failed" });
  }
};
