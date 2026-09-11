import React, { useState, useEffect } from 'react';
import { dashboardService, settlementService } from '../services/api';
import { formatCurrency, formatDate } from '../utils/formatters';
import { CheckCircle2, HandCoins } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { format } from 'date-fns';

const Settlements = () => {
    const { user } = useAuth();
    const [loading, setLoading] = useState(true);
    const [mySummary, setMySummary] = useState(null);
    const [history, setHistory] = useState([]);
    
    // For confirmation dialog
    const [confirmDialog, setConfirmDialog] = useState(null);
    const [successDialog, setSuccessDialog] = useState(null);
    const [addingToPersonal, setAddingToPersonal] = useState(false);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [summaryRes, historyRes] = await Promise.all([
                dashboardService.getMySummary(),
                settlementService.getAll()
            ]);
            setMySummary(summaryRes.data.data);
            
            // Filter history for only settlements involving the user
            const myHistory = (historyRes.data.data || []).filter(
                s => s.from_member === user?.memberId || s.to_member === user?.memberId
            );
            setHistory(myHistory);
        } catch (error) {
            console.error('Error fetching settlement data', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, [user]);

    const handleConfirmPayment = async () => {
        if (!confirmDialog) return;
        
        try {
            await settlementService.create({
                fromMember: confirmDialog.from,
                toMember: confirmDialog.to,
                amount: confirmDialog.amount,
                date: format(new Date(), 'yyyy-MM-dd'),
                note: 'Settled via dashboard'
            });
            const type = confirmDialog.type;
            const amount = confirmDialog.amount;
            const name = confirmDialog.name;
            setConfirmDialog(null);
            fetchData(); // Refresh data
            
            if (type === 'receive') {
                setSuccessDialog({ amount, name });
            }
        } catch (error) {
            console.error('Error recording payment', error);
            alert(error.response?.data?.message || 'Failed to record payment');
        }
    };

    const handleAddToPersonalMoney = async () => {
        if (!successDialog) return;
        setAddingToPersonal(true);
        try {
            const { personalMoneyService } = await import('../services/api');
            await personalMoneyService.addIncome({
                amount: parseFloat(successDialog.amount),
                source: 'Room Settlement',
                date: format(new Date(), 'yyyy-MM-dd'),
                note: `Settlement from ${successDialog.name}`
            });
            setSuccessDialog(null);
            alert('Successfully added to your personal money!');
        } catch (err) {
            alert('Failed to add to personal money');
        } finally {
            setAddingToPersonal(false);
        }
    };

    if (loading) return <div className="p-8 text-center text-gray-500">Loading settlements...</div>;

    if (!mySummary) {
        return (
            <div className="p-8 text-center">
                <p className="text-red-500 mb-4">Failed to load settlement data.</p>
                <button onClick={fetchData} className="bg-blue-600 text-white px-4 py-2 rounded-lg font-bold">Retry</button>
            </div>
        );
    }

    const { payables, receivables } = mySummary;

    return (
        <div className="max-w-3xl mx-auto space-y-6 px-4 md:px-0 relative">
            <h1 className="text-2xl font-black text-gray-900 mb-6">Settlements</h1>

            {/* YOUR PAYMENTS */}
            <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="p-4 bg-gray-50 border-b border-gray-100 flex items-center gap-2">
                    <HandCoins size={16} className="text-gray-400" />
                    <h3 className="text-xs font-bold uppercase tracking-wider text-gray-500">YOUR PAYMENTS</h3>
                </div>
                <div className="divide-y divide-gray-100">
                    {payables && payables.length > 0 ? (
                        payables.map((p, i) => (
                            <div key={`pay-${i}`} className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden mb-4 last:mb-0">
                                <div className="p-5 flex justify-between items-center">
                                    <div>
                                        <p className="text-lg font-bold text-gray-900">{p.toName}</p>
                                        <p className="text-sm text-gray-500">You need to give</p>
                                    </div>
                                    <div className="text-right flex flex-col items-end gap-2">
                                        <p className="text-2xl font-black text-gray-900">{formatCurrency(p.amount)}</p>
                                        <button 
                                            onClick={() => setConfirmDialog({ from: p.from, to: p.to, amount: p.amount, type: 'pay', name: p.toName })}
                                            className="text-sm bg-blue-600 hover:bg-blue-700 text-white font-bold py-1.5 px-3 rounded-lg shadow-sm transition-colors"
                                        >
                                            Mark as Given
                                        </button>
                                    </div>
                                </div>
                                {p.breakdown && p.breakdown.length > 0 && (
                                    <details className="text-sm text-gray-600 bg-gray-50 border-t border-gray-100 group">
                                        <summary className="cursor-pointer font-medium text-blue-600 hover:text-blue-800 p-3 transition-colors text-center w-full focus:outline-none">
                                            [ Why? ]
                                        </summary>
                                        <div className="p-4 pt-0 space-y-4">
                                            <h3 className="font-bold text-gray-800 mb-2">WHY YOU NEED TO GIVE {p.toName.toUpperCase()} {formatCurrency(p.amount)}</h3>
                                            {p.breakdown.map((b, idx) => {
                                                const isExpense = b.type === 'EXPENSE';
                                                return isExpense ? (
                                                    <div key={idx} className="bg-white p-3 rounded border border-gray-200 space-y-1">
                                                        <p className="text-gray-500">You used:</p>
                                                        <h4 className="font-bold text-gray-900 text-base">{b.title}</h4>
                                                        <p>Total item: <span className="font-medium">{formatCurrency(b.totalItemAmount || 0)}</span></p>
                                                        <p>Participants: <span className="font-medium">{b.participants?.join(', ') || 'Unknown'}</span></p>
                                                        <p>Your share: <span className="font-medium">{formatCurrency(b.amount)}</span></p>
                                                        <p>Paid by: <span className="font-medium">{b.toName}</span></p>
                                                        <div className="mt-2 pt-2 border-t border-gray-100 font-bold text-gray-900">
                                                            Therefore: You need to give {b.toName} {formatCurrency(b.amount)}
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <div key={idx} className="bg-white p-3 rounded border border-gray-200">
                                                        <p className="font-bold text-green-600">Given: {formatCurrency(b.amount)}</p>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </details>
                                )}
                            </div>
                        ))
                    ) : (
                        <div className="p-6 text-center text-gray-500 flex items-center justify-center gap-2">
                            <CheckCircle2 size={20} className="text-green-500" />
                            No pending payments.
                        </div>
                    )}
                    
                    {/* Show recent completed payments from me */}
                    {history.filter(h => h.from_member === user?.memberId).map(h => (
                        <div key={`hist-pay-${h.id}`} className="p-5 flex justify-between items-center opacity-60">
                            <div>
                                <p className="font-medium text-gray-700">You gave {h.to_name}</p>
                                <p className="text-xs text-green-600 mt-1 font-bold flex items-center gap-1">
                                    <CheckCircle2 size={12} /> Given on {formatDate(h.settlement_date)}
                                </p>
                            </div>
                            <div className="font-bold text-gray-700">{formatCurrency(h.amount)}</div>
                        </div>
                    ))}
                </div>
            </div>

            {/* OTHERS NEED TO GIVE YOU */}
            <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden mt-8">
                <div className="p-4 bg-gray-50 border-b border-gray-100 flex items-center gap-2">
                    <HandCoins size={16} className="text-gray-400" />
                    <h3 className="text-xs font-bold uppercase tracking-wider text-gray-500">OTHERS NEED TO GIVE YOU</h3>
                </div>
                <div className="divide-y divide-gray-100">
                    {receivables && receivables.length > 0 ? (
                        receivables.map((r, i) => (
                            <div key={`rec-${i}`} className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden mb-4 last:mb-0">
                                <div className="p-5 flex justify-between items-center">
                                    <div>
                                        <p className="text-lg font-bold text-gray-900">{r.fromName}</p>
                                        <p className="text-sm text-gray-500">Needs to give you</p>
                                    </div>
                                    <div className="text-right flex flex-col items-end gap-2">
                                        <p className="text-2xl font-black text-gray-900">{formatCurrency(r.amount)}</p>
                                        <button 
                                            onClick={() => setConfirmDialog({ from: r.from, to: r.to, amount: r.amount, type: 'receive', name: r.fromName })}
                                            className="text-sm bg-green-600 hover:bg-green-700 text-white font-bold py-1.5 px-3 rounded-lg shadow-sm transition-colors"
                                        >
                                            Mark Received
                                        </button>
                                    </div>
                                </div>
                                {r.breakdown && r.breakdown.length > 0 && (
                                    <details className="text-sm text-gray-600 bg-gray-50 border-t border-gray-100 group">
                                        <summary className="cursor-pointer font-medium text-blue-600 hover:text-blue-800 p-3 transition-colors text-center w-full focus:outline-none">
                                            [ Why? ]
                                        </summary>
                                        <div className="p-4 pt-0 space-y-4">
                                            <h3 className="font-bold text-gray-800 mb-2">WHY {r.fromName.toUpperCase()} NEEDS TO GIVE YOU {formatCurrency(r.amount)}</h3>
                                            {r.breakdown.map((b, idx) => {
                                                const isExpense = b.type === 'EXPENSE';
                                                return isExpense ? (
                                                    <div key={idx} className="bg-white p-3 rounded border border-gray-200 space-y-1">
                                                        <h4 className="font-bold text-gray-900 text-base">{b.title}</h4>
                                                        <p>You paid: <span className="font-medium">{formatCurrency(b.totalItemAmount || 0)}</span></p>
                                                        <p>Participants: <span className="font-medium">{b.participants?.join(', ') || 'Unknown'}</span></p>
                                                        <p>{r.fromName}'s share: <span className="font-medium">{formatCurrency(b.amount)}</span></p>
                                                        <div className="mt-2 pt-2 border-t border-gray-100 font-bold text-gray-900">
                                                            Therefore: {r.fromName} needs to give you {formatCurrency(b.amount)}
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <div key={idx} className="bg-white p-3 rounded border border-gray-200">
                                                        <p className="font-bold text-red-500">Received: {formatCurrency(b.amount)}</p>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </details>
                                )}
                            </div>
                        ))
                    ) : (
                        <div className="p-6 text-center text-gray-500 flex items-center justify-center gap-2">
                            <CheckCircle2 size={20} className="text-green-500" />
                            No pending receipts.
                        </div>
                    )}
                    
                    {/* Show recent completed receipts to me */}
                    {history.filter(h => h.to_member === user?.memberId).map(h => (
                        <div key={`hist-rec-${h.id}`} className="p-5 flex justify-between items-center opacity-60">
                            <div>
                                <p className="font-medium text-gray-700">{h.from_name} gave you</p>
                                <p className="text-xs text-green-600 mt-1 font-bold flex items-center gap-1">
                                    <CheckCircle2 size={12} /> Received on {formatDate(h.settlement_date)}
                                </p>
                            </div>
                            <div className="font-bold text-gray-700">{formatCurrency(h.amount)}</div>
                        </div>
                    ))}
                </div>
            </div>

            {/* CONFIRMATION DIALOG OVERLAY */}
            {confirmDialog && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex justify-center items-center z-50 p-4">
                    <div className="bg-white rounded-3xl p-8 max-w-sm w-full shadow-2xl animate-fadeIn">
                        <h3 className="text-xl font-black text-gray-900 mb-4 text-center">
                            {confirmDialog.type === 'receive' ? 'PAYMENT RECEIVED' : `GIVE TO ${confirmDialog.name.toUpperCase()}`}
                        </h3>
                        
                        {confirmDialog.type === 'receive' ? (
                            <p className="text-gray-700 text-center mb-8 text-lg">
                                Did you receive <span className="font-black text-gray-900">{formatCurrency(confirmDialog.amount)}</span> from <span className="font-black text-gray-900">{confirmDialog.name}</span>?
                            </p>
                        ) : (
                            <p className="text-gray-700 text-center mb-8 text-lg">
                                Are you sure you gave <span className="font-black text-gray-900">{formatCurrency(confirmDialog.amount)}</span> to <span className="font-black text-gray-900">{confirmDialog.name}</span>?
                            </p>
                        )}
                        
                        <div className="space-y-3">
                            <button 
                                onClick={handleConfirmPayment}
                                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded-xl transition-colors shadow-sm"
                            >
                                {confirmDialog.type === 'receive' ? 'Yes, Mark Received' : 'Yes, I Gave It'}
                            </button>
                            <button 
                                onClick={() => setConfirmDialog(null)}
                                className="w-full bg-gray-100 hover:bg-gray-200 text-gray-800 font-bold py-3 px-4 rounded-xl transition-colors"
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* SUCCESS DIALOG FOR RECEIVE */}
            {successDialog && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex justify-center items-center z-50 p-4">
                    <div className="bg-white rounded-3xl p-8 max-w-sm w-full shadow-2xl animate-fadeIn">
                        <div className="flex justify-center mb-4">
                            <CheckCircle2 size={48} className="text-green-500" />
                        </div>
                        <h3 className="text-xl font-black text-gray-900 mb-2 text-center">PAYMENT RECORDED</h3>
                        <p className="text-gray-700 text-center mb-4">
                            ✓ {successDialog.name} gave you {formatCurrency(successDialog.amount)}
                        </p>
                        
                        <div className="space-y-3 border-t border-gray-100 pt-6 mt-6">
                            <p className="text-xs font-bold text-gray-400 text-center uppercase tracking-widest mb-3">Optional</p>
                            <button 
                                onClick={handleAddToPersonalMoney}
                                disabled={addingToPersonal}
                                className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-4 rounded-xl transition-colors shadow-sm disabled:opacity-70 flex justify-center items-center gap-2"
                            >
                                <HandCoins size={18} />
                                {addingToPersonal ? 'Adding...' : `Add ${formatCurrency(successDialog.amount)} to My Money`}
                            </button>
                            <button 
                                onClick={() => setSuccessDialog(null)}
                                className="w-full bg-gray-100 hover:bg-gray-200 text-gray-800 font-bold py-3 px-4 rounded-xl transition-colors"
                            >
                                Done
                            </button>
                        </div>
                    </div>
                </div>
            )}
            
        </div>
    );
};

export default Settlements;
