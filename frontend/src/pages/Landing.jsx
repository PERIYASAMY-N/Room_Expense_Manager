import { Link } from 'react-router-dom';
import { Wallet, Users } from 'lucide-react';

const Landing = () => {
    return (
        <div className="min-h-screen bg-gray-50 flex flex-col">
            <header className="bg-white border-b border-gray-200 py-4 px-6 md:px-12 flex justify-between items-center">
                <div className="text-xl font-bold text-gray-800 tracking-tight">ROOM EXPENSE MANAGER</div>
                <div className="space-x-4">
                    <Link to="/login" className="text-gray-600 hover:text-gray-900 font-medium">Login</Link>
                    <Link to="/register" className="bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors">Sign Up</Link>
                </div>
            </header>

            <main className="flex-1 flex flex-col items-center justify-center p-6 text-center">
                <h1 className="text-4xl md:text-5xl font-extrabold text-gray-900 mb-4">
                    Manage expenses, <span className="text-blue-600">effortlessly.</span>
                </h1>
                <p className="text-lg text-gray-600 mb-12 max-w-2xl">
                    Manage your personal expenses and shared room expenses in one place. Keep track of what you spend and exactly who owes whom.
                </p>

                <div className="grid md:grid-cols-2 gap-8 max-w-4xl w-full">
                    {/* Personal */}
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8 text-left hover:shadow-md transition-shadow">
                        <div className="bg-blue-100 w-12 h-12 rounded-lg flex items-center justify-center mb-6">
                            <Wallet className="text-blue-600 h-6 w-6" />
                        </div>
                        <h2 className="text-2xl font-bold text-gray-900 mb-3">Personal Expenses</h2>
                        <p className="text-gray-600 mb-6">
                            Track your own income, expenses, balance, and reports with full privacy.
                        </p>
                        <Link to="/register" className="text-blue-600 font-semibold hover:underline">Get started &rarr;</Link>
                    </div>

                    {/* Room */}
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8 text-left hover:shadow-md transition-shadow">
                        <div className="bg-emerald-100 w-12 h-12 rounded-lg flex items-center justify-center mb-6">
                            <Users className="text-emerald-600 h-6 w-6" />
                        </div>
                        <h2 className="text-2xl font-bold text-gray-900 mb-3">Room Expenses</h2>
                        <p className="text-gray-600 mb-6">
                            Create or join a room. Manage shared expenses with roommates and settle up easily.
                        </p>
                        <Link to="/register" className="text-blue-600 font-semibold hover:underline">Create a room &rarr;</Link>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default Landing;
