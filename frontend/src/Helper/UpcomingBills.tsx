import { BillCard } from './BillCard';

interface Bill {
    id: number;
    name: string;
    dueDate: string;
    category: string;
    categoryName?: string;
    amount: number;
}

interface UpcomingBillsProps {
    bills: Bill[];
    onBillClick?: (bill: Bill) => void;
}

export const UpcomingBills = ({ bills, onBillClick }: UpcomingBillsProps) => {
    return (
        <div className="bg-gray-50 rounded-lg p-4">
            <h2 className="text-xl font-bold text-gray-800 mb-2">Upcoming (Next 7 days)</h2>
            <div className="max-h-96 overflow-y-auto pr-2">
                {bills.length > 0 ? (
                    bills.map((bill) => (
                        <BillCard
                            key={bill.id}
                            name={bill.name}
                            dueDate={bill.dueDate}
                            category={bill.category}
                            categoryName={bill.categoryName}
                            amount={bill.amount}
                            onClick={() => onBillClick?.(bill)}
                        />
                    ))
                ) : (
                    <p className="text-gray-500 text-center py-6">No upcoming bills in the next 7 days</p>
                )}
            </div>
        </div>
    );
};
