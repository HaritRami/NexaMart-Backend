import mongoose from "mongoose";
import { nanoid } from 'nanoid';

const productSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    images: [{
        type: String,
        default: ""
    }],
    category: [{
        type: mongoose.Schema.ObjectId,
        ref: 'Category'
    }],
    subCategory: [{
        type: mongoose.Schema.ObjectId,
        ref: 'SubCategory'
    }],
    unit: {
        type: String,
        default: ""
    },
    stock: {
        type: Number,
        default: 0
    },
    price: {
        type: Number,
        default: null
    },
    discount: {
        type: Number,
        default: null
    },
    description: {
        type: String,
        default: ""
    },
    moreDetail: {
        type: Object,
        default: {}
    },
    Public: {
        type: Boolean,
        default: true
    },
    barcodeId: {
        type: String,
        default: () => nanoid(10),
        unique: true
    }
}, {
    timestamps: true
});

const ProductModel = mongoose.model("Product", productSchema);
export default ProductModel;