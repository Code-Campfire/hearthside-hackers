interface BillDetailsModalProps {
    isOpen: boolean;
    onClose: () => void;
    onEdit: () => void;
    onDelete: () => void;
    bill: {
        id: number;
        name: string;
        dueDate: string;
        category: string;
        categoryName?: string;
        amount: number;
        frequency?: string;
        notes?: string;
    } | null;
}

export const BillDetailsModal = ({ isOpen, onClose, onEdit, onDelete, bill }: BillDetailsModalProps) => {
    if (!isOpen || !bill) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
                <div className="flex justify-between items-center p-6 border-b">
                    <h2 className="text-2xl font-bold text-gray-800">Bill Details</h2>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-gray-600 transition"
                    >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                <div className="p-6 space-y-4">
                    <div>
                        <h3 className="text-sm font-medium text-gray-500 mb-1">Bill Name</h3>
                        <p className="text-lg font-semibold text-gray-800">{bill.name}</p>
                    </div>

                    <div>
                        <h3 className="text-sm font-medium text-gray-500 mb-1">Amount</h3>
                        <p className="text-lg font-semibold text-gray-800">${bill.amount.toFixed(2)}</p>
                    </div>

                    <div>
                        <h3 className="text-sm font-medium text-gray-500 mb-1">Due Date</h3>
                        <p className="text-lg font-semibold text-gray-800">{bill.dueDate}</p>
                    </div>

                    <div>
                        <h3 className="text-sm font-medium text-gray-500 mb-1">Category</h3>
                        <p className="text-lg font-semibold text-gray-800">{bill.categoryName || bill.category || 'Uncategorized'}</p>
                    </div>

                    {bill.frequency && (
                        <div>
                            <h3 className="text-sm font-medium text-gray-500 mb-1">Frequency</h3>
                            <p className="text-lg font-semibold text-gray-800 capitalize">{bill.frequency}</p>
                        </div>
                    )}

                    {bill.notes && (
                        <div>
                            <h3 className="text-sm font-medium text-gray-500 mb-1">Notes</h3>
                            <p className="text-gray-800">{bill.notes}</p>
                        </div>
                    )}
                </div>

                <div className="flex gap-3 p-6 border-t">
                    <button
                        onClick={onDelete}
                        className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition font-medium"
                    >
                        Delete
                    </button>
                    <button
                        onClick={onEdit}
                        className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium"
                    >
                        Edit
                    </button>
                </div>
            </div>
        </div>
    );
};
