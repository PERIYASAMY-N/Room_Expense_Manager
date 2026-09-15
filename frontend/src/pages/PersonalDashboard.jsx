import { useState, useEffect } from 'react';
import api from '../services/api';
import { Wallet, PieChart as PieChartIcon } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d', '#ffc658'];

const PersonalDashboard = () => {
    const [dashboardData, setDashboardData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchDashboard = async () => {
            try {
                const res = await api.get('/personal/dashboard');
                setDashboardData(res.data);
            } catch (err) {
                setError(err.response?.data?.message || 'Failed to load dashboard');
            } finally {
                setLoading(false);
            }
        };
        fetchDashboard();
    }, []);

    if (loading) return <div className="text-center py-10">Loading Dashboard...</div>;
    if (error) return <div className="text-center py-10 text-red-500">{error}</div>;

    const { totalExpenses, categories } = dashboardData;

    const chartData = categories.map(c => ({ name: c.category, value: parseFloat(c.total) }));

    return (
        <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Personal Dashboard</h2>

            <div className="grid md:grid-cols-2 gap-6 mb-8">
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 flex items-center">
                    <div className="bg-red-100 p-4 rounded-full mr-4">
                        <Wallet className="h-8 w-8 text-red-600" />
                    </div>
                    <div>
                        <p className="text-sm text-gray-500 font-medium">Total Expenses</p>
                        <p className="text-3xl font-bold text-gray-900">₹{parseFloat(totalExpenses).toFixed(2)}</p>
                    </div>
                </div>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                    <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center">
                        <PieChartIcon className="h-5 w-5 mr-2 text-gray-500" /> Category Breakdown
                    </h3>
                    {chartData.length > 0 ? (
                        <div className="h-64">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={chartData}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={60}
                                        outerRadius={80}
                                        fill="#8884d8"
                                        paddingAngle={5}
                                        dataKey="value"
                                    >
                                        {chartData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <Tooltip formatter={(value) => `₹${value}`} />
                                    <Legend />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                    ) : (
                        <div className="h-64 flex items-center justify-center text-gray-500">
                            No expenses yet. Add expenses to see breakdown.
                        </div>
                    )}
                </div>

                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                    <h3 className="text-lg font-bold text-gray-800 mb-4">Category Summary</h3>
                    {categories.length > 0 ? (
                        <div className="space-y-4">
                            {categories.map((c, idx) => (
                                <div key={c.category} className="flex justify-between items-center">
                                    <div className="flex items-center">
                                        <div className="w-3 h-3 rounded-full mr-3" style={{ backgroundColor: COLORS[idx % COLORS.length] }}></div>
                                        <span className="font-medium text-gray-700">{c.category}</span>
                                    </div>
                                    <span className="font-bold text-gray-900">₹{parseFloat(c.total).toFixed(2)}</span>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center text-gray-500 py-10">No data available</div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default PersonalDashboard;
