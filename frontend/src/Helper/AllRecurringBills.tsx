import { BillCard } from './BillCard';

interface Bill {
    id: number;
    name: string;
    dueDate: string;
    category: string;
    amount: number;
}

interface AllRecurringBillsProps {
    bills: Bill[];
    onBillClick?: (bill: Bill) => void;
}

export const AllRecurringBills = ({ bills, onBillClick }: AllRecurringBillsProps) => {
    return (
        <div className="bg-gray-50 rounded-lg p-4">
            <h2 className="text-xl font-bold text-gray-800 mb-2">All Recurring Bills</h2>
            <div className="max-h-96 overflow-y-auto pr-2">
                {bills.length > 0 ? (
                    bills.map((bill) => (
                        <BillCard
                            key={bill.id}
                            name={bill.name}
                            dueDate={bill.dueDate}
                            category={bill.category}
                            amount={bill.amount}
                            onClick={() => onBillClick?.(bill)}
                        />
                    ))
                ) : (
                    <p className="text-gray-500 text-center py-6">No recurring bills found</p>
                )}
            </div>
        </div>
    );
};
