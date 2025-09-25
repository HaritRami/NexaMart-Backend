import ImageUplodeModel from "../models/image_Uplode.model.js";
import multer from 'multer'
export async function imageUplodeController(request, response) {
    try {
        const data = new ImageUplodeModel({
            profile_image:request.file ? request.file.filename:null
        })

    //   const { name } = request.body;
        
      if (!data) {
        return response.status(400).json({
          message: "Image is not saved .",
          error: true,
          success: false
        });
      }
      const data_save = data.save()
      
      if (data_save) {
        return response.status(201).json({
                message: "Image is saved .",
                error: false,
                success: true,
                data: data_save
            });
    }
      
    } catch (error) {
      return response.status(500).json({
        message: error.message || error,
        error: true,
        success: false
      });
    }
  }
  