import { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import api from '../../services/api';
import { CheckCircle } from 'lucide-react';

const MyRoomDashboard = () => {
    const { room } = useOutletContext();
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchMyData = async () => {
            try {
                const res = await api.get(`/dashboard/my-summary/${room.id}`);
                setData(res.data);
            } catch (err) {
                setError('Failed to load My Room Dashboard');
            } finally {
                setLoading(false);
            }
        };
        fetchMyData();
    }, [room.id]);

    if (loading) return <div className="text-center py-20 text-gray-500">Loading My Dashboard...</div>;
    if (error) return <div className="text-center py-10 text-red-500">{error}</div>;

    const { financialSummary, myExpenses, mySettlements } = data;
    const net = financialSummary.netBalance;

    return (
        <div className="space-y-10">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold text-gray-900 uppercase">My Financial Summary</h1>
                <p className="text-sm text-gray-500">Showing only your personal financial information in this room.</p>
            </div>

            {/* MY FINANCIAL SUMMARY TABLE */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Metric</th>
                            <th className="px-6 py-4 text-right text-xs font-bold text-gray-500 uppercase tracking-wider">Amount</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        <tr className="hover:bg-gray-50">
                            <td className="px-6 py-4 text-sm font-medium text-gray-900">Total Paid</td>
                            <td className="px-6 py-4 text-sm font-bold text-gray-900 text-right">₹{financialSummary.totalPaid.toFixed(2)}</td>
                        </tr>
                        <tr className="hover:bg-gray-50">
                            <td className="px-6 py-4 text-sm font-medium text-gray-900">Total Share</td>
                            <td className="px-6 py-4 text-sm font-bold text-gray-900 text-right">₹{financialSummary.totalShare.toFixed(2)}</td>
                        </tr>
                        <tr className="hover:bg-gray-50 bg-emerald-50/30">
                            <td className="px-6 py-4 text-sm font-medium text-emerald-800">Amount To Receive</td>
                            <td className="px-6 py-4 text-sm font-bold text-emerald-600 text-right">₹{financialSummary.amountToReceive.toFixed(2)}</td>
                        </tr>
                        <tr className="hover:bg-gray-50 bg-red-50/30">
                            <td className="px-6 py-4 text-sm font-medium text-red-800">Amount To Pay</td>
                            <td className="px-6 py-4 text-sm font-bold text-red-600 text-right">₹{financialSummary.amountToPay.toFixed(2)}</td>
                        </tr>
                        <tr className={net > 0 ? 'bg-emerald-50' : net < 0 ? 'bg-red-50' : 'bg-gray-50'}>
                            <td className="px-6 py-4 text-base font-black uppercase text-gray-900">Net Balance</td>
                            <td className={`px-6 py-4 text-lg font-black text-right ${net > 0 ? 'text-emerald-700' : net < 0 ? 'text-red-700' : 'text-gray-900'}`}>
                                {net > 0 ? '+' : ''}₹{net.toFixed(2)}
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>

            {/* MY EXPENSES */}
            <section>
                <h3 className="text-sm font-bold text-gray-500 mb-3 uppercase tracking-wider">My Expenses</h3>
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-x-auto">
                    {myExpenses.length > 0 ? (
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Paid By</th>
                                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Total Expense</th>
                                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">My Share</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {myExpenses.map((exp) => (
                                    <tr key={exp.id} className="hover:bg-gray-50">
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{new Date(exp.date).toLocaleDateString()}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{exp.category}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{exp.paidBy}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900 text-right">₹{exp.total.toFixed(2)}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-black text-blue-600 text-right">₹{exp.myShare.toFixed(2)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    ) : (
                        <div className="p-8 text-center text-gray-500">You have not participated in any expenses yet.</div>
                    )}
                </div>
            </section>

            {/* MY SETTLEMENT HISTORY */}
            <section>
                <h3 className="text-sm font-bold text-gray-500 mb-3 uppercase tracking-wider">My Settlement History</h3>
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-x-auto">
                    {mySettlements.length > 0 ? (
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Member</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Note</th>
                                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {mySettlements.map((s) => (
                                    <tr key={s.id} className="hover:bg-gray-50">
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{new Date(s.date).toLocaleDateString()}</td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-md ${s.type === 'RECEIVED' ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'}`}>
                                                {s.type}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{s.member}</td>
                                        <td className="px-6 py-4 text-sm text-gray-500">{s.note || '-'}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-right text-gray-900">₹{s.amount.toFixed(2)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    ) : (
                        <div className="p-8 text-center text-gray-500">No settlements recorded yet.</div>
                    )}
                </div>
            </section>
        </div>
    );
};

export default MyRoomDashboard;
