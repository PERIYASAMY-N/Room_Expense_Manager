import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { dashboardService, personalMoneyService } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { Plus } from 'lucide-react';
import { formatCurrency, formatDate } from '../utils/formatters';

const Dashboard = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [mySummary, setMySummary] = useState(null);
    const [roomSummary, setRoomSummary] = useState(null);
    const [personalSummary, setPersonalSummary] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchDashboardData = async () => {
            setLoading(true);
            try {
                const [myRes, roomRes, personalRes] = await Promise.all([
                    dashboardService.getMySummary(),
                    dashboardService.getRoomSummary(),
                    personalMoneyService.getSummary()
                ]);
                setMySummary(myRes.data.data);
                setRoomSummary(roomRes.data.data);
                setPersonalSummary(personalRes.data.data);
            } catch (err) {
                setError('Failed to fetch dashboard data');
            } finally {
                setLoading(false);
            }
        };
        fetchDashboardData();
    }, []);

    if (loading) {
        return <div className="p-8 flex justify-center text-gray-500">Loading your dashboard...</div>;
    }
    
    if (error) {
        return (
            <div className="p-8 text-center">
                <p className="text-red-500 mb-4">{error}</p>
                <button onClick={() => window.location.reload()} className="bg-blue-600 text-white px-4 py-2 rounded-lg font-bold">Retry</button>
            </div>
        );
    }

    if (!roomSummary || !mySummary) {
        return <div className="p-8 text-center text-gray-500">No data available.</div>;
    }

    const { roomInfo, activeMembers, recommendedSettlements, recentExpenses } = roomSummary;
    const { netBalance, payables, receivables } = mySummary;
    const personalBalance = personalSummary ? personalSummary.netBalance : 0;

    const totalToPay = (payables || []).reduce((acc, p) => acc + p.amount, 0);
    const totalToReceive = (receivables || []).reduce((acc, r) => acc + r.amount, 0);

    return (
        <div className="p-4 md:p-6 max-w-3xl mx-auto space-y-8 pb-24 relative">
            
            {/* Header / Room Details */}
            <div className="text-center pb-4 border-b border-gray-200">
                <h1 className="text-2xl font-bold tracking-tight text-gray-900 uppercase">
                    ROOM MONEY
                </h1>
                <p className="text-gray-500 text-sm mt-1">{roomInfo.room_name} · {activeMembers} Members</p>
            </div>

            {/* 1. YOUR ROOM POSITION */}
            <div className="text-center py-4">
                <h2 className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-4">YOUR ROOM POSITION</h2>
                {netBalance > 0.01 ? (
                    <div className="space-y-2">
                        <p className="text-lg font-bold text-gray-700 uppercase">You will receive</p>
                        <p className="text-5xl font-black text-green-500">{formatCurrency(Math.abs(netBalance))}</p>
                    </div>
                ) : netBalance < -0.01 ? (
                    <div className="space-y-2">
                        <p className="text-lg font-bold text-gray-700 uppercase">You need to give</p>
                        <p className="text-5xl font-black text-red-500">{formatCurrency(Math.abs(netBalance))}</p>
                    </div>
                ) : (
                    <div className="space-y-2">
                        <p className="text-lg font-bold text-gray-700 uppercase">You are settled</p>
                        <p className="text-5xl font-black text-gray-900">{formatCurrency(0)}</p>
                    </div>
                )}
            </div>

            <hr className="border-gray-200" />

            {/* 2. YOU NEED TO GIVE */}
            <div className="space-y-4">
                <h2 className="text-sm font-bold tracking-widest text-gray-400 uppercase">YOU NEED TO GIVE</h2>
                {payables && payables.length > 0 ? (                    <div className="space-y-4">
                        {payables.map((p, i) => (
                            <div key={i} className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                                <div className="p-5 flex justify-between items-center">
                                    <div>
                                        <p className="text-lg font-bold text-gray-900">{p.toName}</p>
                                        <p className="text-sm text-gray-500">You need to give</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-2xl font-black text-gray-900 mb-2">{formatCurrency(p.amount)}</p>
                                        <Link to="/dashboard/settlements" state={{ from: p.from, to: p.to, amount: p.amount }} className="inline-block bg-gray-100 hover:bg-gray-200 text-gray-800 text-sm font-bold py-1.5 px-3 rounded-lg transition-colors">
                                            Give
                                        </Link>
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
                        ))}
                    </div>
                ) : (
                    <div className="text-gray-500">✓ You don't need to give anyone right now.</div>
                )}
            </div>

            <hr className="border-gray-200" />

            {/* 3. OTHERS NEED TO GIVE YOU */}
            <div className="space-y-4">
                <h2 className="text-sm font-bold tracking-widest text-gray-400 uppercase">OTHERS NEED TO GIVE YOU</h2>
                {receivables && receivables.length > 0 ? (
                    <div className="space-y-4">
                        {receivables.map((r, i) => (
                            <div key={i} className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                                <div className="p-5 flex justify-between items-center">
                                    <div>
                                        <p className="text-lg font-bold text-gray-900">{r.fromName}</p>
                                        <p className="text-sm text-gray-500">Needs to give you</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-2xl font-black text-gray-900">{formatCurrency(r.amount)}</p>
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
                                                        <p className="font-bold text-red-500">Payment received: {formatCurrency(b.amount)}</p>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </details>
                                )}
                            </div>
                        ))}
                        <div className="pt-2 text-right">
                            <p className="text-sm font-bold text-gray-500 uppercase tracking-widest">TOTAL OTHERS NEED TO GIVE YOU</p>
                            <p className="text-xl font-black text-gray-900">{formatCurrency(totalToReceive)}</p>
                        </div>
                    </div>
                ) : (
                    <div className="text-gray-500">No pending payments right now.</div>
                )}
            </div>

            <hr className="border-gray-200" />

            {/* 4. YOUR FINAL ROOM POSITION */}
            <div className="space-y-4">
                <h2 className="text-sm font-bold tracking-widest text-gray-400 uppercase">YOUR FINAL ROOM POSITION</h2>
                <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm space-y-4">
                    <div className="flex justify-between items-center text-gray-700">
                        <span>Others need to give you:</span>
                        <span className="font-bold">{formatCurrency(totalToReceive)}</span>
                    </div>
                    <div className="flex justify-between items-center text-gray-700">
                        <span>You need to give others:</span>
                        <span className="font-bold">{formatCurrency(totalToPay)}</span>
                    </div>
                    <div className="border-t border-gray-200 pt-4">
                        <p className="text-sm text-gray-500 mb-1">Therefore:</p>
                        {netBalance > 0.01 ? (
                            <p className="text-lg font-bold text-gray-900">
                                YOU WILL RECEIVE {formatCurrency(Math.abs(netBalance))}
                            </p>
                        ) : netBalance < -0.01 ? (
                            <p className="text-lg font-bold text-gray-900">
                                YOU NEED TO GIVE {formatCurrency(Math.abs(netBalance))}
                            </p>
                        ) : (
                            <p className="text-lg font-bold text-gray-900">
                                YOU ARE SETTLED ✓
                            </p>
                        )}
                        <p className="text-sm text-gray-500 mt-2">
                            After offsetting your room payments, you will {netBalance > 0 ? 'receive' : netBalance < 0 ? 'need to give' : 'be settled at'} {formatCurrency(Math.abs(netBalance))}.
                        </p>
                    </div>
                </div>
            </div>

            <hr className="border-gray-200" />

            {/* 5. ROOM SETTLEMENTS */}
            <div className="space-y-4">
                <div className="text-center py-2">
                    <h2 className="text-sm font-bold tracking-widest text-gray-400 uppercase">WHO GIVES WHOM</h2>
                </div>
                {recommendedSettlements && recommendedSettlements.length > 0 ? (
                    <div className="flex flex-col space-y-4">
                        {recommendedSettlements.map((s, i) => (
                            <div 
                                key={i} 
                                className="bg-white rounded-2xl border border-gray-200 shadow-sm settlement-card group relative overflow-hidden transition-all duration-300 hover:-translate-y-1 hover:shadow-md" 
                                style={{ animationDelay: `${i * 100}ms` }}
                            >
                                <div className="p-4 md:p-6 flex flex-col relative">
                                    <div className="flex justify-between items-end w-full">
                                        {/* Sender */}
                                        <div className="flex flex-col items-center gap-2 w-1/4">
                                            <span className="font-bold text-gray-900 uppercase tracking-wide text-sm md:text-base text-center break-words">{s.fromName}</span>
                                            <div className="w-10 h-10 rounded-full bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 text-lg shadow-sm">
                                                👤
                                            </div>
                                            <div className="h-4 border-l-2 border-gray-200"></div>
                                        </div>

                                        {/* Flow Line & Amount */}
                                        <div className="flex-1 flex flex-col items-center justify-end pb-[1px]">
                                            <div className="w-full relative flex items-center justify-end overflow-hidden py-4">
                                                {/* The Line */}
                                                <div className="w-full border-t-[3px] border-gray-200"></div>
                                                
                                                {/* The Moving Money */}
                                                <div 
                                                    className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 text-2xl animate-money-flow drop-shadow-[0_0_8px_rgba(250,204,21,0.6)]"
                                                    style={{ animationDelay: `${i * 0.4}s` }}
                                                >
                                                    💰
                                                </div>

                                                {/* The Arrow */}
                                                <div className="absolute right-0 bg-white pl-2 text-gray-300 group-hover:text-blue-500 transition-colors font-black text-2xl leading-none">
                                                    →
                                                </div>
                                            </div>
                                            
                                            {/* Stationary Amount Below Line */}
                                            <div className="font-black text-xl md:text-2xl text-gray-900 group-hover:scale-110 transition-transform duration-300 group-hover:text-blue-600 mt-1">
                                                {formatCurrency(s.amount)}
                                            </div>
                                            
                                            {/* Subtitle text */}
                                            <div className="text-xs font-bold text-gray-400 uppercase tracking-wider mt-2 group-hover:text-blue-500 transition-colors">
                                                {s.fromName} gives {s.toName}
                                            </div>
                                        </div>

                                        {/* Receiver */}
                                        <div className="flex flex-col items-center gap-2 w-1/4">
                                            <span className="font-bold text-gray-900 uppercase tracking-wide text-sm md:text-base text-center break-words">{s.toName}</span>
                                            <div className="w-10 h-10 rounded-full bg-green-50 border border-green-100 flex items-center justify-center text-green-600 text-lg shadow-sm">
                                                👤
                                            </div>
                                            <div className="h-4 border-l-2 border-gray-200"></div>
                                        </div>
                                    </div>
                                </div>

                                {s.breakdown && s.breakdown.length > 0 && (
                                    <details className="text-sm text-gray-600 bg-gray-50 border-t border-gray-100">
                                        <summary className="cursor-pointer font-bold text-blue-600 hover:text-blue-800 p-3 transition-colors text-center w-full focus:outline-none bg-gray-50 hover:bg-gray-100 tracking-wide">
                                            [ Why? ]
                                        </summary>
                                        <div className="p-5 pt-2 space-y-4">
                                            <h3 className="font-bold text-gray-800 mb-3 text-center uppercase tracking-wide border-b border-gray-200 pb-2">
                                                {s.fromName.toUpperCase()} → {s.toName.toUpperCase()} {formatCurrency(s.amount)}
                                            </h3>
                                            {s.breakdown.map((b, idx) => {
                                                const isExpense = b.type === 'EXPENSE';
                                                return isExpense ? (
                                                    <div key={idx} className="bg-white p-4 rounded-xl border border-gray-200 flex justify-between items-center shadow-sm">
                                                        <div>
                                                            <h4 className="font-bold text-gray-900 text-base">{b.title}</h4>
                                                        </div>
                                                        <div className="font-black text-gray-900 text-lg">
                                                            {formatCurrency(b.amount)}
                                                        </div>
                                                    </div>
                                                ) : null;
                                            })}
                                            <div className="mt-4 pt-4 border-t-2 border-gray-200 flex justify-between items-center px-2">
                                                <span className="font-bold text-gray-500 uppercase tracking-widest">Total</span>
                                                <span className="font-black text-gray-900 text-xl">{formatCurrency(s.amount)}</span>
                                            </div>
                                        </div>
                                    </details>
                                )}
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="text-gray-500 text-center py-8">ROOM SETTLED ✓ Everyone is up to date.</div>
                )}
            </div>

            <hr className="border-gray-200" />

            {/* 6. RECENT ROOM EXPENSES */}
            <div className="space-y-4">
                <h2 className="text-sm font-bold tracking-widest text-gray-400 uppercase">RECENT ROOM EXPENSES</h2>
                {recentExpenses && recentExpenses.length > 0 ? (
                    <div className="space-y-4">
                        {recentExpenses.map((e, i) => (
                            <div key={i} className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
                                <div className="flex justify-between items-start mb-3">
                                    <div>
                                        <h3 className="text-lg font-bold text-gray-900">{e.category}</h3>
                                        <p className="text-sm text-gray-500">{formatDate(e.expense_date)}</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-xl font-black text-gray-900">{formatCurrency(e.total_amount)}</p>
                                        <p className="text-sm font-bold text-gray-700 mt-1">{e.payer_names || 'Someone'} paid</p>
                                    </div>
                                </div>
                                <div className="space-y-1 text-sm text-gray-600 mt-4 border-t border-gray-100 pt-3">
                                    <p>Used by: <span className="font-medium">{e.participants_names || 'Unknown'}</span></p>
                                    {e.my_share > 0 && (
                                        <p>Your share: <span className="font-bold text-gray-900">{formatCurrency(e.my_share)}</span></p>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="text-gray-500">No recent expenses.</div>
                )}
            </div>

            <hr className="border-gray-200" />

            {/* 7. ROOM OVERVIEW */}
            <div className="space-y-4">
                <h2 className="text-sm font-bold tracking-widest text-gray-400 uppercase">ROOM OVERVIEW</h2>
                <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden overflow-x-auto">
                    <table className="min-w-full text-sm text-left">
                        <thead className="bg-gray-50 border-b border-gray-200 text-gray-500 font-bold uppercase tracking-wider">
                            <tr>
                                <th className="px-4 py-3">Member</th>
                                <th className="px-4 py-3 text-right">Paid</th>
                                <th className="px-4 py-3 text-right">Used</th>
                                <th className="px-4 py-3">Position</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {roomSummary?.balances?.map((b, i) => (
                                <tr key={i} className="hover:bg-gray-50">
                                    <td className="px-4 py-3 font-medium text-gray-900">{b.name}</td>
                                    <td className="px-4 py-3 text-right text-gray-600">{formatCurrency(b.totalPaid)}</td>
                                    <td className="px-4 py-3 text-right text-gray-600">{formatCurrency(b.totalShare)}</td>
                                    <td className="px-4 py-3 font-bold">
                                        {b.balance > 0 ? (
                                            <span className="text-green-600">Gets {formatCurrency(b.balance)}</span>
                                        ) : b.balance < 0 ? (
                                            <span className="text-red-500">Needs to give {formatCurrency(Math.abs(b.balance))}</span>
                                        ) : (
                                            <span className="text-gray-400">Settled</span>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* 8. MY MONEY */}
            <div className="mt-12 bg-gray-50 border border-gray-200 rounded-2xl p-6 text-center">
                <h2 className="text-lg font-bold text-gray-900 mb-2">MY MONEY</h2>
                <p className="text-sm text-gray-600 mb-4">Manage your own personal money separately.</p>
                <Link to="/dashboard/my-money" className="inline-block bg-white border border-gray-300 hover:bg-gray-100 text-gray-800 font-bold py-2 px-6 rounded-lg transition-colors shadow-sm">
                    Open My Money
                </Link>
            </div>

            {/* FLOATING ACTION BUTTON FOR MOBILE ADD EXPENSE */}
            <Link 
                to="/dashboard/expenses/add" 
                className="fixed bottom-6 right-6 md:hidden bg-blue-600 text-white p-4 rounded-full shadow-lg hover:bg-blue-700 active:scale-95 transition-all z-10"
            >
                <Plus size={24} />
            </Link>

        </div>
    );
};

export default Dashboard;
