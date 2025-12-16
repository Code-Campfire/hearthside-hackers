# Receipt Scanner Feature - Technical Rundown

## Feature Overview

**Purpose:** Allow users to upload receipt images and automatically extract transaction data (merchant, date, amount, line items) to create transactions without manual data entry.

**User Flow:**
1. User uploads receipt image (photo or scanned document)
2. System processes image and extracts structured data
3. User reviews and confirms/edits extracted data
4. Transaction is created and saved to database

**Business Value:**
- Reduces manual data entry time by 80-90%
- Improves accuracy of transaction records
- Increases user engagement with the app
- Enables quick expense tracking on-the-go

---

## Technology Decision: Google Cloud Vision API

### Chosen Solution
**Google Cloud Vision API** - OCR service with permanent free tier

### Why Google Cloud Vision?

**Pros:**
- **Free tier:** 1,000 OCR requests/month permanently (perfect for personal/learning project)
- **High accuracy:** 90-95% for printed receipts
- **Purpose-built:** Optimized for document/receipt text extraction
- **Production-ready:** Reliable, scalable, well-documented
- **No vendor lock-in concerns:** Standard OCR API, easy to swap if needed

**Cons:**
- Requires Google Cloud account setup
- Requires internet connection
- User receipt data sent to Google (privacy consideration)
- Returns unstructured text (requires parsing)

### Alternative Options Considered

| Option | Cost | Accuracy | Pros | Cons | Decision |
|--------|------|----------|------|------|----------|
| **Tesseract.js** | Free | 70-85% | No API costs, full control | Lower accuracy, complex preprocessing | Rejected - accuracy too low |
| **Claude API** | $0.006/receipt | 95%+ | Returns structured JSON | Costs money, requires separate API billing | Rejected - unnecessary cost |
| **OpenAI GPT-4o** | $0.013/receipt | 95%+ | Returns structured JSON | Higher cost than Claude | Rejected - unnecessary cost |
| **AWS Textract** | Free (3mo trial) | 90-95% | Good accuracy | Only free for 3 months | Rejected - trial limitation |

---

## Architecture Overview

### High-Level Flow

```
┌─────────────────────────────────────────────┐
│  User uploads receipt image in React       │
│  (Camera or file picker)                   │
└─────────────────┬───────────────────────────┘
                  │ POST /api/receipts/scan
                  │ (multipart/form-data)
┌─────────────────▼───────────────────────────┐
│  Backend receives image (Multer)            │
│  - Validate file type (jpg, png, pdf)      │
│  - Validate file size (< 10MB)             │
└─────────────────┬───────────────────────────┘
                  │
┌─────────────────▼───────────────────────────┐
│  Image Preprocessing (Sharp)                │
│  - Resize to optimal dimensions            │
│  - Convert to base64 for API               │
│  - Optional: enhance contrast/grayscale    │
└─────────────────┬───────────────────────────┘
                  │
┌─────────────────▼───────────────────────────┐
│  Google Cloud Vision API                    │
│  - TEXT_DETECTION request                  │
│  - Returns: fullTextAnnotation             │
└─────────────────┬───────────────────────────┘
                  │
┌─────────────────▼───────────────────────────┐
│  Text Parsing (Custom logic)                │
│  - Extract merchant (top lines)            │
│  - Extract date (regex patterns)           │
│  - Extract total ($ amount near bottom)    │
│  - Extract line items (item + price pairs) │
│  - Extract tax, tip, subtotal              │
└─────────────────┬───────────────────────────┘
                  │
┌─────────────────▼───────────────────────────┐
│  Return structured JSON to frontend         │
│  {                                          │
│    merchant: "Whole Foods",                 │
│    date: "2025-12-09",                      │
│    total: 87.43,                            │
│    items: [...],                            │
│    confidence: "high"                       │
│  }                                          │
└─────────────────┬───────────────────────────┘
                  │
┌─────────────────▼───────────────────────────┐
│  User Review UI (React)                     │
│  - Show extracted data in editable form    │
│  - User confirms or corrects               │
│  - User assigns category                   │
└─────────────────┬───────────────────────────┘
                  │ POST /api/transactions
┌─────────────────▼───────────────────────────┐
│  Save transaction to PostgreSQL             │
│  - Store original receipt image (optional) │
│  - Store OCR confidence scores             │
│  - Link to user account                    │
└─────────────────────────────────────────────┘
```

