import { useState } from 'react';
import type { ReceiptFormData } from '../types/receipt';

interface ReceiptReviewProps {
  initialData: {
    merchant: string | null;
    date: string | null;
    total: number | null;
    confidence: 'high' | 'medium' | 'low';
  };
  onConfirm: (data: ReceiptFormData) => void;
  onCancel: () => void;
  isSubmitting: boolean;
}

export function ReceiptReview({
  initialData,
  onConfirm,
  onCancel,
  isSubmitting,
}: ReceiptReviewProps) {
  const [formData, setFormData] = useState<ReceiptFormData>({
    merchant_name: initialData.merchant || '',
    transaction_date: initialData.date || new Date().toISOString().split('T')[0],
    amount: initialData.total !== null && initialData.total !== undefined
      ? (typeof initialData.total === 'number' ? initialData.total.toFixed(2) : String(initialData.total))
      : '',
    description: '',
    category_id: '',
  });

  const [error, setError] = useState<string | null>(null);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!formData.merchant_name || !formData.amount) {
      setError('Please fill in merchant name and amount');
      return;
    }

    onConfirm(formData);
  };

  const getConfidenceBadge = () => {
    const badges = {
      high: 'bg-green-100 text-green-800',
      medium: 'bg-yellow-100 text-yellow-800',
      low: 'bg-red-100 text-red-800',
    };

    return (
      <span
        className={`inline-block px-2 py-1 text-xs font-semibold rounded ${
          badges[initialData.confidence]
        }`}
      >
        {initialData.confidence.toUpperCase()} CONFIDENCE
      </span>
    );
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-800">Review Extracted Data</h3>
        {getConfidenceBadge()}
      </div>

      {initialData.confidence === 'low' && (
        <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 px-4 py-3 rounded">
          Low confidence detected. Please review all fields carefully.
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
            {error}
          </div>
        )}

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Merchant Name <span className="text-red-600">*</span>
          </label>
          <input
            type="text"
            name="merchant_name"
            value={formData.merchant_name}
            onChange={handleChange}
            placeholder="e.g., Whole Foods, Starbucks"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={isSubmitting}
            required
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Amount <span className="text-red-600">*</span>
          </label>
          <div className="relative">
            <span className="absolute left-4 top-2 text-gray-500 font-semibold">$</span>
            <input
              type="number"
              name="amount"
              value={formData.amount}
              onChange={handleChange}
              placeholder="0.00"
              min="0"
              step="0.01"
              className="w-full pl-8 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={isSubmitting}
              required
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Date
          </label>
          <input
            type="date"
            name="transaction_date"
            value={formData.transaction_date}
            onChange={handleChange}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={isSubmitting}
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Description (Optional)
          </label>
          <textarea
            name="description"
            value={formData.description}
            onChange={handleChange}
            placeholder="Add notes about this transaction..."
            rows={3}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            disabled={isSubmitting}
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Category ID (Optional)
          </label>
          <input
            type="number"
            name="category_id"
            value={formData.category_id}
            onChange={handleChange}
            placeholder="Leave empty if not applicable"
            min="0"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={isSubmitting}
          />
        </div>

        <div className="flex gap-3 pt-4">
          <button
            type="button"
            onClick={onCancel}
            disabled={isSubmitting}
            className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-50 transition disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="flex-1 px-4 py-2 bg-black text-white font-semibold rounded-lg hover:bg-gray-800 transition disabled:opacity-50"
          >
            {isSubmitting ? 'Creating...' : 'Create Transaction'}
          </button>
        </div>
      </form>
    </div>
  );
}
