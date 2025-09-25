import express from "express";
import { imageUplodeController } from "../controllers/image_uplode.controller.js";
import multer from 'multer';

const imageUplodeRouter = express.Router()
const uplode = multer({
    storage:multer.diskStorage({
        destination:function(request,file,cd){
            cd(null,"./media/images")
        },filename:function (request,file,cd) {
            cd(null,file,this.filename+"_"+Date.now()+".jpg")
        }
    })
}).single('profile_image')

imageUplodeRouter.post("/Add",uplode, imageUplodeController);

export default imageUplodeRouter;