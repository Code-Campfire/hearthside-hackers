import express, { Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { checkDatabaseConnection } from './db.js';
import authRouter from './routes/auth.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
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

// Start server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
