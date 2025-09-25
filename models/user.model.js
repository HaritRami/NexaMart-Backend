import mongoose from 'mongoose';

const UserSchema = new mongoose.Schema({
  name: { type: String, required: [true, "Name field is required"] },
  email: { type: String, required: true, unique: [true, "The email field is required"] },
  password: { type: String, required: true },
  avatar: {
    type: String,
    default: ""
  },
  bio: {
    type: String,
    default: "",
    maxLength: [500, "Bio cannot be more than 500 characters"]
  },
  mobile: {
    type: String,
    validate: {
      validator: function (v) {
        return /^\d{10}$/.test(v);
      },
      message: props => `${props.value} is not a valid 10-digit mobile number!`
    },
    unique: true,
    sparse: true,
    default: null
  },
  refresh_token: {
    type: String,
    default: ""
  },
  verify_email: {
    type: Boolean,
    default: false
  },
  status: {
    type: String,
    enum: ["Active", "Inactive", "Suspended"],
    default: "Active"
  },
  last_login_date: {
    type: Date,
    default: null
  },
  address_details: [{
    type: mongoose.Schema.ObjectId,
    ref: "address"
  }],
  shopping_cart: [{
    type: mongoose.Schema.ObjectId,
    ref: "cartproduct"
  }],
  orderHistory: [{
    type: mongoose.Schema.ObjectId,
    ref: "order"
  }],
  forget_password_otp: {
    type: String,
    default: null
  },
  forget_password_expiry: {
    type: Date,
    default: null
  },
  role: {
    type: String,
    enum: ["User", "Admin"],
    default: "User"
  }
}, {
  timestamps: true
});

const User = mongoose.model('User', UserSchema);

export default User;
