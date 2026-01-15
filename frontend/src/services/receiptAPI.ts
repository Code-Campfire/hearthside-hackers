import axios, { AxiosError } from 'axios';
import type { ScanReceiptResponse, Receipt } from '../types/receipt';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

interface ApiError {
  success: false;
  message: string;
  error?: string;
}

const getAuthHeaders = (token: string) => ({
  Authorization: `Bearer ${token}`,
});

export const receiptAPI = {
  async scanReceipt(token: string, file: File): Promise<ScanReceiptResponse> {
    try {
      const formData = new FormData();
      formData.append('receipt', file);

      const response = await axios.post(
        `${API_URL}/api/receipts/scan`,
        formData,
        {
          headers: {
            ...getAuthHeaders(token),
            'Content-Type': 'multipart/form-data',
          },
        }
      );

      return response.data;
    } catch (error) {
      const axiosError = error as AxiosError<ApiError>;
      throw new Error(
        axiosError.response?.data?.message || 'Failed to scan receipt'
      );
    }
  },

  async getReceipt(token: string, receiptId: number): Promise<Receipt> {
    try {
      const response = await axios.get(
        `${API_URL}/api/receipts/${receiptId}`,
        {
          headers: getAuthHeaders(token),
        }
      );
      return response.data.data;
    } catch (error) {
      const axiosError = error as AxiosError<ApiError>;
      throw new Error(
        axiosError.response?.data?.message || 'Failed to fetch receipt'
      );
    }
  },

  async confirmReceipt(
    token: string,
    receiptId: number,
    data: {
      merchant_name: string;
      transaction_date: string;
      amount: number;
      description?: string;
      category_id?: number;
    }
  ): Promise<any> {
    try {
      const response = await axios.post(
        `${API_URL}/api/receipts/${receiptId}/confirm`,
        data,
        {
          headers: getAuthHeaders(token),
        }
      );
      return response.data;
    } catch (error) {
      const axiosError = error as AxiosError<ApiError>;
      throw new Error(
        axiosError.response?.data?.message || 'Failed to create transaction'
      );
    }
  },
};
