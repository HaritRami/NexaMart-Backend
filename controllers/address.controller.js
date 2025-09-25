import AddressModel from "../models/address.model.js";
import User from "../models/user.model.js";

// Get all addresses for a specific user
export async function getUserAddressesController(request, response) {
  try {
    const { userId } = request.params;
    console.log('userId',userId);
    
    // Check if the requesting user matches the userId parameter
    // if (request.body.user !== userId) {
      // return response.status(403).json({
        // message: "You can only view your own addresses",
        // error: true,
        // success: false
      // });
    // }

    // Get all non-deleted addresses for the user
    const addresses = await AddressModel.find({ 
      user: userId,
      is_delete: false 
    });

    return response.status(200).json({
      message: "Addresses retrieved successfully.",
      error: false,
      success: true,
      data: addresses
    });
  } catch (error) {
    return response.status(500).json({
      message: error.message || error,
      error: true,
      success: false
    });
  }
}

export async function createAddressController(request, response) {
  try {
    const { address_line, city, state, country, mobile } = request.body;
    console.log('Root endpoint accessed',request);
    // Use the authenticated user's ID instead of passing it in the body
    const user = request.body.user;
    console.log("User id ",user);
    debugger
    if (!address_line || !city || !state || !country || !mobile) {
      return response.status(400).json({
        message: "All fields are required",
        error: true,
        success: false
      });
    }

    const newAddress = new AddressModel({ 
      user, 
      address_line, 
      city, 
      state, 
      country, 
      mobile,
      is_delete: false
    });
    const savedAddress = await newAddress.save();

    return response.status(201).json({
      message: "Address created successfully.",
      error: false,
      success: true,
      data: savedAddress
    });
  } catch (error) {
    return response.status(500).json({
      message: error.message || error,
      error: true,
      success: false
    });
  }
}

export async function getAddressController(request, response) {
  try {
    const { addressId } = request.params;
    console.log('addressId',addressId);
    
    const address = await AddressModel.findOne({ 
      _id: addressId,
      is_delete: false 
    });

    if (!address) {
      return response.status(404).json({
        message: "Address not found.",
        error: true,
        success: false
      });
    }

    // Verify the address belongs to the authenticated user
    if (address.user.toString() !== request.body.user) {
      return response.status(403).json({
        message: "You can only view your own addresses",
        error: true,
        success: false
      });
    }

    return response.status(200).json({
      message: "Address retrieved successfully.",
      error: false,
      success: true,
      data: address
    });
  } catch (error) {
    return response.status(500).json({
      message: error.message || error,
      error: true,
      success: false
    });
  }
}

export async function updateAddressController(request, response) {
  try {
    const { addressId } = request.params;
    const updateData = request.body;

    // First find the address to verify ownership
    const existingAddress = await AddressModel.findById(addressId);
    if (!existingAddress || existingAddress.is_delete) {
      return response.status(404).json({
        message: "Address not found.",
        error: true,
        success: false
      });
    }

    // Verify the address belongs to the authenticated user
    if (existingAddress.user.toString() !== request.body.user) {
      return response.status(403).json({
        message: "You can only update your own addresses",
        error: true,
        success: false
      });
    }

    // Prevent updating the user field
    delete updateData.user;

    const address = await AddressModel.findByIdAndUpdate(
      addressId, 
      { ...updateData, is_delete: false },
      { new: true }
    );

    return response.status(200).json({
      message: "Address updated successfully.",
      error: false,
      success: true,
      data: address
    });
  } catch (error) {
    return response.status(500).json({
      message: error.message || error,
      error: true,
      success: false
    });
  }
}

export async function deleteAddressController(request, response) {
  try {
    const { addressId } = request.params;
    
    // First find the address to verify ownership
    const existingAddress = await AddressModel.findById(addressId);
    if (!existingAddress || existingAddress.is_delete) {
      return response.status(404).json({
        message: "Address not found.",
        error: true,
        success: false
      });
    }

    // Verify the address belongs to the authenticated user
    // if (existingAddress.user.toString() !== request.body.user) {
      // return response.status(403).json({
        // message: "You can only delete your own addresses",
        // error: true,
        // success: false
      // });
    // }

    // Soft delete by setting is_delete to true
    const address = await AddressModel.findByIdAndUpdate(
      addressId,
      { is_delete: true },
      { new: true }
    );

    return response.status(200).json({
      message: "Address deleted successfully.",
      error: false,
      success: true
    });
  } catch (error) {
    return response.status(500).json({
      message: error.message || error,
      error: true,
      success: false
    });
  }
}