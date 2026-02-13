import express, { Application } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

// Load environment variables FIRST
dotenv.config();

import { connectDB } from './db/config';
import userRoutes from './api/routes/userRoutes';
import productRoutes from './api/routes/productRoutes';
import orderRoutes from './api/routes/orderRoutes';
import paymentRoutes from './api/routes/paymentRoutes';
import resetPasswordRoutes from './api/routes/resetPasswordRoutes';
import adminRoutes from './api/routes/adminRoutes';

const app: Application = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Database connection
connectDB();

// Routes
app.use('/api/users', userRoutes);
app.use('/api/products', productRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/reset-password', resetPasswordRoutes);
app.use('/api/admin', adminRoutes);
// Health check
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'OK', message: 'Server is running' });
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

export default app;
