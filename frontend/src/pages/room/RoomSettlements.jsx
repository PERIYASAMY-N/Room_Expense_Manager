import { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import api from '../../services/api';
import { HandCoins } from 'lucide-react';

const RoomSettlements = () => {
    const { room } = useOutletContext();
    const [balances, setBalances] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchBalances = async () => {
            try {
                const res = await api.get(`/rooms/${room.id}/balances`);
                setBalances(res.data);
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        fetchBalances();
    }, [room.id]);

    if (loading) return <div className="text-center py-10">Loading...</div>;

    return (
        <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Balances & Settlements</h2>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="p-4 border-b border-gray-200 bg-gray-50 flex items-center">
                    <HandCoins className="h-5 w-5 text-gray-500 mr-2" />
                    <h3 className="font-bold text-gray-800">Current Balances</h3>
                </div>
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-white">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Member</th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Total Paid</th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Total Share</th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Net Balance</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {balances.map((b) => (
                                <tr key={b.memberId} className="hover:bg-gray-50">
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                        {b.name}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-gray-500">
                                        ₹{b.totalPaid.toFixed(2)}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-gray-500">
                                        ₹{b.totalShare.toFixed(2)}
                                    </td>
                                    <td className={`px-6 py-4 whitespace-nowrap text-right text-sm font-bold ${
                                        b.netBalance > 0 ? 'text-emerald-600' : b.netBalance < 0 ? 'text-red-600' : 'text-gray-900'
                                    }`}>
                                        {b.netBalance > 0 ? '+' : ''}₹{b.netBalance.toFixed(2)}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
            
            <p className="mt-4 text-sm text-gray-500 text-center">
                Note: Settlements functionality (recording manual payments) can be added here in the future.
            </p>
        </div>
    );
};

export default RoomSettlements;
