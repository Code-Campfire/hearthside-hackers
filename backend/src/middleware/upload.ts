import multer from 'multer';
import path from 'path';
import fs from 'fs';

// Configure storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = process.env.RECEIPT_STORAGE_PATH || './uploads/receipts';
    // Ensure directory exists
    fs.mkdirSync(uploadPath, { recursive: true });
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    // Format: userId_timestamp_random.ext
    const userId = (req as any).userId; // from authenticateToken middleware
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(7);
    const ext = path.extname(file.originalname);
    cb(null, `${userId}_${timestamp}_${random}${ext}`);
  }
});

// File filter validation
const fileFilter = (req: any, file: any, cb: any) => {
  const allowedMimes = ['image/jpeg', 'image/png', 'application/pdf'];
  const allowedExts = ['.jpg', '.jpeg', '.png', '.pdf'];

  const ext = path.extname(file.originalname).toLowerCase();

  if (!allowedMimes.includes(file.mimetype) || !allowedExts.includes(ext)) {
    return cb(new Error('Invalid file type. Only JPG, PNG, PDF allowed.'));
  }

  cb(null, true);
};

// Export configured multer
export const receiptUpload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: (parseInt(process.env.MAX_RECEIPT_SIZE_MB || '10') * 1024 * 1024),
    files: 1
  }
});
