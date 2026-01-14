import express, { Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { checkDatabaseConnection } from './db.js';
import authRouter from './routes/auth.js';
import transactionRouter from './routes/transaction.js';
import receiptRouter from './routes/receipt.js';
import billsRouter from './routes/bills.js';
import categoriesRouter from './routes/categories.js';
import dashboardRouter from './routes/dashboard.js';

dotenv.config();

if (!process.env.JWT_SECRET) {
  throw new Error('JWT_SECRET is required');
}

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
const allowedOrigins = (process.env.CORS_ORIGIN || 'http://localhost:5174')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
        return;
      }
      callback(new Error('Not allowed by CORS'));
    },
  })
);
app.use(express.json());

// Health check endpoint
app.get('/api/health', async (_req: Request, res: Response) => {
  const dbConnected = await checkDatabaseConnection();

  if (dbConnected) {
    res.status(200).json({
      status: 'ok',
      message: 'Backend and database are connected',
      database: 'connected'
    });
  } else {
    res.status(503).json({
      status: 'error',
      message: 'Database connection failed',
      database: 'disconnected'
    });
  }
});

// Auth routes
app.use('/api/auth', authRouter);

// Transaction routes
app.use('/api/transactions', transactionRouter);

// Receipt routes
app.use('/api/receipts', receiptRouter);

// Bills routes
app.use('/api/bills', billsRouter);

// Categories routes
app.use('/api/categories', categoriesRouter);

// Dashboard routes
app.use('/api/dashboard', dashboardRouter);

// Start server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
