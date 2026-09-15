import { useState, useEffect } from 'react';
import api from '../services/api';
import { Plus, Trash2, Edit2, X } from 'lucide-react';

const CATEGORIES = ['Food', 'Travel', 'Shopping', 'Bills', 'Education', 'Entertainment', 'Health', 'Other'];

const PersonalExpenses = () => {
    const [expenses, setExpenses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    
    const [formData, setFormData] = useState({
        id: null,
        title: '',
        amount: '',
        category: CATEGORIES[0],
        expense_date: new Date().toISOString().split('T')[0],
        description: ''
    });

    useEffect(() => {
        fetchExpenses();
    }, []);

    const fetchExpenses = async () => {
        try {
            const res = await api.get('/personal/expenses');
            setExpenses(res.data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (formData.id) {
                await api.put(`/personal/expenses/${formData.id}`, formData);
            } else {
                await api.post('/personal/expenses', formData);
            }
            setIsModalOpen(false);
            fetchExpenses();
        } catch (err) {
            console.error(err);
            alert(err.response?.data?.message || 'Error saving expense');
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Are you sure you want to delete this expense?')) return;
        try {
            await api.delete(`/personal/expenses/${id}`);
            fetchExpenses();
        } catch (err) {
            console.error(err);
            alert('Error deleting expense');
        }
    };

    const openModal = (expense = null) => {
        if (expense) {
            setFormData({
                id: expense.id,
                title: expense.title,
                amount: expense.amount,
                category: expense.category,
                expense_date: expense.expense_date.split('T')[0],
                description: expense.description || ''
            });
        } else {
            setFormData({
                id: null,
                title: '',
                amount: '',
                category: CATEGORIES[0],
                expense_date: new Date().toISOString().split('T')[0],
                description: ''
            });
        }
        setIsModalOpen(true);
    };

    if (loading) return <div className="text-center py-10">Loading...</div>;

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-900">Personal Expenses</h2>
                <button
                    onClick={() => openModal()}
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors flex items-center"
                >
                    <Plus className="h-5 w-5 mr-1" /> Add Expense
                </button>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                {expenses.length > 0 ? (
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Title</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {expenses.map((expense) => (
                                    <tr key={expense.id} className="hover:bg-gray-50">
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            {new Date(expense.expense_date).toLocaleDateString()}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm font-medium text-gray-900">{expense.title}</div>
                                            {expense.description && <div className="text-xs text-gray-500">{expense.description}</div>}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                                                {expense.category}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900">
                                            ₹{parseFloat(expense.amount).toFixed(2)}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                            <button onClick={() => openModal(expense)} className="text-indigo-600 hover:text-indigo-900 mr-4">
                                                <Edit2 className="h-4 w-4" />
                                            </button>
                                            <button onClick={() => handleDelete(expense.id)} className="text-red-600 hover:text-red-900">
                                                <Trash2 className="h-4 w-4" />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <div className="p-8 text-center text-gray-500">
                        No expenses found. Click "Add Expense" to get started.
                    </div>
                )}
            </div>

            {/* Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-xl shadow-xl max-w-md w-full overflow-hidden">
                        <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
                            <h3 className="text-lg font-bold text-gray-900">
                                {formData.id ? 'Edit Expense' : 'Add Expense'}
                            </h3>
                            <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-500">
                                <X className="h-5 w-5" />
                            </button>
                        </div>
                        <div className="p-6">
                            <form onSubmit={handleSubmit} className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Title</label>
                                    <input type="text" required name="title" value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Amount (₹)</label>
                                    <input type="number" step="0.01" required name="amount" value={formData.amount} onChange={e => setFormData({...formData, amount: e.target.value})} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Category</label>
                                    <select name="category" value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm">
                                        {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Date</label>
                                    <input type="date" required name="expense_date" value={formData.expense_date} onChange={e => setFormData({...formData, expense_date: e.target.value})} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Description (Optional)</label>
                                    <textarea name="description" value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} rows="2" className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"></textarea>
                                </div>
                                <div className="mt-5 sm:mt-6 sm:grid sm:grid-cols-2 sm:gap-3 sm:grid-flow-row-dense">
                                    <button type="submit" className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none sm:col-start-2 sm:text-sm">
                                        Save
                                    </button>
                                    <button type="button" onClick={() => setIsModalOpen(false)} className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none sm:mt-0 sm:col-start-1 sm:text-sm">
                                        Cancel
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

export default PersonalExpenses;
