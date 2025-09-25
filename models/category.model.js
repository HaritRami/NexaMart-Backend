import mongoose from "mongoose";
import { nanoid } from 'nanoid';

const categorySchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    description: {
        type: String
    },
    image: {
        type: String,  // This will store the image path
        default: ""
    },
    barcodeId: {
        type: String,
        default: () => nanoid(10),
        unique: true
    }
}, {
    timestamps: true
})

const CategoryModel = mongoose.model("Category", categorySchema)
export default CategoryModel