import React, { useState, useEffect } from 'react';
import { personalMoneyService } from '../services/api';
import { formatCurrency, formatDate } from '../utils/formatters';
import { Link } from 'react-router-dom';
import { Trash2 } from 'lucide-react';

const MyMoney = () => {
    const [summary, setSummary] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const fetchSummary = async () => {
        setLoading(true);
        setError(null);
        try {
            const response = await personalMoneyService.getSummary();
            setSummary(response.data.data);
        } catch (error) {
            console.error('Failed to fetch personal summary', error);
            setError('Failed to load your money data. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchSummary();
    }, []);

    const handleDelete = async (id) => {
        if (window.confirm('Delete this transaction?')) {
            try {
                await personalMoneyService.deleteTransaction(id);
                fetchSummary(); // reload
            } catch (error) {
                console.error('Failed to delete transaction', error);
            }
        }
    };

    if (loading) return <div className="p-8 text-center text-gray-500">Loading your finances...</div>;
    if (error) return (
        <div className="p-8 text-center">
            <p className="text-red-500 mb-4">{error}</p>
            <button onClick={fetchSummary} className="bg-blue-600 text-white px-4 py-2 rounded-lg font-bold">Retry</button>
        </div>
    );
    if (!summary) return null;

    const { totalIncome, totalExpenses, netBalance, categories, recentTransactions } = summary;

    return (
        <div className="max-w-3xl mx-auto space-y-6 px-4 md:px-0 pb-10">
            <div className="text-center pb-6 border-b border-gray-200">
                <h1 className="text-2xl font-black text-gray-900 uppercase tracking-tight">MY PERSONAL MONEY</h1>
                <p className="text-gray-500 text-sm mt-1">Track your own income, expenses and savings separately from room expenses.</p>
            </div>

            {/* CURRENT BALANCE */}
            <div className="text-center py-6">
                <h2 className="text-sm font-bold uppercase tracking-widest text-gray-400 mb-4">CURRENT BALANCE</h2>
                <p className={`text-5xl font-black ${netBalance >= 0 ? 'text-blue-600' : 'text-red-500'}`}>{formatCurrency(netBalance)}</p>
            </div>

            {/* SUMMARY */}
            <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden p-6 md:p-8">
                <p className="text-xs font-bold uppercase tracking-widest text-gray-500 mb-4">SUMMARY</p>
                <div className="grid grid-cols-3 gap-4">
                    <div>
                        <div className="text-gray-500 mb-1">Total Income</div>
                        <div className="font-bold text-gray-900 text-xl">{formatCurrency(totalIncome)}</div>
                    </div>
                    <div>
                        <div className="text-gray-500 mb-1">Total Expenses</div>
                        <div className="font-bold text-gray-900 text-xl">{formatCurrency(totalExpenses)}</div>
                    </div>
                    <div>
                        <div className="text-gray-500 mb-1">Savings</div>
                        <div className="font-bold text-gray-900 text-xl">{formatCurrency(netBalance)}</div>
                    </div>
                </div>
            </div>

            {/* QUICK ACTIONS */}
            <div className="grid grid-cols-2 gap-4">
                <Link to="/dashboard/my-money/add-income" className="bg-green-600 hover:bg-green-700 text-white font-bold py-4 rounded-xl shadow-sm transition-all text-center">
                    + Add Money
                </Link>
                <Link to="/dashboard/my-money/add-expense" className="bg-red-500 hover:bg-red-600 text-white font-bold py-4 rounded-xl shadow-sm transition-all text-center">
                    + Add Personal Expense
                </Link>
            </div>

            {/* SPENDING */}
            <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="p-4 bg-gray-50 border-b border-gray-100">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-gray-500">SPENDING</h3>
                </div>
                <div className="divide-y divide-gray-100">
                    {categories && categories.length > 0 ? (
                        categories.map((cat, i) => (
                            <div key={i} className="flex justify-between items-center p-4">
                                <span className="font-medium text-gray-900">{cat.category}</span>
                                <span className="font-bold text-gray-900">{formatCurrency(cat.total)}</span>
                            </div>
                        ))
                    ) : (
                        <div className="p-6 text-center text-gray-500">No personal expenses recorded.</div>
                    )}
                </div>
            </div>

            {/* RECENT TRANSACTIONS */}
            <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="p-4 bg-gray-50 border-b border-gray-100">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-gray-500">RECENT TRANSACTIONS</h3>
                </div>
                <div className="divide-y divide-gray-100">
                    {recentTransactions && recentTransactions.length > 0 ? (
                        recentTransactions.map((t, i) => (
                            <div key={i} className="p-4 hover:bg-gray-50 transition-colors flex justify-between items-center group">
                                <div>
                                    <div className="font-bold text-gray-900">{t.category}</div>
                                    {t.description && <div className="text-sm text-gray-600">{t.description}</div>}
                                    <div className="text-xs text-gray-400 mt-1">{formatDate(t.transaction_date)}</div>
                                </div>
                                <div className="flex items-center gap-4 text-right">
                                    <span className={`font-black ${t.type === 'INCOME' ? 'text-green-600' : 'text-gray-900'}`}>
                                        {t.type === 'INCOME' ? '+' : '-'}{formatCurrency(t.amount)}
                                    </span>
                                    <button 
                                        onClick={() => handleDelete(t.id)} 
                                        className="text-gray-300 hover:text-red-500 transition-colors md:opacity-0 group-hover:opacity-100"
                                        title="Delete Transaction"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="p-6 text-center text-gray-500">No recent transactions.</div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default MyMoney;
