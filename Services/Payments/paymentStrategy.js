export class PaymentStrategy {
  constructor(provider) {
    this.provider = provider;
  }

  createOrder(orderDetails) {
    return this.provider.createOrder(orderDetails);
  }
}
