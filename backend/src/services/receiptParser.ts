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

export function parseReceiptText(ocrText: string, lines: string[]): ParsedReceipt {
  const merchant = extractMerchant(lines);
  const date = extractDate(ocrText);
  let total = extractTotal(ocrText, lines);
  const subtotal = extractSubtotal(ocrText);
  const tax = extractTax(ocrText);

  // If total not found but we have subtotal and tax, calculate it
  if (!total && subtotal !== null && tax !== null) {
    total = subtotal + tax;
  }
  // If we have subtotal but total seems wrong (total < subtotal), recalculate
  else if (total !== null && subtotal !== null && total < subtotal && tax !== null) {
    total = subtotal + tax;
  }

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

function extractMerchant(lines: string[]): string | null {
  // Merchant is usually in first 3 lines, longest line, all caps
  const topLines = lines.slice(0, 3);

  // Filter out very short lines and lines with numbers/symbols
  const candidates = topLines.filter(line => {
    const cleaned = line.trim();
    return cleaned.length > 3 &&
           !/^\d+$/.test(cleaned) && // Not just numbers
           !/^[^a-zA-Z]+$/.test(cleaned); // Contains letters
  });

  if (candidates.length === 0) return null;

  // Return longest line as merchant
  const merchant = candidates.reduce((a, b) => a.length > b.length ? a : b);

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

function extractTotal(text: string, lines: string[]): number | null {
  // Look for "TOTAL" keyword followed by amount
  const totalPattern = /(?:total|amount\s+due|balance)[\s:]*\$?\s*(\d+\.\d{2})/i;
  const match = text.match(totalPattern);

  if (match) {
    return parseFloat(match[1]);
  }

  // Fallback: largest amount in bottom 30% of receipt
  const bottomLines = lines.slice(Math.floor(lines.length * 0.7));
  const amounts = extractAllAmounts(bottomLines.join('\n'));

  if (amounts.length > 0) {
    return Math.max(...amounts);
  }

  return null;
}

function extractSubtotal(text: string): number | null {
  const pattern = /subtotal[\s:]*\$?\s*(\d+\.\d{2})/i;
  const match = text.match(pattern);
  return match ? parseFloat(match[1]) : null;
}

function extractTax(text: string): number | null {
  // Try to find tax with dollar sign first (more reliable)
  const dollarPattern = /(?:tax|sales\s+tax)[\s:$]*(\d+\.\d{2})/i;
  const match = text.match(dollarPattern);

  if (match) {
    const amount = parseFloat(match[1]);
    // Sanity check: tax should be reasonable (< $1000 and > $0.01)
    // Also, if it's a small number like 6.25, it might be a percentage, not an amount
    if (amount > 0.01 && amount < 1000 && amount > 1) {
      return amount;
    }
  }

  return null;
}

function extractAllAmounts(text: string): number[] {
  const pattern = /\$?\s*(\d{1,6}\.\d{2})/g;
  const amounts: number[] = [];
  let match;

  while ((match = pattern.exec(text)) !== null) {
    amounts.push(parseFloat(match[1]));
  }

  return amounts;
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
