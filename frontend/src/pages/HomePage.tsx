import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export const HomePage = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

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
              className="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded-lg transition"
            >
              Logout
            </button>
          </div>
        </div>
      </nav>

      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white rounded-lg shadow-md p-6">
            <button className="text-xl font-bold text-gray-800 mb-4 cursor-pointer" onClick={() => {
              navigate('/transactions');
            }}>Transactions</button>
            <p className="text-gray-600">Manage your income and expenses</p>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <button className="text-xl font-bold text-gray-800 mb-4 cursor-pointer" onClick={() => {
              navigate('/bills');
            }}>Bills</button>
            <p className="text-gray-600">Check your previous and upcoming bills</p>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-bold text-gray-800 mb-4">Budgets & Goals</h2>
            <p className="text-gray-600">Track your budgets and savings goals</p>
          </div>
        </div>

        <div className="mt-8 bg-white rounded-lg shadow-md p-6">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Dashboard</h2>
          <p className="text-gray-600">
            You're logged in! More features coming soon...
          </p>
        </div>
      </div>
    </div>
  );
};
