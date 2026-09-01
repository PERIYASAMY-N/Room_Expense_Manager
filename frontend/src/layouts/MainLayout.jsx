import React, { useEffect, useState } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, Users, Receipt, ArrowRightLeft, Wallet, PlusCircle, LogOut } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { roomService } from '../services/api';

const MainLayout = () => {
    const location = useLocation();
    const { user, role, room, logout } = useAuth();
    const [roomDetails, setRoomDetails] = useState(null);

    useEffect(() => {
        if (role === 'ADMIN' && room) {
            // Admin can fetch room details (like invite code)
            roomService.getSettings(room).then(res => setRoomDetails(res.data)).catch(console.error);
        }
    }, [role, room]);

    const navigation = [
        { name: 'Home', href: '/dashboard', icon: LayoutDashboard, adminOnly: false },
        { name: 'Room Expenses', href: '/dashboard/expenses', icon: Receipt, adminOnly: false },
        { name: 'Add Room Expense', href: '/dashboard/expenses/add', icon: PlusCircle, adminOnly: false },
        { name: 'Settlements', href: '/dashboard/settlements', icon: ArrowRightLeft, adminOnly: false },
        { name: 'My Money', href: '/dashboard/my-money', icon: Wallet, adminOnly: false },
        { name: 'Members', href: '/dashboard/members', icon: Users, adminOnly: true },
    ];

    return (
        <div className="flex h-screen bg-gray-50 font-sans">
            {/* Sidebar */}
            <div className="w-64 bg-white shadow-md border-r border-gray-200 flex-shrink-0 flex flex-col">
                <div className="p-6 border-b border-gray-100 flex items-center gap-3">
                    <div className="bg-blue-600 text-white p-2 rounded-lg">
                        <Receipt size={24} />
                    </div>
                    <h1 className="text-xl font-bold text-gray-900">RoomExpense</h1>
                </div>
                
                <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
                    {navigation.map((item) => {
                        if (item.adminOnly && role !== 'ADMIN') return null;
                        
                        const Icon = item.icon;
                        const isActive = location.pathname === item.href || 
                                       (item.href !== '/dashboard' && location.pathname.startsWith(item.href));
                        
                        return (
                            <Link
                                key={item.name}
                                to={item.href}
                                className={`flex items-center px-4 py-3 rounded-lg transition-colors duration-150 ${
                                    isActive 
                                        ? 'bg-blue-50 text-blue-700 font-medium' 
                                        : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                                }`}
                            >
                                <Icon className={`mr-3 h-5 w-5 ${isActive ? 'text-blue-600' : 'text-gray-400'}`} />
                                {item.name}
                            </Link>
                        );
                    })}
                </nav>

                <div className="p-4 border-t border-gray-100 bg-gray-50">
                    <div className="mb-4">
                        <div className="text-sm text-gray-500 mb-1">Signed in as</div>
                        <div className="font-bold text-gray-900">{user?.username} <span className="text-xs font-normal bg-gray-200 px-2 py-0.5 rounded-full ml-1">{role}</span></div>
                    </div>
                    
                    {roomDetails && role === 'ADMIN' && (
                        <div className="mb-4 bg-white p-3 rounded-lg border border-gray-200 shadow-sm">
                            <div className="text-xs text-gray-500 uppercase tracking-wider font-semibold mb-1">Room Settings</div>
                            <div className="text-sm"><span className="text-gray-500">ID:</span> <span className="font-mono font-medium">{roomDetails.room_code}</span></div>
                            <div className="text-sm"><span className="text-gray-500">Invite:</span> <span className="font-mono font-medium text-green-600">{roomDetails.invite_code}</span></div>
                        </div>
                    )}
                    
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

export default MainLayout;
