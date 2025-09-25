import { Router } from "express";
import {
    deleteUserController,
    loginController,
    registerUserController,
    updateUserController,
    verifyEmailController,
    refreshTokenController,
    logoutController,
    getAllUsersController,
    getUserProfileController,
    changePasswordController,
    getUserCountController
} from "../controllers/user.controller.js";
import { authenticateToken } from "../middleware/auth.middleware.js";
import { uploadMiddleware } from '../middleware/uploadMiddleware.js';

const UserRoute = Router();

// Public routes
UserRoute.post('/register', registerUserController);
UserRoute.post('/login', loginController);
UserRoute.post('/verify-email', verifyEmailController);
UserRoute.post('/refresh-token', refreshTokenController);
UserRoute.post('/logout', logoutController);

// Protected routes
UserRoute.get('/user-count',authenticateToken, getUserCountController);
UserRoute.get('/', authenticateToken, getAllUsersController);
UserRoute.get('/profile/:userId', authenticateToken, getUserProfileController);
UserRoute.put('/profile/update/:userId', authenticateToken, uploadMiddleware.avatar, updateUserController);
UserRoute.put('/change-password/:userId', authenticateToken, changePasswordController);
UserRoute.delete('/delete/:userId', authenticateToken, deleteUserController);

export default UserRoute;