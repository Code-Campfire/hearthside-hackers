import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { receiptAPI } from '../services/receiptAPI';
import { ReceiptUploader } from '../components/ReceiptUploader';
import { ReceiptReview } from '../components/ReceiptReview';
import type { ReceiptFormData } from '../types/receipt';

type Step = 'upload' | 'review' | 'success';

export function ReceiptScannerPage() {
  const { token } = useAuth();
  const navigate = useNavigate();

  const [step, setStep] = useState<Step>('upload');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [receiptId, setReceiptId] = useState<number | null>(null);
  const [extractedData, setExtractedData] = useState<any>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [transactionId, setTransactionId] = useState<number | null>(null);

  const handleFileSelected = async (file: File) => {
    setSelectedFile(file);
    setError(null);
    setIsProcessing(true);

    try {
      if (!token) {
        throw new Error('Not authenticated');
      }

      const response = await receiptAPI.scanReceipt(token, file);

      setReceiptId(response.data.receiptId);
      setExtractedData(response.data);
      setStep('review');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to scan receipt');
      setSelectedFile(null);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleConfirm = async (formData: ReceiptFormData) => {
    if (!token || !receiptId) return;

    setError(null);
    setIsSubmitting(true);

    try {
      const response = await receiptAPI.confirmReceipt(token, receiptId, {
        merchant_name: formData.merchant_name,
        transaction_date: formData.transaction_date,
        amount: parseFloat(formData.amount),
        description: formData.description || undefined,
        category_id: formData.category_id ? parseInt(formData.category_id) : undefined,
      });

      setTransactionId(response.data.id);
      setStep('success');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create transaction');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    setStep('upload');
    setSelectedFile(null);
    setReceiptId(null);
    setExtractedData(null);
    setError(null);
  };

  const handleScanAnother = () => {
    setStep('upload');
    setSelectedFile(null);
    setReceiptId(null);
    setExtractedData(null);
    setError(null);
    setTransactionId(null);
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="max-w-4xl mx-auto py-8 px-4">
        <div className="bg-white rounded-lg shadow-lg p-6">
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-gray-800">Receipt Scanner</h1>
            <p className="text-gray-600 mt-2">
              Upload a receipt to automatically extract transaction details
            </p>
          </div>

          {error && (
            <div className="mb-6 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
              {error}
            </div>
          )}

          {step === 'upload' && (
            <ReceiptUploader
              onFileSelected={handleFileSelected}
              isProcessing={isProcessing}
            />
          )}

          {step === 'review' && extractedData && (
            <ReceiptReview
              initialData={{
                merchant: extractedData.merchant,
                date: extractedData.date,
                total: extractedData.total,
                confidence: extractedData.confidence,
              }}
              onConfirm={handleConfirm}
              onCancel={handleCancel}
              isSubmitting={isSubmitting}
            />
          )}

          {step === 'success' && (
            <div className="text-center space-y-6">
              <div className="text-6xl">✅</div>
              <h2 className="text-2xl font-bold text-gray-800">Transaction Created!</h2>
              <p className="text-gray-600">
                Your receipt has been processed and the transaction has been added to your account.
              </p>
              <div className="flex gap-3 justify-center">
                <button
                  onClick={handleScanAnother}
                  className="px-6 py-2 border border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-50 transition"
                >
                  Scan Another Receipt
                </button>
                <button
                  onClick={() => navigate('/transactions')}
                  className="px-6 py-2 bg-black text-white font-semibold rounded-lg hover:bg-gray-800 transition"
                >
                  View Transactions
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
