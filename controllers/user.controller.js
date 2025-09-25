import varificationEmailTemplate from '../config/verificationEmailTemplate.js'
import sendemail from '../email_handler/sendEmail.js'
import User from '../models/user.model.js'
import bcrypt from 'bcryptjs'
import genrateRefreshToken from '../utils/genrate_refreh_token.js';
import genrateAccessTokan from '../utils/genrate_access_token.js';
import dotenv from 'dotenv';
import jwt from 'jsonwebtoken';
import nodemailer from "nodemailer"; // You may need to use 'require' if using CommonJS
import multer from 'multer';
import path from 'path';
import { uploadMiddleware, deleteFile } from '../middleware/uploadMiddleware.js';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
dotenv.config()
// export async function registerUserController(request, response) {
//   try {
//     const { name, email, password } = request.body;

//     if (!name || !email || !password) {
//       return response.status(400).json({
//         message: "Please provide Email, Name, and Password.",
//         error: true,
//         success: false
//       });
//     }

//     const user = await User.findOne({ email });
//     if (user) {
//       return response.json({
//         message: "Email is already registered.",
//         error: true,
//         success: false
//       });
//     }

//     const salt = await bcrypt.genSalt(10);
//     const hashPassword = await bcrypt.hash(password, salt);

//     const payload = {
//       name,
//       email,
//       password: hashPassword 
//     };
//     const newUser = new User(payload);
//     console.log(newUser);


//     const save = await newUser.save();

//     // const verificationURL = `${process.env.FRONTEND_URL}/verify-email?code=${save?._id}`;

//     // const verifyemail = await sendemail({
//     //   sendTo: email,
//     //   Subject: "Verification email from NEXA-Mart",
//     //   html: varificationEmailTemplate({ name, url: verificationURL })
//     // });

//     return response.json({
//       message: "User registered successfully.",
//       error: false,
//       success: true,
//       data: save
//     });

//   } catch (error) {
//     console.log("Catch =",error);

//     return response.status(500).json({
//       message: error.message || error,
//       error: true,
//       success: false
//     });
//   }
// }

// Configure multer for avatar uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/avatars')
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + path.extname(file.originalname))
  }
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Not an image! Please upload an image.'), false);
    }
  }
}).single('avatar');

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export async function registerUserController(request, response) {
  console.log('Register User Request:', {
    body: request.body,
    headers: request.headers
  });

  try {
    const { name, email, password, mobile } = request.body;
    console.log('Registration data:', { name, email, mobile }); // Don't log password

    // Validate required fields
    if (!name || !email || !password) {
      console.log('Validation failed: Missing required fields');
      return response.status(400).json({
        message: "Please provide Email, Name, and Password.",
        error: true,
        success: false
      });
    }

    // Validate mobile number format if provided
    if (mobile && !/^\d{10}$/.test(mobile)) {
      console.log('Validation failed: Invalid mobile number format');
      return response.status(400).json({
        message: "Please provide a valid 10-digit mobile number.",
        error: true,
        success: false
      });
    }

    const existingUser = await User.findOne({ email });
    console.log('Existing user check:', { exists: !!existingUser });

    if (existingUser) {
      return response.json({
        message: "Email is already registered.",
        error: true,
        success: false
      });
    }

    // Check if mobile number is already registered
    if (mobile) {
      const existingMobile = await User.findOne({ mobile });
      if (existingMobile) {
        return response.json({
          message: "Mobile number is already registered.",
          error: true,
          success: false
        });
      }
    }

    const salt = await bcrypt.genSalt(10);
    const hashPassword = await bcrypt.hash(password, salt);

    const payload = {
      name,
      email,
      password: hashPassword,
      mobile: mobile || null // Include mobile in payload
    };
    const newUser = new User(payload);

    const save = await newUser.save();
    console.log('User saved successfully:', save._id);

    // Generate tokens immediately after user creation
    console.log('Generating tokens for user:', save._id);
    const accessToken = await genrateAccessTokan(save._id);
    const refreshToken = await genrateRefreshToken(save._id);

    // Set cookies with the same options as login
    const cookieOptions = {
      httpOnly: true,
      secure: true,
      sameSite: "None"
    };

    response.cookie('accessToken', accessToken, { ...cookieOptions, maxAge: 15 * 60 * 1000 }); // 15 minutes
    response.cookie('refreshToken', refreshToken, { ...cookieOptions, maxAge: 7 * 24 * 60 * 60 * 1000 }); // 7 days

    // Send verification email
    const verificationURL = `${process.env.FRONTEND_URL}/api/mailVerification?code=${save?._id}`;

    const transporter = nodemailer.createTransport({
      host: "smtp.gmail.com",
      port: 587,
      secure: false,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
      tls: {
        rejectUnauthorized: false
      }
    });

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: "Verification Mail",
      html: varificationEmailTemplate(newUser.name, verificationURL)
    };

    // Log email sending attempt
    console.log('Attempting to send verification email to:', email);

    // Send the email
    transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        console.error("Email sending error:", error);
      } else {
        console.log("Email sent: " + info.response);
      }
    });

    return response.json({
      message: "User registered successfully.",
      error: false,
      success: true,
      data: {
        user: {
          id: save._id,
          name: save.name,
          email: save.email,
          mobile: save.mobile,
          status: save.status
        }
      }
    });

  } catch (error) {
    console.error('Registration error:', error);
    return response.status(500).json({
      message: error.message || error,
      error: true,
      success: false
    });
  }
}

