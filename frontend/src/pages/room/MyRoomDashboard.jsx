import { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { ArrowRight, ArrowDownRight, ArrowUpRight } from 'lucide-react';

const MyRoomDashboard = () => {
    const { room } = useOutletContext();
    const { user } = useAuth();
    const [myBalance, setMyBalance] = useState(null);
    const [recommendations, setRecommendations] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchMyData = async () => {
            try {
                const [balanceRes, recRes] = await Promise.all([
                    api.get(`/dashboard/my-summary/${room.id}`),
                    api.get(`/rooms/${room.id}/settlements/recommendations`)
                ]);
                setMyBalance(balanceRes.data);
                setRecommendations(recRes.data);
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        fetchMyData();
    }, [room.id]);

    if (loading) return <div className="text-center py-10">Loading My Dashboard...</div>;

    const net = myBalance.netBalance;
    const iNeedToPay = recommendations.filter(r => r.fromName === user.fullName);
    const iShouldReceive = recommendations.filter(r => r.toName === user.fullName);

    return (
        <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-6">My Room Dashboard</h2>

            <div className="grid md:grid-cols-3 gap-6 mb-8">
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                    <p className="text-sm text-gray-500 font-medium mb-1">I Paid</p>
                    <p className="text-3xl font-bold text-gray-900">₹{myBalance.totalPaid.toFixed(2)}</p>
                </div>
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                    <p className="text-sm text-gray-500 font-medium mb-1">My Share</p>
                    <p className="text-3xl font-bold text-gray-900">₹{myBalance.totalShare.toFixed(2)}</p>
                </div>
                <div className={`p-6 rounded-xl shadow-sm border ${net > 0 ? 'bg-emerald-50 border-emerald-200' : net < 0 ? 'bg-red-50 border-red-200' : 'bg-white border-gray-200'}`}>
                    <p className="text-sm text-gray-600 font-medium mb-1">My Net Position</p>
                    <p className={`text-3xl font-bold ${net > 0 ? 'text-emerald-700' : net < 0 ? 'text-red-700' : 'text-gray-900'}`}>
                        {net > 0 ? '+' : ''}₹{net.toFixed(2)}
                    </p>
                </div>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
                {/* I Need To Pay */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                    <div className="bg-red-50 p-4 border-b border-gray-200 flex items-center text-red-800">
                        <ArrowUpRight className="h-5 w-5 mr-2" />
                        <h3 className="font-bold">I Need To Pay</h3>
                    </div>
                    {iNeedToPay.length > 0 ? (
                        <div className="divide-y divide-gray-200">
                            {iNeedToPay.map((rec, idx) => (
                                <div key={idx} className="p-4 flex justify-between items-center">
                                    <span className="text-gray-700 font-medium">To {rec.toName}</span>
                                    <span className="font-bold text-red-600">₹{rec.amount.toFixed(2)}</span>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="p-6 text-center text-gray-500 text-sm">You don't owe anyone.</div>
                    )}
                </div>

                {/* I Should Receive */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                    <div className="bg-emerald-50 p-4 border-b border-gray-200 flex items-center text-emerald-800">
                        <ArrowDownRight className="h-5 w-5 mr-2" />
                        <h3 className="font-bold">I Should Receive</h3>
                    </div>
                    {iShouldReceive.length > 0 ? (
                        <div className="divide-y divide-gray-200">
                            {iShouldReceive.map((rec, idx) => (
                                <div key={idx} className="p-4 flex justify-between items-center">
                                    <span className="text-gray-700 font-medium">From {rec.fromName}</span>
                                    <span className="font-bold text-emerald-600">₹{rec.amount.toFixed(2)}</span>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="p-6 text-center text-gray-500 text-sm">No one owes you.</div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default MyRoomDashboard;
