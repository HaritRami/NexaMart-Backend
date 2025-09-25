import mongoose from "mongoose";

const addressSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User", 
      required: true
    },
    address_line: {
      type: String,
      default: ""
    },
    city: {
      type: String,
      default: ""
    },
    state: {
      type: String,
      default: null
    },
    country: {
      type: String
    },
    mobile: {
      type: Number,
      default: null
    },
    is_delete: {
      type: Boolean,
      default: false
    }
  },
  {
    timestamps: true
  }
);

const AddressModel = mongoose.model("Address", addressSchema);
export default AddressModel;
