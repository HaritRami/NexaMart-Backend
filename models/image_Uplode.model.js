import mongoose from "mongoose";
const ImageUplode = new mongoose.Schema({
   
    profile_image:{
        type:String,
        
    }
},{
    timestamps:true
})

const ImageUplodeModel = mongoose.model("ImageUplode",ImageUplode)
export default ImageUplodeModel;