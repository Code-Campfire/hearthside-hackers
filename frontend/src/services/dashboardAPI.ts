import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

export interface DashboardStats {
  monthlyIncome: number;
  monthlyExpenses: number;
  activeGoals: number;
}

export interface DashboardTransaction {
  id: number;
  amount: number;
  transaction_date: string;
  merchant_name: string;
  transaction_type: string;
  category_name?: string;
}

export interface DashboardBill {
  id: number;
  bill_name: string;
  amount: number;
  due_day: number;
  category_name?: string;
}

interface TransactionsResponse {
  success: boolean;
  data: DashboardTransaction[];
}

interface BillsResponse {
  success: boolean;
  data: DashboardBill[];
}

const getAuthHeaders = (token: string) => ({
  Authorization: `Bearer ${token}`,
  'Content-Type': 'application/json',
});

export const dashboardAPI = {
  async fetchMonthlyIncome(token: string): Promise<number> {
    const response = await axios.get<{ success: boolean; data: { monthlyIncome: number } }>(
      `${API_URL}/api/dashboard/income`,
      { headers: getAuthHeaders(token) }
    );
    return response.data.data.monthlyIncome;
  },

  async fetchMonthlyExpenses(token: string): Promise<number> {
    const response = await axios.get<{ success: boolean; data: { monthlyExpenses: number } }>(
      `${API_URL}/api/dashboard/expenses`,
      { headers: getAuthHeaders(token) }
    );
    return response.data.data.monthlyExpenses;
  },

  async fetchActiveGoals(token: string): Promise<number> {
    const response = await axios.get<{ success: boolean; data: { activeGoals: number } }>(
      `${API_URL}/api/dashboard/goals`,
      { headers: getAuthHeaders(token) }
    );
    return response.data.data.activeGoals;
  },

  async fetchStats(token: string): Promise<DashboardStats> {
    const [monthlyIncome, monthlyExpenses, activeGoals] = await Promise.all([
      dashboardAPI.fetchMonthlyIncome(token),
      dashboardAPI.fetchMonthlyExpenses(token),
      dashboardAPI.fetchActiveGoals(token),
    ]);

    return {
      monthlyIncome,
      monthlyExpenses,
      activeGoals,
    };
  },

  async fetchRecentTransactions(token: string, limit: number = 5): Promise<DashboardTransaction[]> {
    const response = await axios.get<TransactionsResponse>(`${API_URL}/api/transactions`, {
      headers: getAuthHeaders(token),
      params: { limit },
    });
    return response.data.data;
  },

  async fetchUpcomingBills(token: string): Promise<DashboardBill[]> {
    const response = await axios.get<BillsResponse>(`${API_URL}/api/bills`, {
      headers: getAuthHeaders(token),
      params: { is_paid: false },
    });
    return response.data.data;
  },
};