---

## Database Schema Additions

### New Tables

#### `receipts` Table
```sql
CREATE TABLE receipts (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  transaction_id INTEGER REFERENCES transactions(id) ON DELETE SET NULL,

  -- Image storage
  image_url TEXT,                    -- S3/local file path (optional)
  image_size_bytes INTEGER,
  image_format VARCHAR(10),          -- 'jpg', 'png', 'pdf'

  -- OCR data
  raw_ocr_text TEXT,                 -- Full text from Vision API
  ocr_confidence DECIMAL(5,2),       -- 0-100 confidence score

  -- Extracted data (before user confirmation)
  extracted_merchant VARCHAR(255),
  extracted_date DATE,
  extracted_total DECIMAL(19,4),
  extracted_items JSONB,             -- Array of {name, price}

  -- Metadata
  uploaded_at TIMESTAMP DEFAULT NOW(),
  processed_at TIMESTAMP,
  status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'processed', 'failed', 'confirmed'

  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_receipts_user_id ON receipts(user_id);
CREATE INDEX idx_receipts_transaction_id ON receipts(transaction_id);
CREATE INDEX idx_receipts_status ON receipts(status);
```

#### Update `transactions` Table
```sql
-- Add optional reference to receipt
ALTER TABLE transactions
ADD COLUMN receipt_id INTEGER REFERENCES receipts(id) ON DELETE SET NULL;

-- Add flag for receipt-created transactions
ALTER TABLE transactions
ADD COLUMN created_from_receipt BOOLEAN DEFAULT FALSE;
```

---

## Backend Implementation

### Required Dependencies

```bash
cd backend
npm install @google-cloud/vision multer sharp
npm install -D @types/multer
```

### File Structure

```
backend/src/
├── routes/
│   └── receipts.ts          # Receipt scanning endpoints
├── services/
│   ├── visionOcr.ts         # Google Vision API integration
│   └── receiptParser.ts     # Text parsing logic
├── middleware/
│   └── upload.ts            # Multer configuration
└── utils/
    └── receiptValidation.ts # Validation schemas
```

### Environment Variables

Add to `backend/.env`:
```env
# Google Cloud Vision API
GOOGLE_APPLICATION_CREDENTIALS=/path/to/service-account-key.json
# OR use API key
GOOGLE_VISION_API_KEY=your_api_key_here

# File upload settings
MAX_RECEIPT_SIZE_MB=10
ALLOWED_RECEIPT_FORMATS=jpg,jpeg,png,pdf

# Optional: Receipt image storage
RECEIPT_STORAGE_PATH=/app/uploads/receipts  # Local storage
# AWS_S3_BUCKET=your-bucket-name            # Cloud storage (future)
```

### API Endpoints

#### `POST /api/receipts/scan`
**Description:** Upload and scan a receipt image

**Request:**
- Content-Type: `multipart/form-data`
- Body: `receipt` (file field)

**Response:**
```json
{
  "success": true,
  "data": {
    "receiptId": 123,
    "merchant": "Whole Foods Market",
    "date": "2025-12-09",
    "total": 87.43,
    "subtotal": 81.50,
    "tax": 5.93,
    "tip": 0,
    "items": [
      {"name": "Organic Bananas", "price": 3.99},
      {"name": "Almond Milk", "price": 4.50}
    ],
    "confidence": "high",
    "rawText": "WHOLE FOODS MARKET\n123 Main St..."
  }
}
```

**Error Response:**
```json
{
  "success": false,
  "error": "Invalid file format. Only JPG, PNG, PDF allowed."
}
```

#### `GET /api/receipts/:id`
**Description:** Get receipt details and OCR results

**Response:**
```json
{
  "id": 123,
  "userId": 1,
  "transactionId": 456,
  "extractedMerchant": "Whole Foods",
  "extractedDate": "2025-12-09",
  "extractedTotal": 87.43,
  "status": "confirmed",
  "uploadedAt": "2025-12-09T10:30:00Z"
}
```

#### `POST /api/receipts/:id/confirm`
**Description:** User confirms receipt data and creates transaction

