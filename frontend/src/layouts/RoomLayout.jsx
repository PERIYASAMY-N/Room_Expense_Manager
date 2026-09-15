import { Outlet, Link, useNavigate, useParams, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { LayoutDashboard, Users, Receipt, HandCoins, ArrowLeft, LogOut, BarChart3 } from 'lucide-react';
import { useEffect, useState } from 'react';
import api from '../services/api';

const RoomLayout = () => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const { roomId } = useParams();
    const location = useLocation();
    
    const [room, setRoom] = useState(null);
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchRoomDetails = async () => {
            try {
                const res = await api.get(`/rooms/${roomId}`);
                setRoom(res.data);
            } catch (err) {
                setError(err.response?.data?.message || 'Failed to load room');
            }
        };
        fetchRoomDetails();
    }, [roomId]);

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    if (error) {
        return (
            <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
                <div className="text-red-500 text-xl font-medium mb-4">{error}</div>
                <Link to="/rooms" className="text-blue-600 hover:underline flex items-center">
                    <ArrowLeft className="h-4 w-4 mr-2" /> Back to Rooms
                </Link>
            </div>
        );
    }

    if (!room) return <div className="flex h-screen items-center justify-center">Loading Room...</div>;

    const navItems = [
        { name: 'Room Dashboard', path: `/rooms/${roomId}`, icon: LayoutDashboard },
        { name: 'My Dashboard', path: `/rooms/${roomId}/my-dashboard`, icon: BarChart3 },
        { name: 'Expenses', path: `/rooms/${roomId}/expenses`, icon: Receipt },
        { name: 'Settlements', path: `/rooms/${roomId}/settlements`, icon: HandCoins },
        { name: 'Members', path: `/rooms/${roomId}/members`, icon: Users },
    ];

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col md:flex-row">
            {/* Sidebar */}
            <aside className="w-full md:w-64 bg-slate-900 text-white border-r border-slate-800 flex-shrink-0">
                <div className="h-full flex flex-col">
                    <div className="p-6 border-b border-slate-800">
                        <Link to="/rooms" className="text-slate-400 hover:text-white flex items-center text-sm mb-4 transition-colors">
                            <ArrowLeft className="h-4 w-4 mr-1" /> Back to Main
                        </Link>
                        <h1 className="text-xl font-bold truncate" title={room.room_name}>{room.room_name}</h1>
                        <p className="text-xs text-slate-400 mt-1">Room ID: {room.room_code}</p>
                    </div>

                    <div className="p-4 flex-1">
                        <nav className="space-y-1">
                            {navItems.map((item) => {
                                const Icon = item.icon;
                                // Exact match for dashboard, startswith for others
                                const isActive = item.path === `/rooms/${roomId}` 
                                    ? location.pathname === item.path 
                                    : location.pathname.startsWith(item.path);

                                return (
                                    <Link
                                        key={item.name}
                                        to={item.path}
                                        className={`flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors ${
                                            isActive
                                                ? 'bg-blue-600 text-white'
                                                : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                                        }`}
                                    >
                                        <Icon className="mr-3 h-5 w-5" />
                                        {item.name}
                                    </Link>
                                );
                            })}
                        </nav>
                    </div>

                    <div className="p-4 border-t border-slate-800">
                        <div className="flex items-center mb-4 px-4">
                            <div className="h-8 w-8 bg-slate-700 rounded-full flex items-center justify-center mr-3 font-bold">
                                {user?.fullName?.charAt(0).toUpperCase()}
                            </div>
                            <div className="overflow-hidden">
                                <p className="text-sm font-medium truncate">{user?.fullName}</p>
                                <p className="text-xs text-slate-400 truncate">Role: {room.myRole}</p>
                            </div>
                        </div>
                        <button
                            onClick={handleLogout}
                            className="flex items-center w-full px-4 py-2 text-sm font-medium text-red-400 rounded-lg hover:bg-slate-800 transition-colors"
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
                    <Outlet context={{ room }} />
                </div>
            </main>
        </div>
    );
};

export default RoomLayout;
