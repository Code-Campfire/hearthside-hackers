interface BillCardProps {
    name: string;
    dueDate: string;
    category: string;
    categoryName?: string;
    amount: number;
    onClick?: () => void;
}

export const BillCard = ({ name, dueDate, category, categoryName, amount, onClick }: BillCardProps) => {
    return (
        <div
            className="bg-white rounded-lg shadow-md p-4 mb-3 flex justify-between items-center hover:shadow-lg transition-shadow cursor-pointer"
            onClick={onClick}
        >
            <div>
                <h3 className="text-lg font-semibold text-gray-800 hover:text-blue-600 transition-colors">{name}</h3>
                <p className="text-sm text-gray-500">{dueDate}</p>
            </div>
            <div className="text-right">
                <p className="text-sm text-gray-600">{categoryName || category || 'Uncategorized'}</p>
                <p className="text-lg font-bold text-gray-800">${amount.toFixed(2)}</p>
            </div>
        </div>
    );
};
