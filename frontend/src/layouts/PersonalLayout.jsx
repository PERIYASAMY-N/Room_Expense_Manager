import React from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { Wallet, LogOut, PlusCircle, ArrowDownCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const PersonalLayout = () => {
    const location = useLocation();
    const { user, logout } = useAuth();

    const navigation = [
        { name: 'Dashboard', href: '/personal/dashboard', icon: Wallet },
        { name: 'Add Income', href: '/personal/add-income', icon: ArrowDownCircle },
        { name: 'Add Expense', href: '/personal/add-expense', icon: PlusCircle },
    ];

    return (
        <div className="flex h-screen bg-gray-50 font-sans">
            {/* Sidebar */}
            <div className="w-64 bg-white shadow-md border-r border-gray-200 flex-shrink-0 flex flex-col">
                <div className="p-6 border-b border-gray-100 flex items-center gap-3">
                    <div className="bg-purple-600 text-white p-2 rounded-lg">
                        <Wallet size={24} />
                    </div>
                    <h1 className="text-xl font-bold text-gray-900">My Money</h1>
                </div>
                
                <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
                    {navigation.map((item) => {
                        const Icon = item.icon;
                        const isActive = location.pathname === item.href;
                        
                        return (
                            <Link
                                key={item.name}
                                to={item.href}
                                className={`flex items-center px-4 py-3 rounded-lg transition-colors duration-150 ${
                                    isActive 
                                        ? 'bg-purple-50 text-purple-700 font-medium' 
                                        : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                                }`}
                            >
                                <Icon className={`mr-3 h-5 w-5 ${isActive ? 'text-purple-600' : 'text-gray-400'}`} />
                                {item.name}
                            </Link>
                        );
                    })}
                </nav>

                <div className="p-4 border-t border-gray-100 bg-gray-50">
                    <div className="mb-4">
                        <div className="text-sm text-gray-500 mb-1">Personal Account</div>
                        <div className="font-bold text-gray-900">{user?.full_name || user?.email}</div>
                    </div>
                    
                    <button onClick={logout} className="flex items-center text-red-600 hover:text-red-700 text-sm font-medium w-full py-2">
                        <LogOut size={16} className="mr-2" />
                        Logout
                    </button>
                </div>
            </div>

            {/* Main Content Area */}
            <main className="flex-1 overflow-y-auto bg-gray-50">
                <div className="max-w-7xl mx-auto py-8">
                    <Outlet />
                </div>
            </main>
        </div>
    );
};

export default PersonalLayout;
