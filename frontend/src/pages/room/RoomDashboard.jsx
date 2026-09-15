import { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { Receipt, HandCoins, ArrowRight, Wallet, CheckCircle } from 'lucide-react';

const RoomDashboard = () => {
    const { room } = useOutletContext();
    const { user } = useAuth();
    
    const [summary, setSummary] = useState(null);
    const [recommendations, setRecommendations] = useState([]);
    const [balances, setBalances] = useState([]);
    const [expenses, setExpenses] = useState([]);
    
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchDashboard = async () => {
            try {
                const [summaryRes, recRes, balRes, expRes] = await Promise.all([
                    api.get(`/dashboard/room-summary/${room.id}`),
                    api.get(`/rooms/${room.id}/settlements/recommendations`),
                    api.get(`/rooms/${room.id}/balances`),
                    api.get(`/rooms/${room.id}/expenses`)
                ]);
                setSummary(summaryRes.data);
                setRecommendations(recRes.data);
                setBalances(balRes.data);
                setExpenses(expRes.data.slice(0, 5)); // Just recent 5
            } catch (err) {
                setError('Failed to load room dashboard');
            } finally {
                setLoading(false);
            }
        };
        fetchDashboard();
    }, [room.id]);

    if (loading) return <div className="flex justify-center py-20 text-gray-500">Loading Room Dashboard...</div>;
    if (error) return <div className="text-center py-10 text-red-500">{error}</div>;

    // Filter recommendations for logged-in user (match by name or ID)
    // We assume recommendations return user IDs now as 'from' and 'to', let's find our memberId
    const myBalanceRecord = balances.find(b => b.name === user.fullName);
    const memberId = myBalanceRecord ? myBalanceRecord.memberId : null;

    const iPay = recommendations.filter(r => r.from === memberId);
    const theyPayMe = recommendations.filter(r => r.to === memberId);

    const totalIPay = iPay.reduce((sum, r) => sum + r.amount, 0);
    const totalTheyPayMe = theyPayMe.reduce((sum, r) => sum + r.amount, 0);
    const netPosition = totalTheyPayMe - totalIPay;

    return (
        <div className="space-y-10">
            {/* Header Section */}
            <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">{room.room_name}</h1>
                    <p className="text-sm text-gray-500 mt-1">Room ID: <span className="font-mono bg-gray-100 px-1 rounded">{room.room_code}</span></p>
                </div>
                <div className="mt-4 md:mt-0 text-right">
                    <p className="text-sm font-medium text-gray-700">{summary.activeMembers} Active Members</p>
                    <p className="text-xs text-gray-500 mt-1">All-time overview</p>
                </div>
            </div>

            {/* YOUR ROOM POSITION */}
            <section>
                <h2 className="text-lg font-bold text-gray-900 mb-4 tracking-wide uppercase">Your Room Position</h2>
                <div className={`p-6 rounded-xl border ${netPosition > 0 ? 'bg-emerald-50 border-emerald-200' : netPosition < 0 ? 'bg-red-50 border-red-200' : 'bg-gray-50 border-gray-200'}`}>
                    {netPosition > 0 && (
                        <div>
                            <p className="text-sm font-semibold text-emerald-700 uppercase tracking-wider mb-1">YOU WILL RECEIVE</p>
                            <p className="text-4xl font-black text-emerald-600">₹{netPosition.toFixed(2)}</p>
                        </div>
                    )}
                    {netPosition < 0 && (
                        <div>
                            <p className="text-sm font-semibold text-red-700 uppercase tracking-wider mb-1">YOU NEED TO GIVE</p>
                            <p className="text-4xl font-black text-red-600">₹{Math.abs(netPosition).toFixed(2)}</p>
                        </div>
                    )}
                    {netPosition === 0 && (
                        <div className="flex items-center">
                            <CheckCircle className="h-10 w-10 text-gray-400 mr-3" />
                            <p className="text-2xl font-black text-gray-600 uppercase">YOU ARE SETTLED</p>
                        </div>
                    )}
                </div>
            </section>

            {/* SETTLEMENT BREAKDOWN */}
            <div className="grid md:grid-cols-2 gap-8">
                {/* YOU NEED TO GIVE */}
                <section>
                    <h3 className="text-sm font-bold text-gray-500 mb-3 uppercase tracking-wider">You Need To Give</h3>
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                        {iPay.length > 0 ? (
                            <table className="min-w-full divide-y divide-gray-200">
                                <tbody className="divide-y divide-gray-100">
                                    {iPay.map((rec, idx) => (
                                        <tr key={idx} className="hover:bg-gray-50">
                                            <td className="px-4 py-4 text-sm text-gray-900">
                                                You need to give <span className="font-bold">{rec.toName}</span>
                                            </td>
                                            <td className="px-4 py-4 text-sm font-bold text-red-600 text-right">
                                                ₹{rec.amount.toFixed(2)}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        ) : (
                            <div className="p-6 text-center text-gray-500 text-sm bg-gray-50">
                                You don't need to give anyone money.
                            </div>
                        )}
                    </div>
                </section>

                {/* OTHERS NEED TO GIVE YOU */}
                <section>
                    <h3 className="text-sm font-bold text-gray-500 mb-3 uppercase tracking-wider">Others Need To Give You</h3>
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                        {theyPayMe.length > 0 ? (
                            <table className="min-w-full divide-y divide-gray-200">
                                <tbody className="divide-y divide-gray-100">
                                    {theyPayMe.map((rec, idx) => (
                                        <tr key={idx} className="hover:bg-gray-50">
                                            <td className="px-4 py-4 text-sm text-gray-900">
                                                <span className="font-bold">{rec.fromName}</span> needs to give you
                                            </td>
                                            <td className="px-4 py-4 text-sm font-bold text-emerald-600 text-right">
                                                ₹{rec.amount.toFixed(2)}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        ) : (
                            <div className="p-6 text-center text-gray-500 text-sm bg-gray-50">
                                No one needs to give you money.
                            </div>
                        )}
                    </div>
                </section>
            </div>

            {/* WHO GIVES WHOM ANIMATION */}
            <section>
                <h3 className="text-sm font-bold text-gray-500 mb-3 uppercase tracking-wider">Who Gives Whom (Whole Room)</h3>
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden p-6 space-y-4">
                    {recommendations.length > 0 ? (
                        recommendations.map((rec, idx) => (
                            <div key={idx} className="flex flex-col items-center justify-center p-4 border border-gray-100 rounded-lg bg-gray-50">
                                <div className="flex items-center justify-between w-full max-w-sm mb-2">
                                    <span className="font-bold text-gray-800 w-24 text-right truncate">{rec.fromName}</span>
                                    <span className="text-sm font-bold text-gray-600 bg-white px-3 py-1 border rounded-full shadow-sm z-10">₹{rec.amount.toFixed(2)}</span>
                                    <span className="font-bold text-gray-800 w-24 text-left truncate">{rec.toName}</span>
                                </div>
                                {/* Continuous Animation Track */}
                                <div className="w-full max-w-sm h-1 bg-gray-200 rounded-full relative overflow-hidden flex items-center">
                                    <div className="absolute h-4 w-4 bg-emerald-500 rounded-full shadow animate-money-flow"></div>
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="text-center text-gray-500 py-6">All settled up! No active debts.</div>
                    )}
                </div>
            </section>

            {/* ROOM MEMBER BALANCES */}
            <section>
                <h3 className="text-sm font-bold text-gray-500 mb-3 uppercase tracking-wider">Room Member Balances</h3>
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Member</th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Total Paid</th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Total Share</th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {balances.map((b) => (
                                <tr key={b.memberId} className={`hover:bg-gray-50 ${b.memberId === memberId ? 'bg-blue-50/50' : ''}`}>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                        {b.name} {b.memberId === memberId && <span className="text-xs text-blue-600 bg-blue-100 px-2 py-0.5 rounded ml-2">You</span>}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-gray-500">
                                        ₹{b.totalPaid.toFixed(2)}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-gray-500">
                                        ₹{b.totalShare.toFixed(2)}
                                    </td>
                                    <td className={`px-6 py-4 whitespace-nowrap text-right text-sm font-bold ${
                                        b.netBalance > 0 ? 'text-emerald-600' : b.netBalance < 0 ? 'text-red-600' : 'text-gray-500'
                                    }`}>
                                        {b.netBalance > 0 ? `Gets ₹${b.netBalance.toFixed(2)}` : b.netBalance < 0 ? `Pays ₹${Math.abs(b.netBalance).toFixed(2)}` : 'Settled'}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </section>

            {/* ROOM EXPENSE SUMMARY */}
            <div className="grid md:grid-cols-2 gap-8">
                <section>
                    <h3 className="text-sm font-bold text-gray-500 mb-3 uppercase tracking-wider">Expense Summary</h3>
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Count</th>
                                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Total</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {summary.categories.map((c, idx) => (
                                    <tr key={idx} className="hover:bg-gray-50">
                                        <td className="px-4 py-3 text-sm text-gray-900 font-medium">{c.category}</td>
                                        <td className="px-4 py-3 text-sm text-gray-500 text-right">{c.count}</td>
                                        <td className="px-4 py-3 text-sm font-bold text-gray-900 text-right">₹{c.total.toFixed(2)}</td>
                                    </tr>
                                ))}
                                <tr className="bg-gray-50">
                                    <td className="px-4 py-3 text-sm font-bold text-gray-900">Total</td>
                                    <td className="px-4 py-3 text-sm font-bold text-gray-900 text-right">{summary.totalExpensesCount}</td>
                                    <td className="px-4 py-3 text-sm font-black text-gray-900 text-right">₹{summary.totalAmount.toFixed(2)}</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </section>

                <section>
                    <h3 className="text-sm font-bold text-gray-500 mb-3 uppercase tracking-wider">Recent Expenses</h3>
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Details</th>
                                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {expenses.map((e, idx) => (
                                    <tr key={idx} className="hover:bg-gray-50">
                                        <td className="px-4 py-3 text-xs text-gray-500">{new Date(e.expense_date).toLocaleDateString()}</td>
                                        <td className="px-4 py-3 text-sm text-gray-900">
                                            <div className="font-medium">{e.title}</div>
                                            <div className="text-xs text-gray-500">{e.creator_name} paid</div>
                                        </td>
                                        <td className="px-4 py-3 text-sm font-bold text-gray-900 text-right">₹{parseFloat(e.total_amount).toFixed(2)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </section>
            </div>
            <style jsx>{`
                @keyframes moneyFlow {
                    0% { left: 0; transform: translateX(-100%); opacity: 0; }
                    10% { opacity: 1; }
                    90% { opacity: 1; }
                    100% { left: 100%; transform: translateX(0%); opacity: 0; }
                }
                .animate-money-flow {
                    animation: moneyFlow 3s infinite linear;
                }
                @media (prefers-reduced-motion) {
                    .animate-money-flow {
                        animation: none;
                        left: 50%;
                        transform: translateX(-50%);
                    }
                }
            `}</style>
        </div>
    );
};

export default RoomDashboard;