**Request:**
```json
{
  "merchant": "Whole Foods",  // User-corrected data
  "date": "2025-12-09",
  "amount": 87.43,
  "categoryId": 2,
  "notes": "Weekly groceries"
}
```

**Response:**
```json
{
  "success": true,
  "transactionId": 456
}
```

---

## Frontend Implementation

### Required Dependencies

```bash
cd frontend
npm install react-dropzone
```

### Component Structure

```
frontend/src/
├── components/
│   └── receipts/
│       ├── ReceiptUploader.tsx       # Drag-and-drop upload UI
│       ├── ReceiptPreview.tsx        # Show image preview
│       ├── ReceiptDataReview.tsx     # Editable form for extracted data
│       └── ReceiptScanner.tsx        # Main orchestrator component
├── hooks/
│   └── useReceiptScanning.ts         # API calls and state management
└── types/
    └── receipt.ts                    # TypeScript interfaces
```

### User Interface Flow

1. **Upload Screen**
   - Drag-and-drop zone or file picker
   - Camera capture option (mobile)
   - Image preview before upload
   - Upload progress indicator

2. **Processing Screen**
   - Loading spinner
   - "Analyzing receipt..." message
   - Show image thumbnail

3. **Review Screen**
   - Side-by-side: receipt image + extracted data form
   - Editable fields:
     - Merchant (text input with autocomplete)
     - Date (date picker)
     - Total amount (number input)
     - Category (dropdown)
     - Line items (editable list)
   - Confidence indicator (high/medium/low)
   - "Create Transaction" button

4. **Success Screen**
   - Confirmation message
   - Link to view transaction
   - "Scan Another Receipt" button

---

## Text Parsing Strategy

### Challenges
- Receipts have inconsistent formats
- Merchant names vary in position
- Dates come in multiple formats (MM/DD/YYYY, DD-MM-YYYY, etc.)
- Totals vs subtotals vs tax can be confusing

### Parsing Rules (Priority Order)

#### 1. Merchant Name
```javascript
// Usually in first 1-3 lines, all caps, longest line
function extractMerchant(lines) {
  const topLines = lines.slice(0, 3);
  const longestLine = topLines.reduce((a, b) =>
    a.length > b.length ? a : b
  );
  return longestLine.trim();
}
```

#### 2. Date Extraction
```javascript
// Regex patterns for common formats
const datePatterns = [
  /(\d{1,2}\/\d{1,2}\/\d{2,4})/,     // MM/DD/YYYY
  /(\d{1,2}-\d{1,2}-\d{2,4})/,       // MM-DD-YYYY
  /(\d{4}-\d{2}-\d{2})/,              // YYYY-MM-DD
  /(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s+\d{1,2},?\s+\d{4}/i
];
```

#### 3. Total Amount
```javascript
// Look for "TOTAL" or "AMOUNT DUE" near a dollar amount
// Take the largest dollar amount in bottom 30% of receipt
const amountPattern = /\$?\s*(\d{1,6}\.\d{2})/g;
const totalKeywords = ['total', 'amount due', 'balance'];
```

#### 4. Line Items
```javascript
// Lines with both text and price
// Format: "Item name .......... $12.34"
// Exclude tax, tip, subtotal lines
const itemPattern = /^(.+?)\s+\$?(\d+\.\d{2})$/;
```

### Confidence Scoring

```javascript
function calculateConfidence(extracted) {
  let score = 0;
  if (extracted.merchant) score += 25;
  if (extracted.date && isValidDate(extracted.date)) score += 25;
  if (extracted.total && extracted.total > 0) score += 30;
  if (extracted.items && extracted.items.length > 0) score += 20;

  return score >= 70 ? 'high' : score >= 40 ? 'medium' : 'low';
}
```

---

## Google Cloud Vision API Setup

### Step 1: Create Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create new project: "Budget Analyzer"
3. Enable **Cloud Vision API**:
   - Navigate to "APIs & Services" → "Library"
   - Search "Cloud Vision API"
   - Click "Enable"

### Step 2: Create Service Account (Recommended)

1. Go to "IAM & Admin" → "Service Accounts"
2. Click "Create Service Account"
3. Name: "receipt-scanner-service"
4. Grant role: "Cloud Vision API User"
5. Click "Create Key" → JSON
6. Download JSON key file
7. Store securely in `backend/config/google-vision-key.json`
8. Add to `.gitignore`: `config/*.json`

