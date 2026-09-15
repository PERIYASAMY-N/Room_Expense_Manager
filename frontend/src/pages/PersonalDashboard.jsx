import { useState, useEffect } from 'react';
import api from '../services/api';

const PersonalDashboard = () => {
    const [dashboardData, setDashboardData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchDashboard = async () => {
            try {
                const res = await api.get('/personal/dashboard');
                setDashboardData(res.data);
            } catch (err) {
                setError(err.response?.data?.message || 'Failed to load dashboard');
            } finally {
                setLoading(false);
            }
        };
        fetchDashboard();
    }, []);

    if (loading) return <div className="text-center py-10 text-gray-500">Loading Dashboard...</div>;
    if (error) return <div className="text-center py-10 text-red-500">{error}</div>;

    const { currentBalance, totalIncome, totalExpense, saved } = dashboardData;

    return (
        <div className="space-y-8">
            <h1 className="text-2xl font-bold text-gray-900 uppercase">My Money</h1>

            {/* Current Balance */}
            <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-200">
                <p className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-2">Current Balance</p>
                <p className={`text-5xl font-black ${currentBalance >= 0 ? 'text-gray-900' : 'text-red-600'}`}>
                    ₹{currentBalance.toFixed(2)}
                </p>
            </div>

            {/* Breakdown Table */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                    <tbody className="bg-white divide-y divide-gray-100">
                        <tr className="hover:bg-gray-50">
                            <td className="px-6 py-5 text-sm font-medium text-gray-900 uppercase tracking-wider">Money In</td>
                            <td className="px-6 py-5 text-lg font-bold text-emerald-600 text-right">₹{totalIncome.toFixed(2)}</td>
                        </tr>
                        <tr className="hover:bg-gray-50">
                            <td className="px-6 py-5 text-sm font-medium text-gray-900 uppercase tracking-wider">Money Out</td>
                            <td className="px-6 py-5 text-lg font-bold text-red-600 text-right">₹{totalExpense.toFixed(2)}</td>
                        </tr>
                        <tr className="bg-gray-50">
                            <td className="px-6 py-5 text-sm font-black text-gray-900 uppercase tracking-wider">Saved</td>
                            <td className="px-6 py-5 text-xl font-black text-blue-600 text-right">₹{saved.toFixed(2)}</td>
                        </tr>
                    </tbody>
                </table>
            </div>
            
            <p className="text-sm text-gray-500 text-center">
                These numbers come only from personal transactions. Room expenses are not included here.
            </p>
        </div>
    );
};

export default PersonalDashboard;
