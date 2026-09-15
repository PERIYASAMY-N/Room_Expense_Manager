import { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { X, Check } from 'lucide-react';

const RoomSettlements = () => {
    const { room } = useOutletContext();
    const { user } = useAuth();
    
    const [recommendations, setRecommendations] = useState([]);
    const [settlements, setSettlements] = useState([]); // Past settlements
    const [balances, setBalances] = useState([]);
    
    const [loading, setLoading] = useState(true);
    
    // Modals
    const [isGiveModalOpen, setIsGiveModalOpen] = useState(false);
    const [selectedDebt, setSelectedDebt] = useState(null);
    const [paymentSuccessModal, setPaymentSuccessModal] = useState(false);

    useEffect(() => {
        fetchData();
    }, [room.id]);

    const fetchData = async () => {
        try {
            const [recRes, balRes] = await Promise.all([
                api.get(`/rooms/${room.id}/settlements/recommendations`),
                api.get(`/rooms/${room.id}/balances`)
            ]);
            setRecommendations(recRes.data);
            setBalances(balRes.data);
            
            // fetch past settlements
            const myBal = balRes.data.find(b => b.name === user.fullName);
            if (myBal) {
                const mySummary = await api.get(`/dashboard/my-summary/${room.id}`);
                setSettlements(mySummary.data.mySettlements);
            }
        } catch (err) {
            console.error('Failed to load settlements');
        } finally {
            setLoading(false);
        }
    };

    const myBalanceRecord = balances.find(b => b.name === user.fullName);
    const memberId = myBalanceRecord ? myBalanceRecord.memberId : null;

    const iPay = recommendations.filter(r => r.from === memberId);
    const theyPayMe = recommendations.filter(r => r.to === memberId);

    const handleOpenGive = (debt) => {
        setSelectedDebt(debt);
        setIsGiveModalOpen(true);
    };

    const handleConfirmGive = async () => {
        try {
            await api.post(`/rooms/${room.id}/settlements`, {
                paidTo: selectedDebt.to,
                amount: selectedDebt.amount,
                note: `Settlement to ${selectedDebt.toName}`
            });
            setIsGiveModalOpen(false);
            setPaymentSuccessModal(true);
            fetchData();
        } catch (err) {
            alert('Failed to record payment');
        }
    };

    const handleTransferToPersonal = async () => {
        // Find the last received settlement where theyPayMe amount was just paid?
        // For simplicity, we just trigger the generic add transaction modal or directly add it
        try {
            await api.post('/personal/transactions', {
                type: 'INCOME',
                category: 'Room Settlement',
                amount: selectedDebt?.amount || 0,
                transactionDate: new Date().toISOString().split('T')[0],
                description: `Received room settlement`
            });
            setPaymentSuccessModal(false);
            alert('Added to your personal money!');
        } catch (err) {
            alert('Failed to add to personal money');
        }
    };

    if (loading) return <div className="text-center py-20">Loading...</div>;

    return (
        <div className="space-y-10">
            <div>
                <h1 className="text-2xl font-bold text-gray-900 uppercase">Room Settlements</h1>
                <p className="text-sm text-gray-500 mt-1">Manage and record money transfers between room members.</p>
            </div>

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
                                            <td className="px-6 py-4 text-sm text-gray-900">
                                                You need to give <span className="font-bold">{rec.toName}</span>
                                                <div className="text-xs text-gray-500 mt-1">₹{rec.amount.toFixed(2)}</div>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <button onClick={() => handleOpenGive(rec)} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">
                                                    Give
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        ) : (
                            <div className="p-8 text-center text-gray-500">You are all caught up!</div>
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
                                            <td className="px-6 py-4 text-sm text-gray-900">
                                                <span className="font-bold">{rec.fromName}</span> needs to give you
                                                <div className="text-xs text-gray-500 mt-1">₹{rec.amount.toFixed(2)}</div>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <button className="text-emerald-600 hover:text-emerald-800 text-sm font-medium" onClick={() => {
                                                    // Trigger manual receipt
                                                    setSelectedDebt(rec);
                                                    setPaymentSuccessModal(true); // Mocking that they paid us
                                                }}>Mark Received</button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        ) : (
                            <div className="p-8 text-center text-gray-500">No one needs to give you money.</div>
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
                            <div key={idx} className="flex flex-col items-center justify-center p-4 border border-gray-100 rounded-lg bg-gray-50 max-w-lg mx-auto">
                                <div className="flex items-center justify-between w-full mb-2 px-4">
                                    <span className="font-bold text-gray-800 w-1/3 text-right">{rec.fromName}</span>
                                    <span className="text-sm font-bold text-gray-600 bg-white px-4 py-1 border rounded-full shadow-sm z-10 mx-2">₹{rec.amount.toFixed(2)}</span>
                                    <span className="font-bold text-gray-800 w-1/3 text-left">{rec.toName}</span>
                                </div>
                                <div className="w-full h-1 bg-gray-200 rounded-full relative overflow-hidden flex items-center mt-1">
                                    <div className="absolute h-3 w-3 bg-emerald-500 rounded-full shadow animate-money-flow"></div>
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="text-center text-gray-500 py-6">All settled up! No active debts.</div>
                    )}
                </div>
            </section>

            {/* GIVE MODAL */}
            {isGiveModalOpen && selectedDebt && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-xl shadow-xl max-w-md w-full overflow-hidden">
                        <div className="p-6">
                            <h3 className="text-xl font-bold text-gray-900 mb-2 uppercase text-center">Give To {selectedDebt.toName}</h3>
                            <p className="text-center text-4xl font-black text-gray-900 my-6">₹{selectedDebt.amount.toFixed(2)}</p>
                            <p className="text-sm text-gray-500 text-center mb-8">Are you sure you gave ₹{selectedDebt.amount.toFixed(2)} to {selectedDebt.toName}?</p>
                            
                            <div className="flex gap-3">
                                <button onClick={() => setIsGiveModalOpen(false)} className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50">Cancel</button>
                                <button onClick={handleConfirmGive} className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700">Yes, I Gave It</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* PAYMENT SUCCESS / PERSONAL TRANSFER MODAL */}
            {paymentSuccessModal && selectedDebt && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-xl shadow-xl max-w-md w-full overflow-hidden p-6 text-center">
                        <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-emerald-100 mb-4">
                            <Check className="h-8 w-8 text-emerald-600" />
                        </div>
                        <h3 className="text-xl font-bold text-gray-900 mb-2 uppercase">Payment Recorded</h3>
                        <p className="text-sm text-gray-500 mb-6">
                            {selectedDebt.toName === user.fullName 
                                ? `You received ₹${selectedDebt.amount.toFixed(2)} from ${selectedDebt.fromName}.` 
                                : `You gave ₹${selectedDebt.amount.toFixed(2)} to ${selectedDebt.toName}.`
                            }
                        </p>
                        
                        {/* Only show personal money transfer if they received it */}
                        {selectedDebt.toName === user.fullName ? (
                            <div className="space-y-3">
                                <button onClick={handleTransferToPersonal} className="w-full px-4 py-3 bg-emerald-600 text-white rounded-lg font-medium hover:bg-emerald-700">
                                    Add ₹{selectedDebt.amount.toFixed(2)} to My Money
                                </button>
                                <button onClick={() => setPaymentSuccessModal(false)} className="w-full px-4 py-3 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50">
                                    Done
                                </button>
                            </div>
                        ) : (
                            <button onClick={() => setPaymentSuccessModal(false)} className="w-full px-4 py-3 bg-gray-900 text-white rounded-lg font-medium hover:bg-gray-800">
                                Done
                            </button>
                        )}
                    </div>
                </div>
            )}
            
            <style jsx>{`
                @keyframes moneyFlow {
                    0% { left: 0; transform: translateX(-100%); opacity: 0; }
                    10% { opacity: 1; }
                    90% { opacity: 1; }
                    100% { left: 100%; transform: translateX(0%); opacity: 0; }
                }
                .animate-money-flow {
                    animation: moneyFlow 3.5s infinite linear;
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

export default RoomSettlements;
