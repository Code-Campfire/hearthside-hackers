import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { NewBillModal } from '../Helper/NewBillModal';
import { BillDetailsModal } from '../Helper/BillDetailsModal';
import { EditBillModal } from '../Helper/EditBillModal';
import { UpcomingBills } from '../Helper/UpcomingBills';
import { AllRecurringBills } from '../Helper/AllRecurringBills';

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
    const [isNewBillModalOpen, setIsNewBillModalOpen] = useState(false);
    const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [selectedBill, setSelectedBill] = useState<Bill | null>(null);

    const upcomingBills: Bill[] = [];

    const recurringBills: Bill[] = [];

    const handleBillClick = (bill: Bill) => {
        setSelectedBill(bill);
        setIsDetailsModalOpen(true);
    };

    const handleEdit = () => {
        setIsDetailsModalOpen(false);
        setIsEditModalOpen(true);
    };

    const handleDelete = () => {
        setIsDetailsModalOpen(false);
        setSelectedBill(null);
    };

    const handleCloseDetails = () => {
        setIsDetailsModalOpen(false);
        setSelectedBill(null);
    };

    const handleCloseEdit = () => {
        setIsEditModalOpen(false);
        setSelectedBill(null);
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
                <UpcomingBills bills={upcomingBills} onBillClick={handleBillClick} />
                <AllRecurringBills bills={recurringBills} onBillClick={handleBillClick} />
            </div>

            <NewBillModal isOpen={isNewBillModalOpen} onClose={() => setIsNewBillModalOpen(false)} />
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
            />
        </div>
    );
}