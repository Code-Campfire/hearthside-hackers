export interface ParsedReceipt {
  merchant_name: string | null;
  receipt_date: string | null; // ISO format YYYY-MM-DD
  total_amount: number | null;
  extracted_data: {
    subtotal?: number;
    tax?: number;
    tip?: number;
    items?: Array<{ name: string; price: number }>;
    rawDate?: string;
  };
  confidence: 'high' | 'medium' | 'low';
}

interface AmountWithPosition {
  amount: number;
  lineIndex: number;
  raw: string;
}

export function parseReceiptText(ocrText: string, lines: string[]): ParsedReceipt {
  const merchant = extractMerchant(lines);
  const date = extractDate(ocrText);

  // Use heuristic-based extraction for financial amounts
  const { total, subtotal, tax } = extractFinancialAmounts(lines);

  // Calculate confidence based on what we found
  const confidence = calculateParsingConfidence(merchant, date, total);

  return {
    merchant_name: merchant,
    receipt_date: date,
    total_amount: total,
    extracted_data: {
      subtotal,
      tax,
      rawDate: extractRawDate(ocrText)
    },
    confidence
  };
}

/**
 * Heuristic-based extraction of financial amounts.
 * Uses simple, reliable rules that work across receipt formats:
 * - TOTAL = largest amount on the receipt
 * - SUBTOTAL = second largest amount
 * - TAX = total - subtotal (calculated)
 */
function extractFinancialAmounts(lines: string[]): {
  total: number | null;
  subtotal: number | null;
  tax: number | null;
} {
  // Step 1: Extract all dollar amounts with their line positions
  const amounts = extractAllAmountsWithPositions(lines);

  if (amounts.length === 0) {
    return { total: null, subtotal: null, tax: null };
  }

  // Step 2: Sort amounts by value (descending)
  const sortedByValue = [...amounts].sort((a, b) => b.amount - a.amount);

  // Step 3: Total = largest amount (most reliable heuristic)
  const total = sortedByValue[0]?.amount ?? null;

  // Step 4: Subtotal = second largest amount
  let subtotal: number | null = null;
  if (sortedByValue.length >= 2) {
    subtotal = sortedByValue[1]?.amount ?? null;
  }

  // Step 5: Tax = total - subtotal (calculated, very reliable)
  let tax: number | null = null;
  if (total !== null && subtotal !== null) {
    const calculatedTax = Math.round((total - subtotal) * 100) / 100;
    // Sanity check: tax should be positive and reasonable (less than 25% of total)
    if (calculatedTax > 0 && calculatedTax < total * 0.25) {
      tax = calculatedTax;
    }
  }

  return { total, subtotal, tax };
}

/**
 * Extract all dollar amounts from lines with their positions
 */
function extractAllAmountsWithPositions(lines: string[]): AmountWithPosition[] {
  const amounts: AmountWithPosition[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    // Match amounts with $ sign (more reliable)
    const dollarMatches = line.matchAll(/\$\s*(\d+\.\d{2})/g);
    for (const match of dollarMatches) {
      amounts.push({
        amount: parseFloat(match[1]),
        lineIndex: i,
        raw: match[0]
      });
    }
  }

  return amounts;
}

function extractMerchant(lines: string[]): string | null {
  // Merchant is usually the first line that looks like a business name
  const topLines = lines.slice(0, 5);

  // Filter out lines that look like addresses, phone numbers, etc.
  const candidates = topLines.filter(line => {
    const cleaned = line.trim();
    return cleaned.length > 3 &&
           !/^\d+$/.test(cleaned) && // Not just numbers
           !/^[^a-zA-Z]+$/.test(cleaned) && // Contains letters
           !/^\d+\s+\w+\s+(st|street|ave|avenue|rd|road|blvd|dr|drive|ln|lane)/i.test(cleaned) && // Not an address
           !/^\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}$/.test(cleaned) && // Not a phone number
           !/^[A-Z]{2}\s+\d{5}/.test(cleaned) && // Not "STATE ZIP" pattern
           !/,\s*[A-Z]{2}\s+\d{5}/.test(cleaned); // Not "CITY, STATE ZIP" pattern
  });

  if (candidates.length === 0) return null;

  // Prefer the first valid candidate (usually the store name)
  const merchant = candidates[0];

  // Clean up common suffixes
  return cleanMerchantName(merchant);
}

function cleanMerchantName(name: string): string {
  return name
    .replace(/\s+(INC|LLC|LTD|CORP|CO)\s*$/i, '')
    .replace(/[#*]+/g, '')
    .trim()
    .toUpperCase();
}

function extractDate(text: string): string | null {
  // Try multiple date formats
  const patterns = [
    /(\d{1,2}\/\d{1,2}\/\d{2,4})/,           // MM/DD/YYYY or DD/MM/YYYY
    /(\d{1,2}-\d{1,2}-\d{2,4})/,             // MM-DD-YYYY
    /(\d{4}-\d{2}-\d{2})/,                    // YYYY-MM-DD
    /(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+\d{1,2},?\s+\d{4}/i
  ];

  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match) {
      return parseDate(match[0]);
    }
  }

  return null;
}

function parseDate(dateStr: string): string {
  try {
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) {
      // Try MM/DD/YYYY format
      const parts = dateStr.split(/[\/\-]/);
      if (parts.length === 3) {
        const month = parseInt(parts[0]);
        const day = parseInt(parts[1]);
        let year = parseInt(parts[2]);

        // Handle 2-digit years
        if (year < 100) {
          year += year < 50 ? 2000 : 1900;
        }

        return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      }
      return dateStr; // Return as-is if can't parse
    }

    // Return ISO format
    return date.toISOString().split('T')[0];
  } catch {
    return dateStr;
  }
}

function extractRawDate(text: string): string | null {
  const pattern = /(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})/;
  const match = text.match(pattern);
  return match ? match[0] : null;
}

function calculateParsingConfidence(
  merchant: string | null,
  date: string | null,
  total: number | null
): 'high' | 'medium' | 'low' {
  let score = 0;
  if (merchant) score += 35;
  if (date) score += 30;
  if (total && total > 0) score += 35;

  if (score >= 70) return 'high';
  if (score >= 40) return 'medium';
  return 'low';
}