### Step 3: Set Environment Variable

**Option A: Service Account (Recommended)**
```bash
# In backend/.env
GOOGLE_APPLICATION_CREDENTIALS=/app/config/google-vision-key.json
```

**Option B: API Key (Simpler, less secure)**
```bash
# In backend/.env
GOOGLE_VISION_API_KEY=AIza...your-key-here
```

### Step 4: Test Connection

```typescript
// backend/src/services/visionOcr.ts
import vision from '@google-cloud/vision';

const client = new vision.ImageAnnotatorClient();

async function testVisionAPI() {
  try {
    const [result] = await client.textDetection('./test-receipt.jpg');
    console.log('✅ Google Vision API connected successfully');
    console.log('Detected text:', result.fullTextAnnotation.text);
  } catch (error) {
    console.error('❌ Vision API error:', error);
  }
}
```

---

## Security Considerations

### 1. File Upload Security

**Threats:**
- Malicious file uploads (executable disguised as image)
- Oversized files (DoS attack)
- Path traversal attacks

**Mitigations:**
```typescript
// Multer configuration
const upload = multer({
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB max
  },
  fileFilter: (req, file, cb) => {
    // Check MIME type
    const allowedTypes = ['image/jpeg', 'image/png', 'application/pdf'];
    if (!allowedTypes.includes(file.mimetype)) {
      return cb(new Error('Invalid file type'));
    }

    // Check file extension
    const ext = path.extname(file.originalname).toLowerCase();
    if (!['.jpg', '.jpeg', '.png', '.pdf'].includes(ext)) {
      return cb(new Error('Invalid file extension'));
    }

    cb(null, true);
  }
});
```

### 2. User Authorization

- Users can only scan receipts for their own account
- JWT token validation required
- Check `userId` matches authenticated user

```typescript
// Middleware
async function authorizeReceipt(req, res, next) {
  const receipt = await db.query('SELECT user_id FROM receipts WHERE id = $1', [req.params.id]);
  if (receipt.user_id !== req.user.id) {
    return res.status(403).json({ error: 'Unauthorized' });
  }
  next();
}
```

### 3. Sensitive Data Handling

- Receipts may contain full credit card numbers (last 4 digits)
- May contain personal information
- Consider **not storing** original images permanently
- Option: Delete image after OCR processing completes
- Or: Encrypt images at rest if storing long-term

```typescript
// Optional: Auto-delete after 30 days
async function cleanupOldReceipts() {
  await db.query(`
    DELETE FROM receipts
    WHERE uploaded_at < NOW() - INTERVAL '30 days'
    AND status = 'confirmed'
  `);
}
```

### 4. Rate Limiting

```typescript
import rateLimit from 'express-rate-limit';

const receiptScanLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // 10 receipts per 15 min per user
  message: 'Too many receipt uploads. Please try again later.'
});

app.post('/api/receipts/scan', receiptScanLimiter, uploadReceipt);
```

---

## Testing Strategy

### Unit Tests

**Text Parsing Logic:**
```typescript
describe('receiptParser', () => {
  test('extracts merchant name from receipt text', () => {
    const text = 'WHOLE FOODS MARKET\n123 Main St\n...';
    expect(extractMerchant(text)).toBe('WHOLE FOODS MARKET');
  });

  test('extracts date in MM/DD/YYYY format', () => {
    const text = 'Date: 12/09/2025\nTotal: $50.00';
    expect(extractDate(text)).toBe('2025-12-09');
  });

  test('extracts total amount', () => {
    const text = 'SUBTOTAL $45.00\nTAX $5.00\nTOTAL $50.00';
    expect(extractTotal(text)).toBe(50.00);
  });
});
```

### Integration Tests

**API Endpoint:**
```typescript
describe('POST /api/receipts/scan', () => {
  test('successfully scans valid receipt image', async () => {
    const response = await request(app)
      .post('/api/receipts/scan')
      .attach('receipt', './tests/fixtures/sample-receipt.jpg')
      .set('Authorization', `Bearer ${validToken}`);

    expect(response.status).toBe(200);
    expect(response.body.data.merchant).toBeDefined();
    expect(response.body.data.total).toBeGreaterThan(0);
  });

  test('rejects invalid file type', async () => {
    const response = await request(app)
      .post('/api/receipts/scan')
      .attach('receipt', './tests/fixtures/malicious.exe')
      .set('Authorization', `Bearer ${validToken}`);

    expect(response.status).toBe(400);
  });
});
```

