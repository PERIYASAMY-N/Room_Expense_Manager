import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import { Plus, Users } from 'lucide-react';

const RoomsList = () => {
    const [rooms, setRooms] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchRooms = async () => {
            try {
                const res = await api.get('/rooms');
                setRooms(res.data);
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        fetchRooms();
    }, []);

    if (loading) return <div className="text-center py-10">Loading Rooms...</div>;

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-900">My Rooms</h2>
                <Link
                    to="/rooms/new"
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors flex items-center"
                >
                    <Plus className="h-5 w-5 mr-1" /> Create / Join Room
                </Link>
            </div>

            {rooms.length > 0 ? (
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {rooms.map((room) => (
                        <Link key={room.id} to={`/rooms/${room.id}`} className="block">
                            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
                                <h3 className="text-xl font-bold text-gray-900 mb-2 truncate">{room.room_name}</h3>
                                <p className="text-sm text-gray-500 mb-4">Room ID: {room.room_code}</p>
                                <div className="flex justify-between items-center">
                                    <span className="inline-flex items-center text-sm text-gray-600">
                                        <Users className="h-4 w-4 mr-1" /> {room.member_count} Members
                                    </span>
                                    <span className={`px-2 py-1 text-xs font-semibold rounded-md ${room.role === 'ADMIN' ? 'bg-purple-100 text-purple-700' : 'bg-gray-100 text-gray-700'}`}>
                                        {room.role}
                                    </span>
                                </div>
                            </div>
                        </Link>
                    ))}
                </div>
            ) : (
                <div className="bg-white p-10 rounded-xl shadow-sm border border-gray-200 text-center">
                    <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No Rooms Found</h3>
                    <p className="text-gray-500 mb-6">You haven't joined any rooms yet.</p>
                    <Link
                        to="/rooms/new"
                        className="inline-flex bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors items-center"
                    >
                        Create or Join a Room
                    </Link>
                </div>
            )}
        </div>
    );
};

export default RoomsList;
