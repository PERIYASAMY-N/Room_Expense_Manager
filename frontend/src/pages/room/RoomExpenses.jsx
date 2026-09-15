import { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import api from '../../services/api';
import { Plus, X } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const RoomExpenses = () => {
    const { room } = useOutletContext();
    const { user } = useAuth();
    const [expenses, setExpenses] = useState([]);
    const [members, setMembers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    
    // Simple Equal Split Form State
    const [title, setTitle] = useState('');
    const [amount, setAmount] = useState('');
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
    const [description, setDescription] = useState('');
    const [paidBy, setPaidBy] = useState(''); // user.id by default
    const [selectedParticipants, setSelectedParticipants] = useState([]);

    useEffect(() => {
        setPaidBy(user.id);
        fetchData();
    }, [room.id, user.id]);

    const fetchData = async () => {
        try {
            const [expRes, memRes] = await Promise.all([
                api.get(`/rooms/${room.id}/expenses`),
                api.get(`/rooms/${room.id}/members`)
            ]);
            setExpenses(expRes.data);
            setMembers(memRes.data);
            // Default select all active members
            setSelectedParticipants(memRes.data.filter(m => m.is_active).map(m => m.user_id));
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleToggleParticipant = (userId) => {
        if (selectedParticipants.includes(userId)) {
            setSelectedParticipants(prev => prev.filter(id => id !== userId));
        } else {
            setSelectedParticipants(prev => [...prev, userId]);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (!title || !amount || !paidBy || selectedParticipants.length === 0) {
            return alert('Please fill required fields and select at least one participant');
        }

        const payload = {
            title,
            totalAmount: amount,
            expenseDate: date,
            description,
            payers: [{ userId: paidBy, amount: parseFloat(amount) }],
            participants: selectedParticipants
        };

        try {
            await api.post(`/rooms/${room.id}/expenses`, payload);
            setIsModalOpen(false);
            
            // Reset form
            setTitle('');
            setAmount('');
            setDescription('');
            
            fetchData();
        } catch (err) {
            alert(err.response?.data?.message || 'Error saving expense');
        }
    };

    if (loading) return <div className="text-center py-10">Loading Expenses...</div>;

    const activeMembers = members.filter(m => m.is_active);

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-900">Room Expenses</h2>
                <button
                    onClick={() => setIsModalOpen(true)}
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors flex items-center"
                >
                    <Plus className="h-5 w-5 mr-1" /> Add Shared Expense
                </button>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                {expenses.length > 0 ? (
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Details</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Added By</th>
                                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Total Amount</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {expenses.map((expense) => (
                                    <tr key={expense.id} className="hover:bg-gray-50">
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            {new Date(expense.expense_date).toLocaleDateString()}
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="text-sm font-medium text-gray-900">{expense.title}</div>
                                            {expense.description && <div className="text-xs text-gray-500">{expense.description}</div>}
                                            <div className="text-xs text-blue-600 mt-1">Split: {expense.split_method}</div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                                            {expense.creator_name}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-bold text-gray-900">
                                            ₹{parseFloat(expense.total_amount).toFixed(2)}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <div className="p-8 text-center text-gray-500">
                        No shared expenses yet.
                    </div>
                )}
            </div>

            {/* Add Expense Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 overflow-y-auto">
                    <div className="bg-white rounded-xl shadow-xl max-w-lg w-full overflow-hidden my-8">
                        <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center sticky top-0 bg-white">
                            <h3 className="text-lg font-bold text-gray-900">Add Shared Expense</h3>
                            <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-500">
                                <X className="h-5 w-5" />
                            </button>
                        </div>
                        <div className="p-6">
                            <form onSubmit={handleSubmit} className="space-y-5">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                                    <input type="text" required value={title} onChange={e => setTitle(e.target.value)} className="w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:ring-blue-500 focus:border-blue-500 sm:text-sm" placeholder="e.g. Dinner at Paradise" />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Amount (₹)</label>
                                        <input type="number" step="0.01" required value={amount} onChange={e => setAmount(e.target.value)} className="w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:ring-blue-500 focus:border-blue-500 sm:text-sm" />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
                                        <input type="date" required value={date} onChange={e => setDate(e.target.value)} className="w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:ring-blue-500 focus:border-blue-500 sm:text-sm" />
                                    </div>
                                </div>
                                
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Who Paid?</label>
                                    <select value={paidBy} onChange={e => setPaidBy(parseInt(e.target.value))} className="w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:ring-blue-500 focus:border-blue-500 sm:text-sm">
                                        {activeMembers.map(m => (
                                            <option key={m.user_id} value={m.user_id}>{m.full_name} {m.user_id === user.id ? '(You)' : ''}</option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Split Equally Among</label>
                                    <div className="space-y-2 border border-gray-200 rounded-md p-3 max-h-40 overflow-y-auto">
                                        {activeMembers.map(m => (
                                            <label key={m.user_id} className="flex items-center">
                                                <input 
                                                    type="checkbox" 
                                                    checked={selectedParticipants.includes(m.user_id)}
                                                    onChange={() => handleToggleParticipant(m.user_id)}
                                                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded" 
                                                />
                                                <span className="ml-2 text-sm text-gray-700">{m.full_name} {m.user_id === user.id ? '(You)' : ''}</span>
                                            </label>
                                        ))}
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Description (Optional)</label>
                                    <textarea value={description} onChange={e => setDescription(e.target.value)} rows="2" className="w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"></textarea>
                                </div>

                                <div className="pt-2 flex justify-end gap-3">
                                    <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50">
                                        Cancel
                                    </button>
                                    <button type="submit" className="px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700">
                                        Save Expense
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default RoomExpenses;
