import { useNavigate } from 'react-router-dom';

export function TransactionPage() {
    const navigate = useNavigate();

    // Sample transaction data
    const transactions = [
        { id: 1, date: '2025-11-25', merchant: 'Coffee Shop', category: 'Food & Drink', amount: '$5.50' },
        { id: 2, date: '2025-11-24', merchant: 'Gas Station', category: 'Transportation', amount: '$45.00' },
        { id: 3, date: '2025-11-24', merchant: 'Grocery Store', category: 'Groceries', amount: '$87.32' },
        { id: 4, date: '2025-11-23', merchant: 'Netflix', category: 'Entertainment', amount: '$15.99' },
        { id: 5, date: '2025-11-23', merchant: 'Pharmacy', category: 'Health', amount: '$32.50' },
        { id: 6, date: '2025-11-22', merchant: 'Restaurant', category: 'Food & Drink', amount: '$68.75' },
        { id: 7, date: '2025-11-22', merchant: 'Gym', category: 'Fitness', amount: '$50.00' },
        { id: 8, date: '2025-11-21', merchant: 'Bookstore', category: 'Entertainment', amount: '$28.90' },
    ];

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
                        <button className="bg-black hover:bg-gray-800 text-white font-bold py-2 px-6 rounded-lg transition">
                            Add Transaction
                        </button>
                        <button className="bg-white hover:bg-gray-100 text-black font-bold py-2 px-6 rounded-lg transition border border-gray-300">
                            Scan Receipt
                        </button>
                        <button className="bg-white hover:bg-gray-100 text-black font-bold py-2 px-6 rounded-lg transition border border-gray-300">
                            All Types
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
                            <div>Category</div>
                            <div>Amount</div>
                            <div>Actions</div>
                        </div>
                    </div>
                    
                    <div className="overflow-y-auto max-h-96">
                        {transactions.map((transaction) => (
                            <div key={transaction.id} className="hidden sm:grid grid-cols-5 gap-4 px-6 py-4 border-b border-gray-200 hover:bg-gray-50">
                                <div className="text-gray-800">{transaction.date}</div>
                                <div className="text-gray-800">{transaction.merchant}</div>
                                <div className="text-gray-800">{transaction.category}</div>
                                <div className="text-gray-800 font-semibold">{transaction.amount}</div>
                                <div className="flex gap-2">
                                    <button className="text-blue-600 hover:text-blue-800 font-semibold">...</button>
                                </div>
                            </div>
                        ))}
                        
                        {transactions.map((transaction) => (
                            <div key={transaction.id} className="sm:hidden border-b border-gray-200 hover:bg-gray-50 p-4">
                                <div className="grid grid-cols-2 gap-2 text-sm">
                                    <div className="font-bold text-gray-700">Date:</div>
                                    <div className="text-gray-800">{transaction.date}</div>
                                    <div className="font-bold text-gray-700">Merchant:</div>
                                    <div className="text-gray-800">{transaction.merchant}</div>
                                    <div className="font-bold text-gray-700">Category:</div>
                                    <div className="text-gray-800">{transaction.category}</div>
                                    <div className="font-bold text-gray-700">Amount:</div>
                                    <div className="text-gray-800 font-semibold">{transaction.amount}</div>
                                    <div className="col-span-2 flex gap-2 mt-2">
                                    <button className="text-blue-600 hover:text-blue-800 font-semibold">...</button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    )
}