### Manual Testing Checklist

- [ ] Upload clear, well-lit receipt → High confidence extraction
- [ ] Upload blurry receipt → Lower confidence, still usable
- [ ] Upload receipt at an angle → Handles skewed text
- [ ] Upload handwritten receipt → Lower accuracy, manual review needed
- [ ] Upload non-receipt image → Fails gracefully
- [ ] Upload oversized file (>10MB) → Rejected with error
- [ ] Upload .exe file → Rejected with error
- [ ] Test with various receipt formats (grocery, restaurant, gas station)
- [ ] Test date parsing for different formats
- [ ] Verify user can edit extracted data
- [ ] Confirm transaction is created correctly

---

## Performance Considerations

### 1. Image Optimization

```typescript
// Resize large images before sending to Vision API
import sharp from 'sharp';

async function optimizeImage(buffer: Buffer): Promise<Buffer> {
  return sharp(buffer)
    .resize(1600, 1600, { fit: 'inside' }) // Max 1600px width/height
    .jpeg({ quality: 85 })                  // Compress to reduce API payload
    .toBuffer();
}
```

**Benefits:**
- Faster API requests (smaller payload)
- Lower bandwidth costs
- Same OCR accuracy (Vision API handles resizing well)

### 2. Caching OCR Results

```typescript
// Cache parsed results to avoid re-parsing
const receiptCache = new Map();

function getCachedReceipt(receiptId: number) {
  return receiptCache.get(receiptId);
}
```

### 3. Async Processing (Future Enhancement)

For production, consider background job processing:
```
User uploads → Job queued → Background worker processes → Notify user
```

**Tools:** Bull (Redis-based queue), BullMQ

---

## Common Issues & Troubleshooting

### Issue: Low OCR Accuracy

**Symptoms:** Incorrect merchant, wrong total, missing items

**Causes:**
- Poor image quality (blurry, dark, low resolution)
- Faded thermal receipts
- Crumpled or torn receipts
- Handwritten receipts

**Solutions:**
- Provide user guidance: "Take photo in good lighting"
- Implement image preprocessing (enhance contrast, sharpen)
- Lower confidence score → prompt user to review carefully
- Allow manual data entry as fallback

### Issue: Google Vision API Authentication Fails

**Error:** `Error: Could not load the default credentials`

**Solutions:**
1. Check `GOOGLE_APPLICATION_CREDENTIALS` path is correct
2. Verify service account JSON file exists
3. Ensure service account has "Cloud Vision API User" role
4. Try using API key instead of service account

```bash
# Test credentials
export GOOGLE_APPLICATION_CREDENTIALS="/path/to/key.json"
node backend/src/services/visionOcr.ts
```

### Issue: File Upload Fails

**Error:** `MulterError: File too large`

**Solutions:**
- Increase `MAX_RECEIPT_SIZE_MB` in `.env`
- Update Multer limits:
  ```typescript
  limits: { fileSize: 20 * 1024 * 1024 } // 20MB
  ```
- Provide user feedback: "Image must be under 10MB"

### Issue: Parsing Fails for Non-English Receipts

**Current Limitation:** Parser assumes English text

**Solutions:**
- Google Vision API supports 50+ languages automatically
- Update parsing logic to handle international formats
- Add language detection and custom parsers

---

## Future Enhancements

### Phase 1: Basic Improvements (Near-term)

1. **Better parsing accuracy**
   - Machine learning model trained on receipt data
   - Use receipt-specific parsing libraries (e.g., `receipt-parser`)
   - Implement fallback to Claude API for difficult receipts

2. **Bulk upload**
   - Upload multiple receipts at once
   - Batch processing

3. **Receipt templates**
   - Learn merchant-specific formats
   - Auto-categorize based on merchant

### Phase 2: Advanced Features (Medium-term)

4. **Mobile camera integration**
   - Direct camera capture (not file picker)
   - Real-time edge detection (crop receipt automatically)

