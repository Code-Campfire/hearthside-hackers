export interface Receipt {
  id: number;
  user_id: number;
  transaction_id?: number;
  image_url: string;
  merchant_name?: string;
  total_amount?: number;
  receipt_date?: string;
  extracted_data?: any;
  processing_status: 'pending' | 'processed' | 'failed' | 'confirmed';
  created_at: string;
}

export interface ScanReceiptResponse {
  success: boolean;
  message: string;
  data: {
    receiptId: number;
    merchant: string | null;
    date: string | null;
    total: number | null;
    extractedData: any;
    confidence: 'high' | 'medium' | 'low';
    rawText: string;
  };
}

export interface ReceiptFormData {
  merchant_name: string;
  transaction_date: string;
  amount: string;
  description: string;
  category_id: string;
}
