import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import cookieParser from 'cookie-parser';
import morgan from 'morgan';
import helmet from 'helmet';
import connectDB from './DB/connection.js';
import UserRoute from './route/User.route.js';
import cartRoutes from './route/cart.routes.js';
import subCategoryRouter from './route/subCategory.routes.js';
import orderRouter from './route/order.routes.js';
import categoryRouter from './route/category.routes.js';
import addressRouter from './route/address.routes.js';
import productRouter from './route/product.routes.js';
import { verifyEmailController } from './controllers/user.controller.js';
import imageUplodeRouter from './route/image_uplode.routes.js';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { authenticateToken, authorizeAdmin } from './middleware/auth.middleware.js';

dotenv.config()

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express()

// Configure helmet first
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" },
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'", "http://localhost:3000"]
    }
  }
}));

// Other middleware with logging
app.use(express.json());

app.use(cookieParser());

app.use(morgan('dev'));

// Update CORS configuration
app.use(cors({
  origin: 'http://localhost:3000', // Your frontend URL
  credentials: true, // Important for cookies
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

console.log('CORS configured');

// Add request logging middleware
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', 'http://localhost:3000');
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  next();
});


app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

const PORT = process.env.PORT || 5000;

connectDB()
  .then(() => {
    console.log('Database connected successfully');
    app.listen(PORT, () => {
      console.log('=================================');
      console.log(`Server Configuration:`);
      console.log(`- Port: ${PORT}`);
      console.log(`- Frontend URL: ${process.env.FRONTEND_URL}`);
      console.log(`Server is running at http://localhost:${PORT}`);
      console.log('=================================');
    });
  })
  .catch(err => {
    console.error('Database connection failed:', err);
  });

// Routes with logging
app.get("/", (request, response) => {
  console.log('Root endpoint accessed');
  response.json({ "message": "Hello World" });
});

// Log route registration
console.log('Registering routes...');

// Public routes
app.use('/api/user', UserRoute);

// Protected routes
app.use('/api/category', categoryRouter);
app.use('/api/sub-category', subCategoryRouter);
app.use('/api/product', productRouter);
app.use('/api/cart', cartRoutes);
app.use('/api/order', orderRouter);
app.use('/api/address', addressRouter);

// Admin-only routes
app.use('/api/admin/users', UserRoute);
app.use('/api/image-upload', imageUplodeRouter);

console.log('All routes registered');

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error occurred:', err);
  res.status(500).json({
    message: 'Internal Server Error',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

console.log('Server setup complete');

