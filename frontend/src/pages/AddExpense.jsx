import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { memberService, expenseService } from '../services/api';
import { ArrowLeft, CheckCircle2, Plus, Trash2 } from 'lucide-react';
import { format } from 'date-fns';
import { formatCurrency } from '../utils/formatters';

const AddExpense = () => {
    const navigate = useNavigate();
    const { id } = useParams();
    const isEditMode = !!id;

    const [members, setMembers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    
    // For the success screen
    const [successData, setSuccessData] = useState(null);

    const [formData, setFormData] = useState({
        title: '',
        date: format(new Date(), 'yyyy-MM-dd'),
        note: '',
        items: [
            { id: Date.now(), name: '', amount: '', paidBy: '', participants: [] }
        ]
    });

    useEffect(() => {
        const fetchData = async () => {
            try {
                const membersRes = await memberService.getAll();
                setMembers(membersRes.data.data);

                if (isEditMode) {
                    const expenseRes = await expenseService.getById(id);
                    const exp = expenseRes.data.data;
                    
                    const mappedItems = exp.items.map(item => ({
                        id: item.id,
                        name: item.item_name,
                        amount: item.amount.toString(),
                        paidBy: item.paid_by.toString(),
                        participants: item.participants.map(p => p.member_id)
                    }));

                    setFormData({
                        title: exp.title,
                        date: format(new Date(exp.expense_date), 'yyyy-MM-dd'),
                        note: exp.note || '',
                        items: mappedItems.length > 0 ? mappedItems : [{ id: Date.now(), name: '', amount: '', paidBy: '', participants: [] }]
                    });
                }
            } catch (error) {
                console.error('Error fetching data', error);
                alert('Error loading data');
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [id, isEditMode]);

    const handleItemChange = (itemId, field, value) => {
        const updatedItems = formData.items.map(item => {
            if (item.id === itemId) {
                return { ...item, [field]: value };
            }
            return item;
        });
        setFormData({ ...formData, items: updatedItems });
    };

    const toggleItemParticipant = (itemId, memberId) => {
        const updatedItems = formData.items.map(item => {
            if (item.id === itemId) {
                const participants = [...item.participants];
                const index = participants.indexOf(memberId);
                if (index > -1) {
                    participants.splice(index, 1);
                } else {
                    participants.push(memberId);
                }
                return { ...item, participants };
            }
            return item;
        });
        setFormData({ ...formData, items: updatedItems });
    };

    const addItem = () => {
        setFormData({
            ...formData,
            items: [...formData.items, { id: Date.now(), name: '', amount: '', paidBy: '', participants: [] }]
        });
    };

    const removeItem = (itemId) => {
        if (formData.items.length === 1) return; // Must have at least one item
        setFormData({
            ...formData,
            items: formData.items.filter(item => item.id !== itemId)
        });
    };

    const selectAllParticipants = (itemId) => {
        const updatedItems = formData.items.map(item => {
            if (item.id === itemId) {
                return { ...item, participants: members.map(m => m.id) };
            }
            return item;
        });
        setFormData({ ...formData, items: updatedItems });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (!formData.title.trim()) return alert('Please enter a title for this expense (e.g. Monthly Shopping).');
        
        // Validate all items
        for (let i = 0; i < formData.items.length; i++) {
            const item = formData.items[i];
            if (!item.name.trim()) return alert(`Item ${i+1}: Please enter an item name.`);
            if (!item.amount || parseFloat(item.amount) <= 0) return alert(`Item ${i+1}: Please enter a valid amount.`);
            if (!item.paidBy) return alert(`Item ${i+1}: Please select who paid.`);
            if (item.participants.length === 0) return alert(`Item ${i+1}: Please select who used it.`);
        }

        setSaving(true);
        try {
            const payload = {
                title: formData.title.trim(),
                date: formData.date,
                note: formData.note.trim(),
                items: formData.items.map(item => ({
                    name: item.name.trim(),
                    amount: parseFloat(item.amount),
                    paidBy: parseInt(item.paidBy),
                    participants: item.participants
                }))
            };

            let expenseId;
            if (isEditMode) {
                await expenseService.update(id, payload);
                expenseId = id;
            } else {
                const res = await expenseService.create(payload);
                expenseId = res.data.data.id;
            }
            
            // For the success screen, calculate total
            const totalAmt = payload.items.reduce((sum, item) => sum + item.amount, 0);
            
            setSuccessData({
                title: payload.title,
                total: totalAmt,
                itemsCount: payload.items.length
            });

        } catch (error) {
            console.error('Error saving expense', error);
            alert(error.response?.data?.message || 'Failed to save expense. Please try again.');
        } finally {
            setSaving(false);
        }
    };

    if (loading) return <div className="p-8 text-center text-gray-500">Loading...</div>;

    if (successData) {
        return (
            <div className="max-w-xl mx-auto space-y-6 mt-8 animate-fadeIn">
                <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-8 text-center">
                    <div className="flex justify-center mb-4">
                        <CheckCircle2 size={64} className="text-green-500" />
                    </div>
                    <h2 className="text-2xl font-black text-gray-900 mb-6">Expense Saved ✓</h2>
                    
                    <p className="text-lg text-gray-700 mb-6">
                        Successfully saved <span className="font-bold text-gray-900">{successData.title}</span><br/>
                        Total: <span className="font-bold text-gray-900">{formatCurrency(successData.total)}</span> across {successData.itemsCount} items.
                    </p>

                    <button onClick={() => navigate('/dashboard/expenses')} className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 rounded-xl transition-colors">
                        Done
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-2xl mx-auto space-y-6">
            <div className="flex items-center gap-4">
                <Link to="/dashboard/expenses" className="text-gray-400 hover:text-gray-900 transition-colors bg-white p-2 rounded-full shadow-sm border border-gray-100">
                    <ArrowLeft size={20} />
                </Link>
                <h1 className="text-2xl font-black text-gray-900">{isEditMode ? 'Edit Expense' : 'Add Expense'}</h1>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
                
                {/* Global Expense Info */}
                <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden p-6 md:p-8 space-y-4">
                    <h2 className="text-sm font-bold uppercase tracking-widest text-blue-600">Overview</h2>
                    <input 
                        type="text" 
                        placeholder="Expense Title (e.g. Monthly Shopping)" 
                        value={formData.title} 
                        onChange={e => setFormData({...formData, title: e.target.value})} 
                        className="w-full border-b-2 border-gray-200 focus:border-blue-600 outline-none px-0 py-3 text-2xl font-bold bg-transparent transition-colors placeholder-gray-300 text-gray-900" 
                    />
                    <input 
                        type="date" 
                        value={formData.date} 
                        onChange={e => setFormData({...formData, date: e.target.value})} 
                        className="w-full border-b-2 border-gray-200 focus:border-blue-600 outline-none px-0 py-3 text-gray-700 bg-transparent transition-colors" 
                    />
                </div>

                {/* Items Container */}
                <div className="space-y-6">
                    {formData.items.map((item, index) => (
                        <div key={item.id} className="bg-white rounded-3xl shadow-sm border border-gray-200 overflow-hidden p-6 md:p-8 space-y-6 relative">
                            <div className="flex justify-between items-center">
                                <h3 className="text-sm font-bold uppercase tracking-widest text-gray-500">Item {index + 1}</h3>
                                {formData.items.length > 1 && (
                                    <button type="button" onClick={() => removeItem(item.id)} className="text-red-400 hover:text-red-600 transition-colors">
                                        <Trash2 size={18} />
                                    </button>
                                )}
                            </div>

                            {/* Item Name and Amount */}
                            <div className="flex gap-4">
                                <div className="flex-1">
                                    <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Item Name</label>
                                    <input 
                                        type="text" 
                                        placeholder="e.g. Milk" 
                                        value={item.name} 
                                        onChange={e => handleItemChange(item.id, 'name', e.target.value)} 
                                        className="w-full border-b-2 border-gray-200 focus:border-blue-600 outline-none px-0 py-2 text-lg font-medium bg-transparent transition-colors" 
                                    />
                                </div>
                                <div className="w-1/3">
                                    <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Amount</label>
                                    <div className="relative">
                                        <span className="absolute left-0 top-1/2 -translate-y-1/2 text-lg text-gray-400 font-medium">₹</span>
                                        <input 
                                            type="number" 
                                            step="0.01" 
                                            min="0.01"
                                            placeholder="0.00" 
                                            value={item.amount} 
                                            onChange={e => handleItemChange(item.id, 'amount', e.target.value)} 
                                            className="w-full border-b-2 border-gray-200 focus:border-blue-600 outline-none pl-6 py-2 text-xl font-bold bg-transparent transition-colors text-gray-900" 
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Who Paid */}
                            <div>
                                <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Who Paid for this item?</label>
                                <div className="grid grid-cols-2 gap-2">
                                    {members.map(m => (
                                        <button
                                            key={m.id}
                                            type="button"
                                            onClick={() => handleItemChange(item.id, 'paidBy', m.id.toString())}
                                            className={`p-2 rounded-lg border-2 font-bold text-sm text-center transition-all ${item.paidBy === m.id.toString() ? 'border-blue-600 bg-blue-50 text-blue-700' : 'border-gray-100 bg-white text-gray-500 hover:border-gray-200'}`}
                                        >
                                            {m.name}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Who Used It */}
                            <div>
                                <div className="flex justify-between items-center mb-3">
                                    <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider">Who Used this item?</label>
                                    <button type="button" onClick={() => selectAllParticipants(item.id)} className="text-xs text-gray-400 hover:text-gray-900 underline">Select All</button>
                                </div>
                                <div className="grid grid-cols-2 gap-2">
                                    {members.map(member => (
                                        <label key={member.id} className="flex items-center p-3 border-2 border-gray-100 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors has-[:checked]:border-blue-600 has-[:checked]:bg-blue-50 text-sm">
                                            <input 
                                                type="checkbox" 
                                                checked={item.participants.includes(member.id)} 
                                                onChange={() => toggleItemParticipant(item.id, member.id)} 
                                                className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-600 bg-white mr-3" 
                                            />
                                            <span className="font-bold text-gray-900">{member.name}</span>
                                        </label>
                                    ))}
                                </div>
                            </div>

                        </div>
                    ))}
                </div>

                <button 
                    type="button" 
                    onClick={addItem}
                    className="w-full bg-blue-50 hover:bg-blue-100 text-blue-600 font-bold py-4 rounded-2xl flex items-center justify-center gap-2 transition-colors border border-blue-100 border-dashed"
                >
                    <Plus size={20} /> Add Another Item
                </button>

                <div className="pt-6">
                    <button type="submit" disabled={saving} className="w-full bg-gray-900 hover:bg-black text-white px-8 py-5 rounded-2xl font-black transition-all disabled:opacity-50 text-lg shadow-xl shadow-gray-200">
                        {saving ? 'Saving Expense...' : 'Save Expense'}
                    </button>
                </div>

            </form>
        </div>
    );
};

export default AddExpense;
