import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { roomService } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { ArrowRight, User } from 'lucide-react';

const CreateRoom = () => {
    const [step, setStep] = useState(1);
    
    // Form data
    const [roomName, setRoomName] = useState('');
    const [name, setName] = useState('');
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [phoneNumber, setPhoneNumber] = useState('');
    
    // Store successful room data
    const [roomData, setRoomData] = useState(null);
    
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(false);
    
    const navigate = useNavigate();
    const { setSession } = useAuth();

    const handleStep1 = (e) => {
        e.preventDefault();
        if (!roomName.trim()) {
            setError("Room name is required.");
            return;
        }
        setError(null);
        setStep(2);
    };

    const handleStep2 = async (e) => {
        e.preventDefault();
        if (password !== confirmPassword) {
            setError("Passwords do not match.");
            return;
        }
        
        setLoading(true);
        setError(null);
        
        try {
            const payload = {
                room_name: roomName,
                name,
                username,
                password,
                phone_number: phoneNumber
            };
            
            const res = await roomService.create(payload);
            
            // Auto login with the generated token
            setSession(res.data.token, res.data.user);
            
            // Store codes for display
            setRoomData({
                roomName: payload.room_name,
                roomCode: res.data.room_code,
                inviteCode: res.data.invite_code
            });
            
            setStep(3); // Go to success screen
        } catch (err) {
            setError(err.response?.data?.message || 'Error creating room and account.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
            <div className="max-w-md w-full bg-white p-8 rounded-2xl shadow-lg border border-gray-100">
                
                {/* Progress Indicators */}
                <div className="flex justify-center mb-8">
                    <div className="flex items-center gap-2">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${step === 1 ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-600'}`}>1</div>
                        <div className={`w-12 h-1 rounded ${step === 2 ? 'bg-blue-600' : 'bg-gray-200'}`}></div>
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${step === 2 ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-600'}`}>2</div>
                    </div>
                </div>

                <h2 className="text-3xl font-extrabold text-gray-900 mb-2 text-center">
                    {step === 1 ? 'Create New Room' : step === 2 ? 'Your Details' : 'Room Created Successfully'}
                </h2>
                <p className="text-gray-500 text-center mb-8">
                    {step === 1 ? 'Give your shared space a name' : step === 2 ? 'Set up your admin account' : 'Share these details with your roommates'}
                </p>

                {error && <div className="text-red-500 text-sm bg-red-50 p-3 rounded-lg mb-6">{error}</div>}

                {step === 1 ? (
                    <form onSubmit={handleStep1} className="space-y-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Room Name</label>
                            <input type="text" required value={roomName} onChange={(e) => setRoomName(e.target.value)} className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500" placeholder="e.g. VSB Boys Room" />
                        </div>
                        <button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded-xl transition-colors flex items-center justify-center gap-2">
                            Next <ArrowRight size={20} />
                        </button>
                    </form>
                ) : step === 2 ? (
                    <form onSubmit={handleStep2} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                            <input type="text" required value={name} onChange={(e) => setName(e.target.value)} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500" placeholder="John Doe" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Username</label>
                            <input type="text" required value={username} onChange={(e) => setUsername(e.target.value)} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500" placeholder="johndoe" />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                                <input type="password" required value={password} onChange={(e) => setPassword(e.target.value)} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Confirm</label>
                                <input type="password" required value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500" />
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number (Optional)</label>
                            <input type="tel" value={phoneNumber} onChange={(e) => setPhoneNumber(e.target.value)} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500" placeholder="+1234567890" />
                        </div>
                        
                        <div className="flex gap-4 pt-4">
                            <button type="button" onClick={() => setStep(1)} className="px-6 py-3 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors font-medium">
                                Back
                            </button>
                            <button type="submit" disabled={loading} className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded-xl transition-colors disabled:opacity-50">
                                {loading ? 'Creating...' : 'Create Room'}
                            </button>
                        </div>
                    </form>
                ) : (
                    <div className="space-y-6">
                        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-center">
                            <p className="text-gray-500 text-sm mb-1">Room Name</p>
                            <p className="font-bold text-lg text-gray-900">{roomData?.roomName}</p>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-4">
                            <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 text-center">
                                <p className="text-gray-500 text-sm mb-1">Room ID</p>
                                <p className="font-mono font-bold text-lg text-blue-600">{roomData?.roomCode}</p>
                            </div>
                            <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 text-center">
                                <p className="text-gray-500 text-sm mb-1">Invite Code</p>
                                <p className="font-mono font-bold text-lg text-green-600">{roomData?.inviteCode}</p>
                            </div>
                        </div>
                        
                        <button onClick={() => navigate('/dashboard')} className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded-xl transition-colors flex items-center justify-center gap-2">
                            Go to Dashboard <ArrowRight size={20} />
                        </button>
                    </div>
                )}
                
                {step !== 3 && (
                    <div className="mt-6 text-center text-sm text-gray-500">
                        Already have a room? <button onClick={() => navigate('/join-room')} className="text-blue-600 hover:underline font-medium">Join an existing one</button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default CreateRoom;
