import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { authService } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { ArrowRight } from 'lucide-react';

const JoinRoom = () => {
    const [step, setStep] = useState(1);
    
    // Room details from validation
    const [validRoom, setValidRoom] = useState(null);
    
    // Form data
    const [roomCode, setRoomCode] = useState('');
    const [inviteCode, setInviteCode] = useState('');
    
    const [name, setName] = useState('');
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [phoneNumber, setPhoneNumber] = useState('');
    
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(false);
    
    const navigate = useNavigate();
    const { setSession } = useAuth();

    const handleStep1 = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        try {
            const res = await authService.verifyRoom({ 
                room_code: roomCode.toUpperCase(), 
                invite_code: inviteCode.toUpperCase() 
            });
            setValidRoom(res.data);
            setStep(2);
        } catch (err) {
            setError(err.response?.data?.message || 'Invalid Room ID or Invite Code.');
        } finally {
            setLoading(false);
        }
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
                room_code: roomCode.toUpperCase(),
                invite_code: inviteCode.toUpperCase(),
                name,
                username,
                password,
                phone_number: phoneNumber
            };
            
            const res = await authService.joinRoom(payload);
            
            // Auto login with the generated token
            setSession(res.data.token, res.data.user);
            
            // Navigate directly to dashboard
            navigate('/dashboard');
        } catch (err) {
            setError(err.response?.data?.message || 'Error joining room.');
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
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${step === 1 ? 'bg-green-600 text-white' : 'bg-gray-200 text-gray-600'}`}>1</div>
                        <div className={`w-12 h-1 rounded ${step === 2 ? 'bg-green-600' : 'bg-gray-200'}`}></div>
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${step === 2 ? 'bg-green-600 text-white' : 'bg-gray-200 text-gray-600'}`}>2</div>
                    </div>
                </div>

                <h2 className="text-3xl font-extrabold text-gray-900 mb-2 text-center">
                    {step === 1 ? 'Join Existing Room' : 'Your Details'}
                </h2>
                
                {step === 2 && validRoom && (
                    <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-center mb-6">
                        <p className="text-sm text-green-800">Joining: <strong>{validRoom.room.room_name}</strong></p>
                        <p className="text-xs text-green-600">{validRoom.memberCount} active member{validRoom.memberCount !== 1 && 's'}</p>
                    </div>
                )}
                
                {step === 1 && (
                    <p className="text-gray-500 text-center mb-8">
                        Enter the codes provided by your room admin
                    </p>
                )}

                {error && <div className="text-red-500 text-sm bg-red-50 p-3 rounded-lg mb-6">{error}</div>}

                {step === 1 ? (
                    <form onSubmit={handleStep1} className="space-y-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Room ID</label>
                            <input type="text" required value={roomCode} onChange={(e) => setRoomCode(e.target.value)} className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 uppercase" placeholder="e.g. RM7K4P2X" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Invite Code</label>
                            <input type="text" required value={inviteCode} onChange={(e) => setInviteCode(e.target.value)} className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 uppercase" placeholder="e.g. 8FQ29K" />
                        </div>
                        <button type="submit" disabled={loading} className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-4 rounded-xl transition-colors flex items-center justify-center gap-2 disabled:opacity-50">
                            {loading ? 'Verifying...' : 'Next'} <ArrowRight size={20} />
                        </button>
                    </form>
                ) : (
                    <form onSubmit={handleStep2} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                            <input type="text" required value={name} onChange={(e) => setName(e.target.value)} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500" placeholder="John Doe" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Username</label>
                            <input type="text" required value={username} onChange={(e) => setUsername(e.target.value)} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500" placeholder="johndoe" />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                                <input type="password" required value={password} onChange={(e) => setPassword(e.target.value)} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Confirm</label>
                                <input type="password" required value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500" />
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number (Optional)</label>
                            <input type="tel" value={phoneNumber} onChange={(e) => setPhoneNumber(e.target.value)} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500" placeholder="+1234567890" />
                        </div>
                        
                        <div className="flex gap-4 pt-4">
                            <button type="button" onClick={() => setStep(1)} className="px-6 py-3 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors font-medium">
                                Back
                            </button>
                            <button type="submit" disabled={loading} className="flex-1 bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-4 rounded-xl transition-colors disabled:opacity-50">
                                {loading ? 'Joining...' : 'Join Room'}
                            </button>
                        </div>
                    </form>
                )}
                
                <div className="mt-6 text-center text-sm text-gray-500">
                    Want to create your own room? <button onClick={() => navigate('/create-room')} className="text-blue-600 hover:underline font-medium">Create a Room</button>
                </div>
            </div>
        </div>
    );
};

export default JoinRoom;
