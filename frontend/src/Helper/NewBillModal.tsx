import { useState, type FormEvent } from 'react';

interface NewBillModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit?: (billData: { name: string; amount: string; dueDate: string; category: string }) => Promise<void>;
}

export const NewBillModal = ({ isOpen, onClose, onSubmit }: NewBillModalProps) => {
    const [formData, setFormData] = useState({
        name: '',
        amount: '',
        dueDate: '',
        category: ''
    });
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();

        if (onSubmit) {
            try {
                setIsSubmitting(true);
                await onSubmit({
                    name: formData.name,
                    amount: formData.amount,
                    dueDate: formData.dueDate,
                    category: formData.category,
                });
            } catch (error) {
                console.error('Error submitting bill:', error);
                alert('Failed to add bill. Please try again.');
                setIsSubmitting(false);
                return;
            } finally {
                setIsSubmitting(false);
            }
        }

        onClose();
        setFormData({
            name: '',
            amount: '',
            dueDate: '',
            category: ''
        });
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
                <div className="flex justify-between items-center p-6 border-b">
                    <h2 className="text-2xl font-bold text-gray-800">Add New Bill</h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    <div>
                        <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                            Bill Name
                        </label>
                        <input type="text" id="name" name="name" value={formData.name} onChange={handleChange} required
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="e.g., Electricity Bill"/>
                    </div>

                    <div>
                        <label htmlFor="amount" className="block text-sm font-medium text-gray-700 mb-1">
                            Amount
                        </label>
                        <input type="number" id="amount" name="amount" value={formData.amount}
                            onChange={handleChange} required step="0.01" min="0"
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="0.00"/>
                    </div>

                    <div>
                        <label htmlFor="dueDate" className="block text-sm font-medium text-gray-700 mb-1">
                            Due Day of Month
                        </label>
                        <input type="number" id="dueDate" name="dueDate"
                            value={formData.dueDate} onChange={handleChange} required
                            min="1" max="31"
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="e.g., 15 for the 15th of each month"
                        />
                    </div>

                    <div>
                        <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-1">
                            Category ID
                        </label>
                        <input
                            type="number"
                            id="category"
                            name="category"
                            value={formData.category}
                            onChange={handleChange}
                            min="1"
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="e.g., 1, 2, 3"
                        />
                    </div>

                    <div className="flex gap-3 pt-4">
                        <button type="button" onClick={onClose}
                            className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition font-medium"
                        >
                            Cancel
                        </button>
                        <button type="submit"
                            disabled={isSubmitting}
                            className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium disabled:bg-gray-400 disabled:cursor-not-allowed"
                        >
                            {isSubmitting ? 'Adding...' : 'Add Bill'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};
