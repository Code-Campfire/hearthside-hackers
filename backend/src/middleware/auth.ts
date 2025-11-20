import { Request, Response, NextFunction } from 'express';
import { verifyToken } from '../auth.js';

// Extend Express Request type to include user
declare global {
  namespace Express {
    interface Request {
      userId?: number;
    }
  }
}

// Middleware to verify JWT token from Authorization header
export const authenticateToken = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer <token>

  if (!token) {
    res.status(401).json({
      success: false,
      message: 'Access token required',
    });
    return;
  }

  const decoded = verifyToken(token);

  if (!decoded) {
    res.status(401).json({
      success: false,
      message: 'Invalid or expired token',
    });
    return;
  }

  req.userId = decoded.userId;
  next();
};
