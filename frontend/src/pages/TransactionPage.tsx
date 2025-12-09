import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { transactionAPI, type Transaction } from '../services/transactionAPI';
import { useEffect, useState } from 'react';
import { AddTransactionModal } from '../Helper/AddTransactionModel.tsx';
import { EditTransactionModal } from '../Helper/EditTransactionModal.tsx';

export function TransactionPage() {
    const navigate = useNavigate();
    const { token } = useAuth();
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
    const [transactionTypeFilter, setTransactionTypeFilter] = useState<'all' | 'income' | 'expense'>('all');

    useEffect(() => {
        const fetchTransactions = async () => {
            if (!token) {
                navigate('/login');
                return;
            }

            try {
                setIsLoading(true);
                setError(null);
                const response = await transactionAPI.fetchTransactions(token, 50, 0, transactionTypeFilter);
                setTransactions(response.data);
            } catch (err) {
                setError(err instanceof Error ? err.message : 'Failed to load transactions');
            } finally {
                setIsLoading(false);
            }
        };
        fetchTransactions();
    }, [token, navigate, transactionTypeFilter]);

    const handleDeleteTransaction = async (id: number) => {
        if (!token) return;

        try {
            await transactionAPI.deleteTransaction(token, id);
            setTransactions(transactions.filter(t => t.id !== id));
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to delete transaction');
        }
    };

    const handleTransactionAdded = (newTransaction: Transaction) => {
        setTransactions([newTransaction, ...transactions]);
        setIsModalOpen(false);
    };

    const handleEditTransaction = (transaction: Transaction) => {
        setSelectedTransaction(transaction);
        setIsEditModalOpen(true);
    };

    const handleTransactionUpdated = (updatedTransaction: Transaction) => {
        setTransactions(transactions.map(t =>
            t.id === updatedTransaction.id ? updatedTransaction : t
        ));
        setIsEditModalOpen(false);
        setSelectedTransaction(null);
    };

    const cycleTransactionTypeFilter = () => {
        setTransactionTypeFilter(current => {
            if (current === 'all') return 'income';
            if (current === 'income') return 'expense';
            return 'all';
        });
    };

    const getFilterButtonText = () => {
        if (transactionTypeFilter === 'all') return 'All Types';
        if (transactionTypeFilter === 'income') return 'Income Only';
        return 'Expense Only';
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    };

    const formatAmount = (amount: number) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD'
        }).format(amount);
    };

    return (
        <div className="min-h-screen bg-gray-100">
            <div className="max-w-full mx-auto px-[50px] py-4 flex flex-col sm:flex-row justify-start items-start sm:items-center gap-4">
                <button onClick={() => navigate('/')} className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg transition flex items-center gap-2">
                    Dashboard
                </button>
                <h1 className="text-2xl font-bold text-gray-800">Transactions</h1>
            </div>

            <div className="max-w-full mx-auto px-[50px] py-8">
                <div className="bg-white rounded-lg shadow-md p-6 mb-6">
                    <div className="flex gap-4 flex-wrap">
                        <button onClick={() => setIsModalOpen(true)} className="bg-black hover:bg-gray-800 text-white font-bold py-2 px-6 rounded-lg transition">
                            Add Transaction
                        </button>
                        <button className="bg-white hover:bg-gray-100 text-black font-bold py-2 px-6 rounded-lg transition border border-gray-300">
                            Scan Receipt
                        </button>
                        <button
                            onClick={cycleTransactionTypeFilter}
                            className={`font-bold py-2 px-6 rounded-lg transition border ${
                                transactionTypeFilter === 'all'
                                    ? 'bg-white hover:bg-gray-100 text-black border-gray-300'
                                    : transactionTypeFilter === 'income'
                                    ? 'bg-green-600 hover:bg-green-700 text-white border-green-600'
                                    : 'bg-red-600 hover:bg-red-700 text-white border-red-600'
                            }`}
                        >
                            {getFilterButtonText()}
                        </button>
                        <button className="bg-white hover:bg-gray-100 text-black font-bold py-2 px-6 rounded-lg transition border border-gray-300">
                            All Categories
                        </button>
                    </div>
                </div>

                <div className="bg-white rounded-lg shadow-md overflow-hidden">
                    <div className="bg-gray-200 hidden sm:block">
                        <div className="grid grid-cols-5 gap-4 px-6 py-4 text-black font-bold">
                            <div>Date</div>
                            <div>Merchant</div>
                            <div>Type</div>
                            <div>Amount</div>
                            <div>Actions</div>
                        </div>
                    </div>
                    
                    <div className="overflow-y-auto max-h-96">
                        {isLoading ? (<div className="text-center py-8 text-gray-600">Loading transactions...</div>)
                            : error ? (<div className="text-center py-8 text-red-600">{error}</div>) 
                            : transactions.length === 0 ? (<div className="text-center py-8 text-gray-600">No transactions yet</div>)
                          : (
                            <>
                                {transactions.map((transaction) => (
                                    <div key={transaction.id} className="hidden sm:grid grid-cols-5 gap-4 px-6 py-4 border-b border-gray-200 hover:bg-gray-50">
                                        <div className="text-gray-800">{formatDate(transaction.transaction_date)}</div>
                                        <div className="text-gray-800">{transaction.merchant_name}</div>
                                        <div className="text-gray-800">
                                            <span className={`px-2 py-1 rounded text-sm font-semibold ${transaction.transaction_type === 'income' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                                                {transaction.transaction_type}
                                            </span>
                                        </div>
                                        <div className="text-gray-800 font-semibold">{formatAmount(transaction.amount)}</div>
                                        <div className="flex gap-2">
                                            <button onClick={() => handleEditTransaction(transaction)} className="text-blue-600 hover:text-blue-800 font-semibold">
                                                Edit
                                            </button>
                                            <button onClick={() => handleDeleteTransaction(transaction.id)} className="text-red-600 hover:text-red-800 font-semibold">
                                                Delete
                                            </button>
                                        </div>
                                    </div>
                                ))}
                                
                                {transactions.map((transaction) => (
                                    <div key={transaction.id} className="sm:hidden border-b border-gray-200 hover:bg-gray-50 p-4">
                                        <div className="grid grid-cols-2 gap-2 text-sm">
                                            <div className="font-bold text-gray-700">Date:</div>
                                            <div className="text-gray-800">{formatDate(transaction.transaction_date)}</div>
                                            <div className="font-bold text-gray-700">Merchant:</div>
                                            <div className="text-gray-800">{transaction.merchant_name}</div>
                                            <div className="font-bold text-gray-700">Type:</div>
                                            <div className="text-gray-800">
                                                <span className={`px-2 py-1 rounded text-xs font-semibold ${transaction.transaction_type === 'income' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                                                    {transaction.transaction_type}
                                                </span>
                                            </div>
                                            <div className="font-bold text-gray-700">Amount:</div>
                                            <div className="text-gray-800 font-semibold">{formatAmount(transaction.amount)}</div>
                                            <div className="col-span-2 flex gap-2 mt-2">
                                                <button onClick={() => handleEditTransaction(transaction)} className="text-blue-600 hover:text-blue-800 font-semibold flex items-center gap-1">
                                                    Edit
                                                </button>
                                                <button onClick={() => handleDeleteTransaction(transaction.id)} className="text-red-600 hover:text-red-800 font-semibold flex items-center gap-1">
                                                    Delete
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </>
                        )}
                    </div>
                </div>
            </div>

            {token && (
                <>
                    <AddTransactionModal
                        isOpen={isModalOpen}
                        onClose={() => setIsModalOpen(false)}
                        onTransactionAdded={handleTransactionAdded}
                        token={token}
                    />
                    <EditTransactionModal
                        isOpen={isEditModalOpen}
                        onClose={() => {
                            setIsEditModalOpen(false);
                            setSelectedTransaction(null);
                        }}
                        onTransactionUpdated={handleTransactionUpdated}
                        token={token}
                        transaction={selectedTransaction}
                    />
                </>
            )}
        </div>
    )
}