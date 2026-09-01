import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { expenseService } from '../services/api';
import { formatCurrency, formatDate } from '../utils/formatters';
import { Plus, Trash2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const Expenses = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [expenses, setExpenses] = useState([]);
    const [loading, setLoading] = useState(true);

    const fetchExpenses = async () => {
        try {
            const response = await expenseService.getAll();
            setExpenses(response.data.data);
        } catch (error) {
            console.error('Failed to fetch expenses', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchExpenses();
    }, []);

    const handleDelete = async (e, id) => {
        e.stopPropagation(); 
        if (window.confirm('Are you sure you want to delete this expense?')) {
            try {
                await expenseService.delete(id);
                fetchExpenses();
            } catch (error) {
                console.error('Failed to delete expense', error);
            }
        }
    };

    return (
        <div className="max-w-3xl mx-auto space-y-6">
            <div className="flex justify-between items-center px-4 md:px-0">
                <h1 className="text-2xl font-black text-gray-900">Room Expenses</h1>
                <Link 
                    to="/dashboard/expenses/add"
                    className="bg-gray-900 hover:bg-black text-white px-5 py-3 rounded-xl flex items-center gap-2 font-bold transition-colors shadow-sm"
                >
                    <Plus size={20} />
                    <span className="hidden sm:inline">Add Expense</span>
                </Link>
            </div>

            <div className="space-y-6">
                {loading ? (
                    <div className="p-8 text-center text-gray-500 bg-white rounded-3xl border border-gray-100">Loading expenses...</div>
                ) : expenses.length === 0 ? (
                    <div className="p-12 text-center text-gray-500 bg-white rounded-3xl border border-gray-100">
                        <p className="mb-4 text-lg">No expenses recorded yet.</p>
                        <Link to="/dashboard/expenses/add" className="text-blue-600 font-bold hover:underline">[ Add First Expense ]</Link>
                    </div>
                ) : (
                    expenses.map((expense) => {
                        // Find current user's share if they participated
                        const myShareObj = expense.participants?.find(p => p.member_id === user?.memberId);
                        const myShare = myShareObj ? myShareObj.share_amount : 0;
                        
                        // Format the names
                        const payerNames = expense.payers?.map(p => p === user?.username ? 'You' : p).join(', ') || 'Unknown';
                        const participantNames = expense.participants?.map(p => p.name === user?.username ? 'You' : p.name).join(', ') || 'Unknown';

                        return (
                            <div 
                                key={expense.id} 
                                onClick={() => navigate(`/dashboard/expenses/${expense.id}`)}
                                className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6 md:p-8 hover:border-gray-300 hover:shadow-md transition-all cursor-pointer block group relative"
                            >
                                <button 
                                    onClick={(e) => handleDelete(e, expense.id)} 
                                    className="absolute top-6 right-6 text-gray-300 hover:text-red-500 transition-colors md:opacity-0 group-hover:opacity-100 p-2 bg-gray-50 rounded-full"
                                    title="Delete Expense"
                                >
                                    <Trash2 size={16} />
                                </button>

                                <div className="space-y-4">
                                    <div>
                                        <h3 className="font-black text-gray-900 text-2xl mb-1">{expense.title}</h3>
                                        <p className="text-sm text-gray-500 font-medium">{formatDate(expense.expense_date)}</p>
                                    </div>
                                    
                                    <div className="font-black text-gray-900 text-3xl">
                                        {formatCurrency(expense.total_amount)}
                                    </div>
                                    
                                    <div className="text-lg text-gray-800">
                                        <span className="font-bold">{payerNames}</span> paid
                                    </div>

                                    <div className="bg-gray-50 rounded-2xl p-4 mt-4 text-gray-700">
                                        <div className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-1">Used by:</div>
                                        <div className="font-medium leading-relaxed">{participantNames}</div>
                                    </div>

                                    {myShare > 0 && (
                                        <div className="pt-2">
                                            <div className="text-xs font-bold uppercase tracking-widest text-blue-600 mb-1">Your share</div>
                                            <div className="font-black text-gray-900 text-xl">{formatCurrency(myShare)}</div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        );
                    })
                )}
            </div>
        </div>
    );
};

export default Expenses;
