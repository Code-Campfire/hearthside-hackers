import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { NewBillModal } from '../Helper/NewBillModal';
import { BillDetailsModal } from '../Helper/BillDetailsModal';
import { EditBillModal } from '../Helper/EditBillModal';
import { UpcomingBills } from '../Helper/UpcomingBills';
import { AllRecurringBills } from '../Helper/AllRecurringBills';
import { billsAPI, type Bill as ApiBill } from '../services/billsAPI';
import { useAuth } from '../contexts/AuthContext';

interface Bill {
    id: number;
    name: string;
    dueDate: string;
    category: string;
    amount: number;
    frequency?: string;
    notes?: string;
}

export const BillsAndReminders = () => {
    const navigate = useNavigate();
    const { token } = useAuth();
    const [isNewBillModalOpen, setIsNewBillModalOpen] = useState(false);
    const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [selectedBill, setSelectedBill] = useState<Bill | null>(null);
    const [bills, setBills] = useState<Bill[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (token) {
            fetchBills();
        }
    }, [token]);

    const fetchBills = async () => {
        if (!token) return;

        try {
            setLoading(true);
            setError(null);
            const response = await billsAPI.fetchBills(token);

            const transformedBills = response.data.map((bill: ApiBill) => ({
                id: bill.id,
                name: bill.bill_name,
                dueDate: `${bill.due_day}`,
                category: bill.category_id?.toString() || '',
                amount: Number(bill.amount),
                frequency: 'monthly',
                notes: ''
            }));

            setBills(transformedBills);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to fetch bills');
            console.error('Error fetching bills:', err);
        } finally {
            setLoading(false);
        }
    };

    const getCurrentMonthDueDate = (dueDay: number): Date => {
        const now = new Date();
        const year = now.getFullYear();
        const month = now.getMonth();
        const dueDate = new Date(year, month, dueDay);

        if (dueDate < now) {
            dueDate.setMonth(month + 1);
        }

        return dueDate;
    };

    const isUpcoming = (dueDay: number): boolean => {
        const now = new Date();
        const dueDate = getCurrentMonthDueDate(dueDay);
        const diffTime = dueDate.getTime() - now.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return diffDays >= 0 && diffDays <= 7;
    };

    const upcomingBills = bills.filter(bill => isUpcoming(parseInt(bill.dueDate)));
    const recurringBills = bills;

    const handleBillClick = (bill: Bill) => {
        setSelectedBill(bill);
        setIsDetailsModalOpen(true);
    };

    const handleEdit = () => {
        setIsDetailsModalOpen(false);
        setIsEditModalOpen(true);
    };

    const handleDelete = async () => {
        if (!token || !selectedBill) return;

        try {
            await billsAPI.deleteBill(token, selectedBill.id);
            setIsDetailsModalOpen(false);
            setSelectedBill(null);
            await fetchBills();
        } catch (err) {
            console.error('Error deleting bill:', err);
            alert('Failed to delete bill');
        }
    };

    const handleCloseDetails = () => {
        setIsDetailsModalOpen(false);
        setSelectedBill(null);
    };

    const handleCloseEdit = () => {
        setIsEditModalOpen(false);
        setSelectedBill(null);
    };

    const handleAddBill = async (billData: { name: string; amount: string; dueDate: string; category: string }) => {
        if (!token) return;

        try {
            await billsAPI.addBill(token, {
                bill_name: billData.name,
                amount: parseFloat(billData.amount),
                due_day: parseInt(billData.dueDate),
                category_id: billData.category ? parseInt(billData.category) : undefined,
            });
            await fetchBills();
        } catch (err) {
            console.error('Error adding bill:', err);
            throw err;
        }
    };

    const handleUpdateBill = async (billData: { name: string; amount: string; dueDate: string; category: string }) => {
        if (!token || !selectedBill) return;

        try {
            await billsAPI.updateBill(token, selectedBill.id, {
                bill_name: billData.name,
                amount: parseFloat(billData.amount),
                due_day: parseInt(billData.dueDate),
                category_id: billData.category ? parseInt(billData.category) : undefined,
            });
            await fetchBills();
        } catch (err) {
            console.error('Error updating bill:', err);
            throw err;
        }
    };

    return (
        <div className="min-h-screen bg-gray-100">
            <div className="bg-white shadow-md">
                <div className="max-w-6xl mx-auto px-4 py-2 flex justify-between items-center">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => navigate('/')}
                            className="text-gray-600 hover:text-gray-800 transition"
                        >
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                            </svg>
                        </button>
                        <h1 className="text-2xl font-bold text-gray-800">Bills and Reminders</h1>
                    </div>
                    <button
                        onClick={() => setIsNewBillModalOpen(true)}
                        className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg transition"
                    >
                        Add New Bill
                    </button>
                </div>
            </div>

            <div className="max-w-6xl mx-auto px-4 py-4 space-y-4">
                {loading && (
                    <div className="text-center py-8 text-gray-600">Loading bills...</div>
                )}
                {error && (
                    <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg">
                        Error: {error}
                    </div>
                )}
                {!loading && !error && (
                    <>
                        <UpcomingBills bills={upcomingBills} onBillClick={handleBillClick} />
                        <AllRecurringBills bills={recurringBills} onBillClick={handleBillClick} />
                    </>
                )}
            </div>

            <NewBillModal
                isOpen={isNewBillModalOpen}
                onClose={() => setIsNewBillModalOpen(false)}
                onSubmit={handleAddBill}
            />
            <BillDetailsModal
                isOpen={isDetailsModalOpen}
                onClose={handleCloseDetails}
                onEdit={handleEdit}
                onDelete={handleDelete}
                bill={selectedBill}
            />
            <EditBillModal
                isOpen={isEditModalOpen}
                onClose={handleCloseEdit}
                bill={selectedBill}
                onSubmit={handleUpdateBill}
            />
        </div>
    );
}