export async function verifyEmailController(request, response) {
  try {
    // Extract 'code' from query parameters
    const { code } = request.query;

    if (!code) {
      return response.status(400).json({
        message: "Verification code is required.",
        error: true,
        success: false
      });
    }

    // Find the user by their unique code
    const user = await User.findOne({ _id: code });

    if (!user) {
      return response.status(400).json({
        message: "Invalid or expired verification code.",
        error: true,
        success: false
      });
    }

    // Update the user's verify_email field to true
    const updateUser = await User.updateOne({ _id: code }, { verify_email: true });

    return response.status(200).json({
      message: "Email successfully verified.",
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

export async function loginController(request, response) {
  console.log('Login Request:', {
    body: request.body,
    headers: request.headers
  });

  try {
    const { email, password } = request.body;

    if (!email || !password) {
      console.log('Login validation failed: Missing credentials');
      return response.status(400).json({
        message: "Email and password are required",
        error: true,
        success: false
      });
    }

    const user = await User.findOne({ email });
    console.log('User found:', { exists: !!user, email });

    if (!user) {
      console.log('Login failed: User not found');
      return response.status(400).json({
        message: "User does not exist",
        error: true,
        success: false
      });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    console.log('Password validation:', { isValid: isPasswordValid });

    if (!isPasswordValid) {
      console.log('Login failed: Invalid password');
      return response.status(400).json({
        message: "Invalid password",
        error: true,
        success: false
      });
    }

    // Generate tokens
    console.log('Generating tokens for user:', user._id);
    const accessToken = await genrateAccessTokan(user._id);
    const refreshToken = await genrateRefreshToken(user._id);

    // Set cookies
    const cookieOptions = {
      httpOnly: true,
      secure: true,
      sameSite: "None",
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days for refresh token
    };

    response.cookie('accessToken', accessToken, { ...cookieOptions, maxAge: 15 * 60 * 1000 }); // 15 minutes
    response.cookie('refreshToken', refreshToken, cookieOptions);

    console.log('Login successful for user:', user._id);
    return response.json({
      message: "Login successful",
      error: false,
      success: true,
      data: {
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          status: user.status,
          role: user.role,
          mobile: user.mobile,
          bio: user.bio,
          avatar: user.avatar,
          tokens: {
            accessToken: accessToken,
            refreshToken: refreshToken
          }
        }
      }
    });

  } catch (error) {
    console.error('Login error:', error);
    return response.status(500).json({
      message: error.message || error,
      error: true,
      success: false
    });
  }
}

export async function refreshTokenController(request, response) {
  try {
    const refreshToken = request.cookies.refreshToken;

    if (!refreshToken) {
      return response.status(401).json({
        message: "Refresh token not found",
        error: true,
        success: false
      });
    }

    // Verify refresh token and get user ID
    const decoded = jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET);
    const userId = decoded.userId;

    // Generate new tokens
    const newAccessToken = await genrateAccessTokan(userId);
    const newRefreshToken = await genrateRefreshToken(userId);

    // Set new cookies
    const cookieOptions = {
      httpOnly: true,
      secure: true,
      sameSite: "None"
    };

    response.cookie('accessToken', newAccessToken, { ...cookieOptions, maxAge: 15 * 60 * 1000 });
    response.cookie('refreshToken', newRefreshToken, { ...cookieOptions, maxAge: 7 * 24 * 60 * 60 * 1000 });

    return response.json({
      message: "Tokens refreshed successfully",
      error: false,
      success: true
    });

  } catch (error) {
    return response.status(401).json({
      message: "Invalid refresh token",
      error: true,
      success: false
    });
  }
}

export async function logoutController(request, response) {
  console.log('Logout Request:', {
    cookies: request.cookies,
    headers: request.headers
  });

  try {
    console.log('Clearing cookies');
    response.clearCookie('accessToken');
    response.clearCookie('refreshToken');

    console.log('Logout successful');
    return response.json({
      message: "Logged out successfully",
      error: false,
      success: true
    });
  } catch (error) {
    console.error('Logout error:', error);
    return response.status(500).json({
      message: error.message || error,
      error: true,
      success: false
    });
  }
}

export async function updateUserController(request, response) {
  try {
    console.log("Hello");

    const userId = request.body.userId || request.user.id; // Get ID from body or token
    const updateData = request.body;
    delete updateData.userId; // Remove userId from update data

    // Basic validation
    if (!userId) {
      return response.status(400).json({
        message: "User ID is required",
        error: true,
        success: false
      });
    }

    const user = await User.findById(userId);
    console.log("user", user);
    if (!user) {
      return response.status(404).json({
        message: "User not found",
        error: true,
        success: false
      });
    }

    // Handle avatar upload if present
    if (request.file) {
      // Delete old avatar if exists
      if (user.avatar) {
        const oldAvatarPath = path.join(__dirname, '..', user.avatar);
        await deleteFile(oldAvatarPath);
      }
      // Set new avatar path
      updateData.avatar = `/uploads/avatars/${request.file.filename}`;
    }

    // Fields that are allowed to be updated
    const allowedUpdates = ['name', 'mobile', 'avatar'];

    // Filter out any fields that aren't allowed to be updated
    Object.keys(updateData).forEach(key => {
      if (!allowedUpdates.includes(key)) {
        delete updateData[key];
      }
    });

    // Update user data
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { $set: updateData },
      { new: true, runValidators: true }
    ).select('-password -refresh_token');

    return response.status(200).json({
      message: "Profile updated successfully",
      error: false,
      success: true,
      data: updatedUser
    });

  } catch (error) {
    // Clean up uploaded file if there's an error
    if (request.file) {
      const filePath = path.join(__dirname, '..', 'uploads', 'avatars', request.file.filename);
      await deleteFile(filePath);
    }

    return response.status(500).json({
      message: error.message || "Error updating profile",
      error: true,
      success: false
    });
  }
}

export async function deleteUserController(request, response) {
  try {
    const { userId } = request.params;

    if (!userId) {
      return response.status(400).json({
        message: "User ID is required.",
        error: true,
        success: false
      });
    }

    const user = await User.findById(userId);
    if (!user) {
      return response.status(404).json({
        message: "User not found.",
        error: true,
        success: false
      });
    }

    // Delete user's avatar if exists
    if (user.avatar) {
      const avatarPath = path.join(__dirname, '..', user.avatar);
      await deleteFile(avatarPath);
    }

    // Delete user
    await User.findByIdAndDelete(userId);

    return response.status(200).json({
      message: "User deleted successfully.",
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


export async function getUserCountController(request, response) {
  try {
    const userCount = await User.countDocuments();

    return response.status(200).json({
      message: "User count retrieved successfully.",
      error: false,
      success: true,
      data: { count: userCount }
    });

  } catch (error) {
    return response.status(500).json({
      message: error.message || "Internal Server Error",
      error: true,
      success: false
    });
  }
}

export async function getUserProfileController(request, response) {
  console.log('Getting user profile for ID:', request.params.userId);
  try {
    const { userId } = request.params;

    if (!userId) {
      console.log('User ID missing in request');
      return response.status(400).json({
        message: "User ID is required.",
        error: true,
        success: false
      });
    }

    console.log('Searching for user with ID:', userId);
    const user = await User.findById(userId)
      .select('-password -refresh_token')
      .lean();

    if (!user) {
      console.log('User not found for ID:', userId);
      return response.status(404).json({
        message: "User not found.",
        error: true,
        success: false
      });
    }

    console.log('User found:', user._id);
    return response.status(200).json({
      message: "User profile retrieved successfully.",
      error: false,
      success: true,
      data: user
    });

  } catch (error) {
    console.error('Error in getUserProfileController:', error);
    return response.status(500).json({
      message: error.message || "Internal server error",
      error: true,
      success: false
    });
  }
}

export async function getAllUsersController(request, response) {
  try {
    const page = parseInt(request.query.page) || 1;
    const limit = parseInt(request.query.limit) || 10;
    const search = request.query.search || '';
    const sortField = request.query.sortField || 'createdAt';
    const sortOrder = request.query.sortOrder || 'desc';

    const query = {};
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }

    const total = await User.countDocuments(query);
    const users = await User.find(query)
      .select('-password -refresh_token')
      .sort({ [sortField]: sortOrder })
      .skip((page - 1) * limit)
      .limit(limit);

    return response.status(200).json({
      message: "Users retrieved successfully.",
      error: false,
      success: true,
      data: users,
      pagination: {
        total,
        pages: Math.ceil(total / limit),
        page,
        limit
      }
    });
  } catch (error) {
    return response.status(500).json({
      message: error.message || error,
      error: true,
      success: false
    });
  }
}

export const changePasswordController = async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;
        const userId = req.params.userId;

        if (!currentPassword || !newPassword) {
            return res.status(400).json({
                success: false,
                message: "Current password and new password are required"
            });
        }

        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found"
            });
        }

        // Verify current password
        const isPasswordValid = await bcrypt.compare(currentPassword, user.password);
        if (!isPasswordValid) {
            return res.status(400).json({
                success: false,
                message: "Current password is incorrect"
            });
        }

        // Hash new password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(newPassword, salt);

        // Update password
        user.password = hashedPassword;
        await user.save();

        return res.status(200).json({
            success: true,
            message: "Password updated successfully"
        });
    } catch (error) {
        console.error("Error in changePasswordController:", error);
        return res.status(500).json({
            success: false,
            message: error.message || "Error updating password"
        });
    }
};