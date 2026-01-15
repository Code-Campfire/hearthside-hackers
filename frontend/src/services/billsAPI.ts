import axios, { AxiosError } from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

export interface Bill {
  id: number;
  user_id: number;
  bill_name: string;
  amount: number;
  due_day: number;
  category_id?: number;
  category_name?: string;
  category_type?: string;
  is_paid: boolean;
  created_at: string;
}

export interface FetchBillsResponse {
  success: boolean;
  data: Bill[];
}

export interface BillResponse {
  success: boolean;
  message: string;
  data: Bill;
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

export const billsAPI = {
  async fetchBills(
    token: string,
    is_paid?: boolean
  ): Promise<FetchBillsResponse> {
    try {
      const params: any = {};
      if (is_paid !== undefined) {
        params.is_paid = is_paid;
      }

      const response = await axios.get(`${API_URL}/api/bills`, {
        headers: getAuthHeaders(token),
        params,
      });
      return response.data;
    } catch (error) {
      return Promise.reject(error);
    }
  },

  async fetchBill(token: string, id: number): Promise<BillResponse> {
    try {
      const response = await axios.get(`${API_URL}/api/bills/${id}`, {
        headers: getAuthHeaders(token),
      });
      return response.data;
    } catch (error) {
      const axiosError = error as AxiosError<ApiError>;
      throw new Error(
        axiosError.response?.data?.message || 'Failed to fetch bill'
      );
    }
  },

  async addBill(
    token: string,
    bill: {
      bill_name: string;
      amount: number;
      due_day: number;
      category_id?: number;
      is_paid?: boolean;
    }
  ): Promise<BillResponse> {
    try {
      const response = await axios.post(
        `${API_URL}/api/bills`,
        bill,
        {
          headers: getAuthHeaders(token),
        }
      );
      return response.data;
    } catch (error) {
      const axiosError = error as AxiosError<ApiError>;
      throw new Error(
        axiosError.response?.data?.message || 'Failed to add bill'
      );
    }
  },

  async updateBill(
    token: string,
    id: number,
    updates: Partial<Omit<Bill, 'id' | 'user_id' | 'created_at'>>
  ): Promise<BillResponse> {
    try {
      const response = await axios.put(
        `${API_URL}/api/bills/${id}`,
        updates,
        {
          headers: getAuthHeaders(token),
        }
      );
      return response.data;
    } catch (error) {
      const axiosError = error as AxiosError<ApiError>;
      throw new Error(
        axiosError.response?.data?.message || 'Failed to update bill'
      );
    }
  },

  async deleteBill(token: string, id: number): Promise<BillResponse> {
    try {
      const response = await axios.delete(`${API_URL}/api/bills/${id}`, {
        headers: getAuthHeaders(token),
      });
      return response.data;
    } catch (error) {
      const axiosError = error as AxiosError<ApiError>;
      throw new Error(
        axiosError.response?.data?.message || 'Failed to delete bill'
      );
    }
  },
};
