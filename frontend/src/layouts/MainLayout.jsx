import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Home, User, Users, LogOut, Wallet } from 'lucide-react';

const MainLayout = () => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    const navItems = [
        { name: 'Dashboard', path: '/personal', icon: Home },
        { name: 'Personal Expenses', path: '/personal/expenses', icon: Wallet },
        { name: 'Rooms', path: '/rooms', icon: Users },
    ];

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col md:flex-row">
            {/* Sidebar */}
            <aside className="w-full md:w-64 bg-white border-r border-gray-200 flex-shrink-0">
                <div className="h-full flex flex-col">
                    <div className="p-6 border-b border-gray-200">
                        <h1 className="text-xl font-bold text-gray-800 tracking-tight">Room Expense</h1>
                        <p className="text-sm text-gray-500 mt-1">Manager</p>
                    </div>

                    <div className="p-4 flex-1">
                        <nav className="space-y-1">
                            {navItems.map((item) => {
                                const Icon = item.icon;
                                const isActive = location.pathname === item.path;
                                return (
                                    <Link
                                        key={item.name}
                                        to={item.path}
                                        className={`flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors ${
                                            isActive
                                                ? 'bg-blue-50 text-blue-700'
                                                : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                                        }`}
                                    >
                                        <Icon className="mr-3 h-5 w-5" />
                                        {item.name}
                                    </Link>
                                );
                            })}
                        </nav>
                    </div>

                    <div className="p-4 border-t border-gray-200">
                        <div className="flex items-center mb-4 px-4">
                            <User className="h-8 w-8 text-gray-400 bg-gray-100 rounded-full p-1 mr-3" />
                            <div>
                                <p className="text-sm font-medium text-gray-700">{user?.fullName}</p>
                                <p className="text-xs text-gray-500">@{user?.username}</p>
                            </div>
                        </div>
                        <button
                            onClick={handleLogout}
                            className="flex items-center w-full px-4 py-2 text-sm font-medium text-red-600 rounded-lg hover:bg-red-50 transition-colors"
                        >
                            <LogOut className="mr-3 h-5 w-5" />
                            Logout
                        </button>
                    </div>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-50">
                <div className="p-6 md:p-8 max-w-6xl mx-auto">
                    <Outlet />
                </div>
            </main>
        </div>
    );
};

export default MainLayout;
