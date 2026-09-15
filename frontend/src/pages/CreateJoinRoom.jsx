import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';

const CreateJoinRoom = () => {
    const navigate = useNavigate();
    
    // Create state
    const [roomName, setRoomName] = useState('');
    const [isCreating, setIsCreating] = useState(false);
    const [createError, setCreateError] = useState('');

    // Join state
    const [code, setCode] = useState('');
    const [isJoining, setIsJoining] = useState(false);
    const [joinError, setJoinError] = useState('');

    const handleCreate = async (e) => {
        e.preventDefault();
        setCreateError('');
        setIsCreating(true);

        try {
            const res = await api.post('/rooms', { roomName });
            navigate(`/rooms/${res.data.id}`);
        } catch (err) {
            setCreateError(err.response?.data?.message || 'Failed to create room');
        } finally {
            setIsCreating(false);
        }
    };

    const handleJoin = async (e) => {
        e.preventDefault();
        setJoinError('');
        setIsJoining(true);

        try {
            const res = await api.post('/rooms/join', { code });
            navigate(`/rooms/${res.data.id}`);
        } catch (err) {
            setJoinError(err.response?.data?.message || 'Failed to join room');
        } finally {
            setIsJoining(false);
        }
    };

    return (
        <div className="max-w-4xl mx-auto">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Create or Join a Room</h2>
            
            <div className="grid md:grid-cols-2 gap-8">
                {/* Create Room */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                    <h3 className="text-xl font-bold text-gray-900 mb-4">Create a New Room</h3>
                    <p className="text-sm text-gray-500 mb-6">Create a room to manage shared expenses with friends or roommates.</p>
                    
                    <form onSubmit={handleCreate}>
                        {createError && <div className="mb-4 text-sm text-red-600 bg-red-50 p-3 rounded">{createError}</div>}
                        
                        <div className="mb-4">
                            <label className="block text-sm font-medium text-gray-700 mb-1">Room Name</label>
                            <input
                                type="text"
                                required
                                value={roomName}
                                onChange={(e) => setRoomName(e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                                placeholder="e.g. Goa Trip 2024"
                            />
                        </div>
                        
                        <button
                            type="submit"
                            disabled={isCreating}
                            className="w-full bg-blue-600 text-white px-4 py-2 rounded-md font-medium hover:bg-blue-700 transition-colors disabled:opacity-50"
                        >
                            {isCreating ? 'Creating...' : 'Create Room'}
                        </button>
                    </form>
                </div>

                {/* Join Room */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                    <h3 className="text-xl font-bold text-gray-900 mb-4">Join an Existing Room</h3>
                    <p className="text-sm text-gray-500 mb-6">Enter the Room ID or Invite Code provided by the room admin.</p>
                    
                    <form onSubmit={handleJoin}>
                        {joinError && <div className="mb-4 text-sm text-red-600 bg-red-50 p-3 rounded">{joinError}</div>}
                        
                        <div className="mb-4">
                            <label className="block text-sm font-medium text-gray-700 mb-1">Room ID or Invite Code</label>
                            <input
                                type="text"
                                required
                                value={code}
                                onChange={(e) => setCode(e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-emerald-500 focus:border-emerald-500"
                                placeholder="e.g. RM123456"
                            />
                        </div>
                        
                        <button
                            type="submit"
                            disabled={isJoining}
                            className="w-full bg-emerald-600 text-white px-4 py-2 rounded-md font-medium hover:bg-emerald-700 transition-colors disabled:opacity-50"
                        >
                            {isJoining ? 'Joining...' : 'Join Room'}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default CreateJoinRoom;
