import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { personalMoneyService } from '../services/api';
import { ArrowLeft } from 'lucide-react';

const AddPersonalTransaction = () => {
    const navigate = useNavigate();
    const location = useLocation();
    
    // Determine type from URL
    const isIncome = location.pathname.includes('add-income');
    const typeLabel = isIncome ? 'Income' : 'Expense';
    
    const [amount, setAmount] = useState('');
    const [category, setCategory] = useState('');
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
    const [note, setNote] = useState('');
    
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(false);
    
    useEffect(() => {
        const fetchCategories = async () => {
            try {
                const res = await personalMoneyService.getCategories();
                if (isIncome) {
                    setCategories(res.data.data.income);
                    setCategory(res.data.data.income[0]);
                } else {
                    setCategories(res.data.data.expense);
                    setCategory(res.data.data.expense[0]);
                }
            } catch (err) {
                console.error("Failed to load categories");
            }
        };
        fetchCategories();
    }, [isIncome]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const data = {
                amount: parseFloat(amount),
                date,
                note
            };
            
            if (isIncome) {
                data.source = category;
                await personalMoneyService.addIncome(data);
            } else {
                data.category = category;
                await personalMoneyService.addExpense(data);
            }
            
            navigate('/dashboard/my-money');
        } catch (error) {
            console.error('Failed to add transaction', error);
            alert('Failed to save transaction');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-xl mx-auto space-y-6 px-4 md:px-0">
            <div className="flex items-center gap-4">
                <Link to="/dashboard/my-money" className="text-gray-400 hover:text-gray-900 transition-colors bg-white p-2 rounded-full shadow-sm border border-gray-100">
                    <ArrowLeft size={20} />
                </Link>
                <h1 className="text-2xl font-black text-gray-900 uppercase tracking-tight">ADD {isIncome ? 'MONEY' : 'PERSONAL EXPENSE'}</h1>
            </div>

            <form onSubmit={handleSubmit} className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6 md:p-8 space-y-6">
                <div>
                    <label className="block text-xs font-bold uppercase tracking-widest text-gray-500 mb-2">AMOUNT</label>
                    <div className="relative">
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 font-bold">₹</span>
                        <input
                            type="number"
                            step="0.01"
                            min="0.01"
                            required
                            value={amount}
                            onChange={(e) => setAmount(e.target.value)}
                            className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl font-bold text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                            placeholder="0.00"
                        />
                    </div>
                </div>

                <div>
                    <label className="block text-xs font-bold uppercase tracking-widest text-gray-500 mb-2">
                        {isIncome ? 'SOURCE' : 'CATEGORY'}
                    </label>
                    <select
                        required
                        value={category}
                        onChange={(e) => setCategory(e.target.value)}
                        className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl font-medium text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                    >
                        <option value="" disabled>Select {isIncome ? 'source' : 'category'}</option>
                        {categories.map((cat, i) => (
                            <option key={i} value={cat}>{cat}</option>
                        ))}
                    </select>
                </div>

                <div>
                    <label className="block text-xs font-bold uppercase tracking-widest text-gray-500 mb-2">DATE</label>
                    <input
                        type="date"
                        required
                        value={date}
                        onChange={(e) => setDate(e.target.value)}
                        className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl font-medium text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                    />
                </div>

                <div>
                    <label className="block text-xs font-bold uppercase tracking-widest text-gray-500 mb-2">NOTE (OPTIONAL)</label>
                    <input
                        type="text"
                        value={note}
                        onChange={(e) => setNote(e.target.value)}
                        className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl font-medium text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                        placeholder="e.g. Salary, Clothes, Dinner"
                    />
                </div>

                <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 rounded-xl shadow-md transition-all active:scale-[0.98] disabled:opacity-70 disabled:active:scale-100"
                >
                    {loading ? 'Saving...' : `Add ${typeLabel}`}
                </button>
            </form>
        </div>
    );
};

export default AddPersonalTransaction;
