import mongoose from "mongoose";
import { nanoid } from 'nanoid';

const subCategorySchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    image: {
        type: String,
        default: ""
    },
    category: {
        type: mongoose.Schema.ObjectId,
        ref: "Category",
        required: true
    },
    barcodeId: {
        type: String,
        default: () => nanoid(10),
        unique: true
    }
}, {
    timestamps: true
})

const subCategoryModel = mongoose.model("SubCategory", subCategorySchema)
export default subCategoryModel