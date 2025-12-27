import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useEffect, useState } from 'react';
import { dashboardAPI } from '../services/dashboardAPI';
import type {DashboardStats, DashboardTransaction, DashboardBill} from '../services/dashboardAPI';

export const HomePage = () => {
  const { user, logout, token } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState<DashboardStats>({ monthlyIncome: 0, monthlyExpenses: 0, activeGoals: 0 });
  const [recentTransactions, setRecentTransactions] = useState<DashboardTransaction[]>([]);
  const [upcomingBills, setUpcomingBills] = useState<DashboardBill[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!token) return;

    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        setError(null);
        const [statsData, transactionsData, billsData] = await Promise.all([
          dashboardAPI.fetchStats(token),
          dashboardAPI.fetchRecentTransactions(token, 5),
          dashboardAPI.fetchUpcomingBills(token),
        ]);

        setStats(statsData);
        setRecentTransactions(transactionsData);
        setUpcomingBills(billsData);
      } catch (err) {
        console.error('Failed to fetch dashboard data:', err);
        setError('Failed to load dashboard data. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [token]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <nav className="bg-white shadow-md">
        <div className="max-w-6xl mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-800">
            Personal Budget Analyzer
          </h1>
          <div className="flex items-center gap-4">
            <span className="text-gray-700">Welcome, {user?.name || user?.email}!</span>
            <button
              onClick={handleLogout}
              className="bg-gray-800 hover:bg-black text-white font-medium py-2 px-4 rounded-lg transition"
            >
              Logout
            </button>
          </div>
        </div>
      </nav>

      <div className="max-w-6xl mx-auto px-4 py-8">
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-sm font-medium text-gray-500 mb-2">This Month's Income</h3>
            <p className="text-3xl font-bold text-green-600">
              ${loading ? '...' : stats.monthlyIncome.toFixed(2)}
            </p>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-sm font-medium text-gray-500 mb-2">This Month's Expenses</h3>
            <p className="text-3xl font-bold text-red-600">
              ${loading ? '...' : stats.monthlyExpenses.toFixed(2)}
            </p>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-sm font-medium text-gray-500 mb-2">Active Goals</h3>
            <p className="text-3xl font-bold text-blue-600">
              {loading ? '...' : stats.activeGoals}
            </p>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <h2 className="text-xl font-bold text-gray-800 mb-4">Quick Actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <button
              onClick={() => navigate('/transactions')}
              className="bg-gray-800 hover:bg-black text-white font-medium py-3 px-6 rounded-lg transition"
            >
              Add Transaction
            </button>
            <button
              onClick={() => navigate('/receipts/scan')}
              className="bg-gray-800 hover:bg-black text-white font-medium py-3 px-6 rounded-lg transition"
            >
              Scan Receipt
            </button>
            <button
              onClick={() => navigate('/bills')}
              className="bg-gray-800 hover:bg-black text-white font-medium py-3 px-6 rounded-lg transition"
            >
              Add Bill
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-gray-800">Recent Transactions</h2>
              <button
                onClick={() => navigate('/transactions')}
                className="text-gray-700 hover:text-black text-sm font-medium underline"
              >
                View All
              </button>
            </div>
            {loading ? (
              <p className="text-gray-500">Loading...</p>
            ) : recentTransactions.length === 0 ? (
              <p className="text-gray-500">No transactions yet</p>
            ) : (
              <div className="space-y-3">
                {recentTransactions.map((transaction) => (
                  <div key={transaction.id} className="flex justify-between items-center border-b pb-2">
                    <div>
                      <p className="font-medium text-gray-800">{transaction.merchant_name}</p>
                      <p className="text-sm text-gray-500">
                        {new Date(transaction.transaction_date).toLocaleDateString()}
                        {transaction.category_name && ` • ${transaction.category_name}`}
                      </p>
                    </div>
                    <p className={`font-bold ${transaction.transaction_type === 'income' ? 'text-green-600' : 'text-red-600'}`}>
                      {transaction.transaction_type === 'income' ? '+' : '-'}${transaction.amount}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-gray-800">Upcoming Bills</h2>
              <button
                onClick={() => navigate('/bills')}
                className="text-gray-700 hover:text-black text-sm font-medium underline"
              >
                View All
              </button>
            </div>
            {loading ? (
              <p className="text-gray-500">Loading...</p>
            ) : upcomingBills.length === 0 ? (
              <p className="text-gray-500">No upcoming bills</p>
            ) : (
              <div className="space-y-3">
                {upcomingBills.map((bill) => (
                  <div key={bill.id} className="flex justify-between items-center border-b pb-2">
                    <div>
                      <p className="font-medium text-gray-800">{bill.bill_name}</p>
                      <p className="text-sm text-gray-500">
                        Due on day {bill.due_day}
                        {bill.category_name && ` • ${bill.category_name}`}
                      </p>
                    </div>
                    <p className="font-bold text-gray-800">${bill.amount}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
