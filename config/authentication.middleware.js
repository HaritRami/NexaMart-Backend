import jwt from 'jsonwebtoken';
import User from '../models/user.model.js';
import dotenv from 'dotenv';
dotenv.config()

// Middleware to validate the access token
export const authenticate = async (req, res, next) => {
  try {
    const token = req.cookies.accessToken || req.headers.authorization?.split(' ')[1];

    // If no token is provided
    if (!token) {
      return res.status(401).json({
        message: "Access token is missing or invalid",
        error: true,
        success: false
      });
    }

    const decoded = jwt.verify(token, process.env.SECRET_KEY_ACCESS_TOKEN); 

    // Find the user based on the decoded user ID
    const user = await User.findById(decoded.userId);
    if (!user) {
      return res.status(401).json({
        message: "User not found",
        error: true,
        success: false
      });
    }

    if (user.status !== "Active") {
      return res.status(401).json({
        message: "Your account is not active",
        error: true,
        success: false
      });
    }

    req.user = user;

    next();

  } catch (error) {
    return res.status(401).json({
      message: "Unauthorized access",
      error: true,
      success: false,
      details: error.message
    });
  }
};
