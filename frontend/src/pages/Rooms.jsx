import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { roomService } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { Users, Plus, LogIn } from 'lucide-react';

const Rooms = () => {
    const [rooms, setRooms] = useState([]);
    const [newRoomName, setNewRoomName] = useState('');
    const [inviteCode, setInviteCode] = useState('');
    const [loading, setLoading] = useState(true);
    const { selectRoom, logout } = useAuth();
    const navigate = useNavigate();

    useEffect(() => {
        fetchRooms();
    }, []);

    const fetchRooms = async () => {
        try {
            const res = await roomService.getMyRooms();
            setRooms(res.data);
            setLoading(false);
        } catch (err) {
            console.error(err);
            setLoading(false);
        }
    };

    const handleCreateRoom = async (e) => {
        e.preventDefault();
        try {
            const res = await roomService.create({ name: newRoomName });
            selectRoom(res.data.id);
            navigate('/');
        } catch (err) {
            console.error(err);
            alert(err.response?.data?.message || 'Error creating room');
        }
    };

    const handleJoinRoom = async (e) => {
        e.preventDefault();
        try {
            const res = await roomService.join({ invite_code: inviteCode });
            selectRoom(res.data.room.id);
            navigate('/');
        } catch (err) {
            console.error(err);
            alert(err.response?.data?.message || 'Error joining room');
        }
    };

    const handleSelectRoom = (roomId) => {
        selectRoom(roomId);
        navigate('/');
    };

    if (loading) return <div className="p-8 text-center">Loading rooms...</div>;

    return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
            <div className="max-w-4xl w-full space-y-8">
                <div className="flex justify-between items-center">
                    <h1 className="text-3xl font-bold text-gray-900">Your Rooms</h1>
                    <button onClick={logout} className="text-gray-500 hover:text-gray-700">Logout</button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {/* Existing Rooms */}
                    {rooms.map(room => (
                        <div key={room.id} onClick={() => handleSelectRoom(room.id)} className="bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow cursor-pointer border border-gray-200 overflow-hidden flex flex-col h-full group">
                            <div className="p-6 flex-1">
                                <div className="flex items-center justify-between mb-4">
                                    <div className="h-10 w-10 bg-blue-100 rounded-full flex items-center justify-center text-blue-600">
                                        <Users size={20} />
                                    </div>
                                    <span className="text-xs font-medium px-2.5 py-1 bg-gray-100 text-gray-600 rounded-full">{room.role}</span>
                                </div>
                                <h3 className="text-xl font-bold text-gray-900 mb-1 group-hover:text-blue-600 transition-colors">{room.name}</h3>
                                <p className="text-sm text-gray-500">ID: {room.id}</p>
                            </div>
                        </div>
                    ))}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-12">
                    {/* Create Room */}
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                        <div className="flex items-center gap-3 mb-6">
                            <Plus className="text-blue-600" />
                            <h2 className="text-xl font-bold">Create New Room</h2>
                        </div>
                        <form onSubmit={handleCreateRoom} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Room Name</label>
                                <input type="text" required value={newRoomName} onChange={(e) => setNewRoomName(e.target.value)} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500" placeholder="E.g., Awesome Flatmates" />
                            </div>
                            <button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-colors">Create Room</button>
                        </form>
                    </div>

                    {/* Join Room */}
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                        <div className="flex items-center gap-3 mb-6">
                            <LogIn className="text-green-600" />
                            <h2 className="text-xl font-bold">Join Existing Room</h2>
                        </div>
                        <form onSubmit={handleJoinRoom} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Invite Code</label>
                                <input type="text" required value={inviteCode} onChange={(e) => setInviteCode(e.target.value.toUpperCase())} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 uppercase" placeholder="Enter 6-char code" maxLength={6} />
                            </div>
                            <button type="submit" className="w-full bg-green-600 hover:bg-green-700 text-white font-medium py-2 px-4 rounded-lg transition-colors">Join Room</button>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Rooms;