5. **Receipt matching**
   - Match scanned receipts to existing transactions
   - Attach receipts to manually entered transactions

6. **Duplicate detection**
   - Warn if same receipt uploaded twice
   - Compare OCR text similarity

### Phase 3: Premium Features (Long-term)

7. **Email receipt forwarding**
   - User forwards email receipts to custom email
   - Parse PDF/HTML email receipts automatically

8. **Warranty tracking**
   - Extract product info from receipts
   - Notify user before warranty expires

9. **Expense report generation**
   - Export receipts as PDF for reimbursement
   - Group by date range, category, merchant

---

## Cost Estimation

### Free Tier (Current Plan)

**Google Cloud Vision API:**
- 1,000 OCR requests/month: **FREE**
- Beyond 1,000: $1.50 per 1,000 images

**Expected Usage (Personal Project):**
- 5-50 receipts/month
- **Monthly cost: $0**

### If Scaling to Production

**Scenario:** 1,000 users, average 20 receipts/month each

- Total receipts: 20,000/month
- Free tier: 1,000
- Billable: 19,000
- Cost: 19 × $1.50 = **$28.50/month**

**Additional costs:**
- Image storage (S3): ~$0.50/month
- Database: $0 (PostgreSQL included in hosting)
- **Total: ~$30/month**

**Cost optimization:**
- Implement client-side Tesseract.js for clear receipts
- Only use Vision API for difficult/blurry receipts
- Reduce costs by 60-70%

---

## Migration Path to Alternative OCR

If you need to switch OCR providers later, the impact is minimal:

### What changes:
- `backend/src/services/visionOcr.ts` → Replace API client
- Environment variables

### What stays the same:
- API endpoints (`/api/receipts/scan`)
- Database schema
- Frontend components
- Text parsing logic (mostly)
- User experience

**Example:** Switching to AWS Textract
```typescript
// Replace this:
import vision from '@google-cloud/vision';
const client = new vision.ImageAnnotatorClient();

// With this:
import AWS from 'aws-sdk';
const textract = new AWS.Textract();
```

All other code remains unchanged!

---

## AI-Specific Guidance (for Claude Code)

### When user asks to "implement receipt scanning":

1. **Start with backend:**
   - Install dependencies: `@google-cloud/vision`, `multer`, `sharp`
   - Create `/api/receipts/scan` endpoint
   - Implement Vision API integration in `services/visionOcr.ts`
   - Implement text parsing in `services/receiptParser.ts`

2. **Then frontend:**
   - Install `react-dropzone`
   - Create `ReceiptUploader.tsx` component
   - Create review/confirmation UI
   - Add API integration with Axios

3. **Database last:**
   - Create `receipts` table migration
   - Update `transactions` table with `receipt_id` column

### When user asks to "fix receipt parsing accuracy":

- Focus on `backend/src/services/receiptParser.ts`
- Improve regex patterns for date/amount extraction
- Add merchant name cleaning (remove "INC", "LLC", etc.)
- Implement better line item detection

### When user asks about "receipt storage":

- Current plan: Store image URL in database, file on disk
- Recommend: AWS S3 for production (use `aws-sdk` or `@aws-sdk/client-s3`)
- Local development: Store in `backend/uploads/receipts/`
- Add cleanup job to delete old receipts

### Common commands for receipt feature:

```bash
# Backend development
cd backend
npm install @google-cloud/vision multer sharp
npm run dev

# Database migration
npm run migrate:create add_receipts_table
npm run migrate:up

# Test OCR locally
node -r ts-node/register src/services/visionOcr.ts
```

---

## References & Documentation

- [Google Cloud Vision API Docs](https://cloud.google.com/vision/docs)
- [Vision API Pricing](https://cloud.google.com/vision/pricing)
- [Multer Documentation](https://github.com/expressjs/multer)
- [Sharp Image Processing](https://sharp.pixelplumbing.com/)
- [React Dropzone](https://react-dropzone.js.org/)

---

## Changelog

- **2025-12-09:** Initial receipt scanner technical rundown created
  - Chose Google Cloud Vision API (free tier)
  - Defined architecture and data flow
  - Outlined database schema for receipts
  - Documented security considerations
  - Provided API setup instructions
  - Created testing strategy
