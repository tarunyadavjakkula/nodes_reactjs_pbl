import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { apiLimiter } from './middleware/rateLimiter.js';
import { errorHandler } from './middleware/errorHandler.js';
import { testConnection } from './config/db.js';

// Route imports
import healthRoutes from './routes/healthRoutes.js';
import authRoutes from './routes/authRoutes.js';
import categoryRoutes from './routes/categoryRoutes.js';
import transactionRoutes from './routes/transactionRoutes.js';
import budgetRoutes from './routes/budgetRoutes.js';
import analyticsRoutes from './routes/analyticsRoutes.js';
import reportRoutes from './routes/reportRoutes.js';
import recurringRoutes from './routes/recurringRoutes.js';
import goalRoutes from './routes/goalRoutes.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5001;

// CORS configuration
const allowedOrigins = [
  process.env.CLIENT_URL || 'http://localhost:5173',
  'http://127.0.0.1:5173',
  'http://localhost:5174',
  'http://127.0.0.1:5174',
];

app.use(cors({
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);
    if (allowedOrigins.indexOf(origin) !== -1 || process.env.NODE_ENV === 'development') {
      return callback(null, true);
    }
    return callback(new Error('Not allowed by CORS policy'));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// Body parser middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Apply rate limiting to all general API routes
app.use('/api', apiLimiter);

// Mount API routes
app.use('/api', healthRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/transactions', transactionRoutes);
app.use('/api/budgets', budgetRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/recurring', recurringRoutes);
app.use('/api/goals', goalRoutes);

// Root informational endpoint
app.get('/', (req, res) => {
  res.json({
    name: 'SpendWise API Server',
    tagline: 'Track Smart. Spend Better. Save More.',
    status: 'ACTIVE',
    docs: '/api/health',
    modules: [
      'auth',
      'categories',
      'transactions',
      'budgets',
      'analytics',
      'reports',
      'recurring',
      'notifications'
    ]
  });
});

// Centralized error handling middleware
app.use(errorHandler);

// Start server and verify database connection
const startServer = async () => {
  const dbStatus = await testConnection();
  if (dbStatus.success) {
    console.log(`✅ [SpendWise DB] ${dbStatus.message}`);
  } else {
    console.warn(`⚠️  [SpendWise DB Warning] ${dbStatus.message}`);
    console.warn('👉 Please ensure your MySQL credentials in backend/.env are configured.');
  }

  app.listen(PORT, () => {
    console.log(`🚀 [SpendWise Backend] Server running on http://localhost:${PORT}`);
    console.log(`📋 [SpendWise API] Health check endpoint: http://localhost:${PORT}/api/health`);
  });
};

startServer();

export default app;
