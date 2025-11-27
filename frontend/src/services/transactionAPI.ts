import axios, { AxiosError } from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

export interface Transaction {
  id: number;
  user_id: number;
  amount: number;
  transaction_date: string;
  description?: string;
  merchant_name: string;
  transaction_type: 'income' | 'expense';
  category_id?: number;
  created_at: string;
}

export interface FetchTransactionsResponse {
  success: boolean;
  data: Transaction[];
  pagination: {
    total: number;
    limit: number;
    offset: number;
  };
}

export interface TransactionResponse {
  success: boolean;
  message: string;
  data: Transaction;
}

interface ApiError {
  success: false;
  message: string;
  error?: string;
}

const getAuthHeaders = (token: string) => ({
  Authorization: `Bearer ${token}`,
  'Content-Type': 'application/json',
});

export const transactionAPI = {
  async fetchTransactions(
    token: string,
    limit: number = 50,
    offset: number = 0,
    transaction_type?: 'all' | 'income' | 'expense'
  ): Promise<FetchTransactionsResponse> {
     try {
      const params: any = { limit, offset };
      if (transaction_type) {
        params.transaction_type = transaction_type;
      }

      const response = await axios.get(`${API_URL}/api/transactions`, {
        headers: getAuthHeaders(token),
        params,
      });
      return response.data;
    } catch (error) {
      const axiosError = error as AxiosError<ApiError>;
      throw new Error(
        axiosError.response?.data?.message || 'Failed to fetch transactions'
      );
    }
  },

  async fetchTransaction(token: string, id: number): Promise<TransactionResponse> {
    try {
      const response = await axios.get(`${API_URL}/api/transactions/${id}`, {
        headers: getAuthHeaders(token),
      });
      return response.data;
    } catch (error) {
      const axiosError = error as AxiosError<ApiError>;
      throw new Error(
        axiosError.response?.data?.message || 'Failed to fetch transaction'
      );
    }
  },

  async addTransaction(
    token: string,
    transaction: {
      amount: number;
      transaction_date: string;
      transaction_type: 'income' | 'expense';
      merchant_name: string;
      description?: string;
      category_id?: number;
    }
  ): Promise<TransactionResponse> {
    try {
      const response = await axios.post(
        `${API_URL}/api/transactions`,
        transaction,
        {
          headers: getAuthHeaders(token),
        }
      );
      return response.data;
    } catch (error) {
      const axiosError = error as AxiosError<ApiError>;
      throw new Error(
        axiosError.response?.data?.message || 'Failed to add transaction'
      );
    }
  },

  async updateTransaction(
    token: string,
    id: number,
    updates: Partial<Omit<Transaction, 'id' | 'user_id' | 'created_at'>>
  ): Promise<TransactionResponse> {
    try {
      const response = await axios.put(
        `${API_URL}/api/transactions/${id}`,
        updates,
        {
          headers: getAuthHeaders(token),
        }
      );
      return response.data;
    } catch (error) {
      const axiosError = error as AxiosError<ApiError>;
      throw new Error(
        axiosError.response?.data?.message || 'Failed to update transaction'
      );
    }
  },

  async deleteTransaction(token: string, id: number): Promise<TransactionResponse> {
    try {
      const response = await axios.delete(`${API_URL}/api/transactions/${id}`, {
        headers: getAuthHeaders(token),
      });
      return response.data;
    } catch (error) {
      const axiosError = error as AxiosError<ApiError>;
      throw new Error(
        axiosError.response?.data?.message || 'Failed to delete transaction'
      );
    }
  },
};