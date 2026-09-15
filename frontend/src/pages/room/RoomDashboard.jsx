import { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import api from '../../services/api';
import { Receipt, HandCoins, ArrowRight } from 'lucide-react';

const RoomDashboard = () => {
    const { room } = useOutletContext();
    const [summary, setSummary] = useState(null);
    const [recommendations, setRecommendations] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchDashboard = async () => {
            try {
                const [summaryRes, recRes] = await Promise.all([
                    api.get(`/dashboard/room-summary/${room.id}`),
                    api.get(`/rooms/${room.id}/settlements/recommendations`)
                ]);
                setSummary(summaryRes.data);
                setRecommendations(recRes.data);
            } catch (err) {
                setError('Failed to load room dashboard');
            } finally {
                setLoading(false);
            }
        };
        fetchDashboard();
    }, [room.id]);

    if (loading) return <div className="text-center py-10">Loading Dashboard...</div>;
    if (error) return <div className="text-center py-10 text-red-500">{error}</div>;

    return (
        <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Room Overview</h2>

            <div className="grid md:grid-cols-2 gap-6 mb-8">
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 flex items-center">
                    <div className="bg-blue-100 p-4 rounded-full mr-4">
                        <Receipt className="h-8 w-8 text-blue-600" />
                    </div>
                    <div>
                        <p className="text-sm text-gray-500 font-medium">Total Room Expenses</p>
                        <p className="text-3xl font-bold text-gray-900">₹{summary.totalAmount.toFixed(2)}</p>
                    </div>
                </div>
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 flex items-center">
                    <div className="bg-emerald-100 p-4 rounded-full mr-4">
                        <HandCoins className="h-8 w-8 text-emerald-600" />
                    </div>
                    <div>
                        <p className="text-sm text-gray-500 font-medium">Total Expense Count</p>
                        <p className="text-3xl font-bold text-gray-900">{summary.totalExpenses}</p>
                    </div>
                </div>
            </div>

            <h3 className="text-xl font-bold text-gray-900 mb-4">WHO PAYS WHOM</h3>
            
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                {recommendations.length > 0 ? (
                    <div className="divide-y divide-gray-200">
                        {recommendations.map((rec, index) => (
                            <div key={index} className="p-4 flex items-center justify-between hover:bg-gray-50">
                                <div className="flex items-center text-lg font-medium text-gray-800">
                                    <span className="text-red-600">{rec.fromName}</span>
                                    <ArrowRight className="mx-4 text-gray-400" />
                                    <span className="text-emerald-600">{rec.toName}</span>
                                </div>
                                <div className="text-xl font-bold text-gray-900">
                                    ₹{rec.amount.toFixed(2)}
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="p-8 text-center text-gray-500">
                        All settled up! No one owes anything.
                    </div>
                )}
            </div>
        </div>
    );
};

export default RoomDashboard;
