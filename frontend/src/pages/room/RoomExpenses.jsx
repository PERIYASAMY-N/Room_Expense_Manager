import { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import api from '../../services/api';
import { Plus, X, Trash2 } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const RoomExpenses = () => {
    const { room } = useOutletContext();
    const { user } = useAuth();
    const [expenses, setExpenses] = useState([]);
    const [members, setMembers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    
    // Form State
    const [title, setTitle] = useState('');
    const [category, setCategory] = useState('Food');
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
    const [description, setDescription] = useState('');
    const [paidBy, setPaidBy] = useState(''); // user.id by default
    const [selectedParticipants, setSelectedParticipants] = useState([]);
    const [items, setItems] = useState([{ name: '', amount: '' }]);

    const categories = ['Food', 'Groceries', 'Utilities', 'Rent', 'Travel', 'Entertainment', 'Other'];

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

    const handleAddItem = () => {
        setItems([...items, { name: '', amount: '' }]);
    };

    const handleRemoveItem = (index) => {
        if (items.length > 1) {
            const newItems = [...items];
            newItems.splice(index, 1);
            setItems(newItems);
        }
    };

    const handleItemChange = (index, field, value) => {
        const newItems = [...items];
        newItems[index][field] = value;
        setItems(newItems);
    };

    const calculateTotal = () => {
        return items.reduce((sum, item) => sum + (parseFloat(item.amount) || 0), 0);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        const totalAmount = calculateTotal();
        
        if (!title || totalAmount <= 0 || !paidBy || selectedParticipants.length === 0) {
            return alert('Please fill required fields, add valid items, and select at least one participant');
        }

        // Validate items
        const validItems = items.filter(i => i.name.trim() !== '' && parseFloat(i.amount) > 0);
        if (validItems.length === 0) {
            return alert('Please provide at least one valid item.');
        }

        const payload = {
            title,
            category,
            expenseDate: date,
            description,
            payers: [{ userId: paidBy, amount: totalAmount }],
            participants: selectedParticipants,
            items: validItems
        };

        try {
            await api.post(`/rooms/${room.id}/expenses`, payload);
            setIsModalOpen(false);
            
            // Reset form
            setTitle('');
            setCategory('Food');
            setDescription('');
            setItems([{ name: '', amount: '' }]);
            
            fetchData();
        } catch (err) {
            alert(err.response?.data?.message || 'Error saving expense');
        }
    };

    if (loading) return <div className="text-center py-10 text-gray-500">Loading Expenses...</div>;

    const activeMembers = members.filter(m => m.is_active);

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-900 uppercase">Room Expenses</h2>
                <button
                    onClick={() => setIsModalOpen(true)}
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors flex items-center shadow-sm"
                >
                    <Plus className="h-5 w-5 mr-1" /> Add Expense
                </button>
            </div>

            <div className="space-y-4">
                {expenses.length > 0 ? (
                    expenses.map((expense) => {
                        const myShare = expense.participants?.find(p => p.full_name === user.fullName)?.amount_owed || 0;
                        const participantNames = expense.participants?.map(p => p.full_name).join(' · ') || 'None';

                        return (
                            <div key={expense.id} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                                <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-1">
                                        <span className="bg-gray-100 text-gray-700 px-2 py-0.5 rounded text-xs font-semibold uppercase tracking-wider">{expense.category}</span>
                                        <span className="text-sm text-gray-500">{new Date(expense.expense_date).toLocaleDateString()}</span>
                                    </div>
                                    <h3 className="text-xl font-bold text-gray-900 uppercase mb-2">{expense.title}</h3>
                                    
                                    <p className="text-sm text-gray-600 mb-1">
                                        <span className="font-semibold text-gray-900">{expense.creator_name} paid</span> ₹{parseFloat(expense.total_amount).toFixed(2)}
                                    </p>
                                    <p className="text-sm text-gray-500">
                                        Used by: <span className="font-medium text-gray-700">{participantNames}</span>
                                    </p>
                                </div>
                                <div className="md:text-right bg-gray-50 p-4 rounded-lg min-w-[150px] border border-gray-100">
                                    <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Your Share</p>
                                    <p className="text-2xl font-black text-blue-600">₹{parseFloat(myShare).toFixed(2)}</p>
                                </div>
                            </div>
                        );
                    })
                ) : (
                    <div className="p-8 text-center text-gray-500 bg-white rounded-xl shadow-sm border border-gray-200">
                        No shared expenses yet.
                    </div>
                )}
            </div>

            {/* Add Expense Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 overflow-y-auto">
                    <div className="bg-white rounded-xl shadow-xl max-w-xl w-full overflow-hidden my-8">
                        <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center sticky top-0 bg-white z-10">
                            <h3 className="text-lg font-bold text-gray-900 uppercase tracking-wider">Add Room Expense</h3>
                            <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-500">
                                <X className="h-6 w-6" />
                            </button>
                        </div>
                        <div className="p-6 overflow-y-auto max-h-[70vh]">
                            <form onSubmit={handleSubmit} className="space-y-6">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="col-span-2 md:col-span-1">
                                        <label className="block text-sm font-bold text-gray-700 mb-1">Expense Title</label>
                                        <input type="text" required value={title} onChange={e => setTitle(e.target.value)} className="w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:ring-blue-500 focus:border-blue-500 sm:text-sm" placeholder="e.g. Weekly Groceries" />
                                    </div>
                                    <div className="col-span-2 md:col-span-1">
                                        <label className="block text-sm font-bold text-gray-700 mb-1">Category</label>
                                        <select value={category} onChange={e => setCategory(e.target.value)} className="w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:ring-blue-500 focus:border-blue-500 sm:text-sm">
                                            {categories.map(c => <option key={c} value={c}>{c}</option>)}
                                        </select>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-bold text-gray-700 mb-1">Paid By</label>
                                        <select value={paidBy} onChange={e => setPaidBy(parseInt(e.target.value))} className="w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:ring-blue-500 focus:border-blue-500 sm:text-sm">
                                            {activeMembers.map(m => (
                                                <option key={m.user_id} value={m.user_id}>{m.full_name} {m.user_id === user.id ? '(You)' : ''}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-bold text-gray-700 mb-1">Date</label>
                                        <input type="date" required value={date} onChange={e => setDate(e.target.value)} className="w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:ring-blue-500 focus:border-blue-500 sm:text-sm" />
                                    </div>
                                </div>

                                {/* Dynamic Items Section */}
                                <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                                    <label className="block text-sm font-bold text-gray-900 mb-3 uppercase tracking-wider">Items</label>
                                    <div className="space-y-3">
                                        {items.map((item, index) => (
                                            <div key={index} className="flex gap-2 items-center">
                                                <input 
                                                    type="text" 
                                                    placeholder="Item name (e.g. Tomato)" 
                                                    required 
                                                    value={item.name} 
                                                    onChange={e => handleItemChange(index, 'name', e.target.value)} 
                                                    className="flex-1 border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:ring-blue-500 focus:border-blue-500 sm:text-sm" 
                                                />
                                                <div className="relative w-32">
                                                    <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-500 sm:text-sm">₹</span>
                                                    <input 
                                                        type="number" 
                                                        step="0.01" 
                                                        min="0"
                                                        required 
                                                        value={item.amount} 
                                                        onChange={e => handleItemChange(index, 'amount', e.target.value)} 
                                                        className="w-full border border-gray-300 rounded-md shadow-sm py-2 pl-7 pr-3 focus:ring-blue-500 focus:border-blue-500 sm:text-sm" 
                                                        placeholder="0.00"
                                                    />
                                                </div>
                                                <button type="button" onClick={() => handleRemoveItem(index)} disabled={items.length === 1} className="p-2 text-gray-400 hover:text-red-500 disabled:opacity-50 transition-colors">
                                                    <Trash2 className="h-5 w-5" />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                    <button type="button" onClick={handleAddItem} className="mt-3 text-sm font-medium text-blue-600 hover:text-blue-800 flex items-center">
                                        <Plus className="h-4 w-4 mr-1" /> Add another item
                                    </button>
                                    
                                    <div className="mt-4 pt-4 border-t border-gray-200 flex justify-between items-center">
                                        <span className="font-bold text-gray-700 uppercase">Total Amount</span>
                                        <span className="text-xl font-black text-gray-900">₹{calculateTotal().toFixed(2)}</span>
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-2">Used By (Participants)</label>
                                    <div className="space-y-2 border border-gray-200 rounded-md p-3 max-h-40 overflow-y-auto bg-white">
                                        {activeMembers.map(m => (
                                            <label key={m.user_id} className="flex items-center p-1 hover:bg-gray-50 rounded">
                                                <input 
                                                    type="checkbox" 
                                                    checked={selectedParticipants.includes(m.user_id)}
                                                    onChange={() => handleToggleParticipant(m.user_id)}
                                                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded" 
                                                />
                                                <span className="ml-3 text-sm font-medium text-gray-700">{m.full_name} {m.user_id === user.id ? '(You)' : ''}</span>
                                            </label>
                                        ))}
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-1">Note (Optional)</label>
                                    <textarea value={description} onChange={e => setDescription(e.target.value)} rows="2" className="w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"></textarea>
                                </div>

                                <div className="pt-4 flex justify-end gap-3 sticky bottom-0 bg-white">
                                    <button type="button" onClick={() => setIsModalOpen(false)} className="px-6 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50">
                                        Cancel
                                    </button>
                                    <button type="submit" className="px-6 py-2 border border-transparent shadow-sm text-sm font-medium rounded-lg text-white bg-blue-600 hover:bg-blue-700">
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
