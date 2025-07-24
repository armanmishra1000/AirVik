import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { connectDB } from './config/database';
import { authRoutes } from './src/routes/auth.routes';

dotenv.config();

// Connect to MongoDB with test connection string
const MONGODB_TEST_URI = 'mongodb+srv://test:test123@cluster0.mongodb.net/airvik-test?retryWrites=true&w=majority';
process.env.MONGODB_URI = MONGODB_TEST_URI;
connectDB();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Register API routes
app.use('/api/v1/auth', authRoutes);

// Health check route
app.get('/api/health', (req: Request, res: Response) => {
  res.status(200).json({ status: 'ok', message: 'Airvik API is running' });
});

// Error handling middleware
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error(err.stack);
  res.status(500).json({
    status: 'error',
    message: 'Something went wrong!',
  });
});

// 404 handler
app.use((req: Request, res: Response) => {
  res.status(404).json({
    status: 'error',
    message: 'Route not found',
  });
});

app.listen(PORT, () => {
  console.log(`🚀 Airvik server running on port ${PORT}`);
  console.log(`📍 Health check: http://localhost:${PORT}/api/health`);
});

export default app;
