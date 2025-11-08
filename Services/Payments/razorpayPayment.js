import Razorpay from "razorpay";

export class RazorpayPayment {
  constructor() {
    this.instance = new Razorpay({
      key_id: process.env.RAZORPAY_KEY,
      key_secret: process.env.RAZORPAY_SECRET
    });
  }

  async createOrder(orderDetails) {
    return await this.instance.orders.create(orderDetails);
  }
}
