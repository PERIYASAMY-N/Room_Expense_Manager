import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { expenseService } from '../services/api';
import { formatCurrency, formatDate } from '../utils/formatters';
import { ArrowLeft, Trash2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const ExpenseDetails = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { user } = useAuth();
    const [expense, setExpense] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchExpense = async () => {
            try {
                const response = await expenseService.getById(id);
                setExpense(response.data.data);
            } catch (error) {
                console.error('Failed to fetch expense details', error);
                alert('Expense not found');
                navigate('/dashboard/expenses');
            } finally {
                setLoading(false);
            }
        };
        fetchExpense();
    }, [id, navigate]);

    const handleDelete = async () => {
        if (window.confirm('Are you sure you want to delete this expense?')) {
            try {
                await expenseService.delete(id);
                navigate('/dashboard/expenses');
            } catch (error) {
                console.error('Failed to delete expense', error);
            }
        }
    };

    if (loading) return <div className="p-8 text-center text-gray-500">Loading...</div>;
    if (!expense) return null;

    // Calculate Who Gives Whom for this specific expense
    const owingMap = {}; // { 'Kadhir': { 'Navi': 50 } } meaning Kadhir gives Navi 50

    expense.items.forEach(item => {
        item.participants.forEach(p => {
            if (p.member_id === item.paid_by) return; // You don't give to yourself
            
            const debtorId = p.member_id;
            const debtorName = p.name === user?.username ? 'You' : p.name;
            const creditorName = item.paid_by_name === user?.username ? 'you' : item.paid_by_name;
            
            const key = `${debtorName}|${creditorName}`;
            if (!owingMap[key]) owingMap[key] = 0;
            owingMap[key] += Number(p.share_amount);
        });
    });

    const owingList = Object.entries(owingMap).map(([key, amount]) => {
        const [debtor, creditor] = key.split('|');
        return { debtor, creditor, amount };
    });

    return (
        <div className="max-w-3xl mx-auto space-y-6">
            <div className="flex justify-between items-center px-4 md:px-0">
                <Link to="/dashboard/expenses" className="text-gray-400 hover:text-gray-900 transition-colors bg-white p-2 rounded-full shadow-sm border border-gray-100">
                    <ArrowLeft size={20} />
                </Link>
                <button onClick={handleDelete} className="text-red-500 hover:bg-red-50 px-4 py-2 rounded-xl transition-colors font-bold flex items-center gap-2" title="Delete Expense">
                    <Trash2 size={18} /> Delete
                </button>
            </div>

            <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="p-8 text-center border-b border-gray-100 bg-gray-900 text-white">
                    <h1 className="text-3xl font-black uppercase tracking-tight mb-2">{expense.title}</h1>
                    <div className="text-5xl font-black mb-2">{formatCurrency(expense.total_amount)}</div>
                    <p className="text-sm text-gray-400 font-medium">{formatDate(expense.expense_date)}</p>
                </div>

                <div className="p-6 md:p-8 space-y-8">
                    
                    {/* Items Breakdown */}
                    <div>
                        <h3 className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-4">Item Breakdown</h3>
                        <div className="space-y-4">
                            {expense.items.map((item, idx) => (
                                <div key={idx} className="p-5 border-2 border-gray-100 rounded-2xl">
                                    <div className="flex justify-between items-start mb-3">
                                        <div>
                                            <h4 className="font-bold text-gray-900 text-lg">{item.item_name}</h4>
                                            <p className="text-sm text-gray-500 font-medium">Paid by: <span className="text-gray-900 font-bold">{item.paid_by_name === user?.username ? 'You' : item.paid_by_name}</span></p>
                                        </div>
                                        <div className="font-black text-gray-900 text-xl">{formatCurrency(item.amount)}</div>
                                    </div>
                                    <div className="bg-gray-50 rounded-xl p-4 mt-4">
                                        <h5 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Used By & Shares</h5>
                                        <div className="space-y-2">
                                            {item.participants.map(p => (
                                                <div key={p.member_id} className="flex justify-between text-sm">
                                                    <span className="font-bold text-gray-700">{p.name === user?.username ? 'You' : p.name}</span>
                                                    <span className="font-bold text-gray-900">{formatCurrency(p.share_amount)}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Who Gives Whom (Result) */}
                    {owingList.length > 0 && (
                        <div className="pt-8 border-t border-gray-100">
                            <h3 className="text-xs font-bold uppercase tracking-widest text-blue-600 mb-4 bg-blue-50 inline-block px-3 py-1 rounded-full">Final Result for this expense</h3>
                            <div className="space-y-3 bg-gray-50 p-6 rounded-2xl border border-gray-100">
                                {owingList.map((owe, idx) => (
                                    <div key={idx} className="text-gray-700 text-lg">
                                        <span className="font-black text-gray-900">{owe.debtor}</span> {owe.debtor === 'You' ? 'need to give' : 'needs to give'} <span className="font-black text-gray-900">{owe.creditor}</span> {formatCurrency(owe.amount)}
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {expense.note && (
                        <div className="pt-8 border-t border-gray-100">
                            <h3 className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-2">NOTE</h3>
                            <p className="text-gray-700">{expense.note}</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ExpenseDetails;
