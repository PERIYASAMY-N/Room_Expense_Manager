import React from 'react';
import { Link } from 'react-router-dom';
import { Users, Plus, LogIn, User, UserPlus } from 'lucide-react';

const Welcome = () => {
    return (
        <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
            <div className="text-center mb-12">
                <h1 className="text-4xl font-extrabold text-gray-900 mb-4">ROOM EXPENSE MANAGER</h1>
                <p className="text-xl text-gray-600 max-w-md mx-auto">
                    Choose how you want to manage your expenses today.
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-6xl w-full">
                
                {/* Option 1: Room Expenses */}
                <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-200 flex flex-col items-center text-center">
                    <div className="bg-blue-50 text-blue-600 p-4 rounded-full mb-4">
                        <Users size={32} />
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">Manage Room Expenses</h2>
                    <p className="text-gray-500 mb-6">Create or join a room and manage shared expenses with your roommates.</p>
                    
                    <div className="flex flex-col gap-3 w-full">
                        <Link to="/create-room" className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition flex justify-center items-center gap-2">
                            <Plus size={20} /> Create Room
                        </Link>
                        <Link to="/join-room" className="w-full bg-green-600 text-white py-3 rounded-lg hover:bg-green-700 transition flex justify-center items-center gap-2">
                            <Users size={20} /> Join Room
                        </Link>
                        <Link to="/login" className="w-full bg-gray-100 text-gray-800 py-3 rounded-lg hover:bg-gray-200 transition flex justify-center items-center gap-2 mt-2 border border-gray-300">
                            <LogIn size={20} /> Room Login
                        </Link>
                    </div>
                </div>

                {/* Option 2: Personal Money */}
                <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-200 flex flex-col items-center text-center">
                    <div className="bg-purple-50 text-purple-600 p-4 rounded-full mb-4">
                        <User size={32} />
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">Manage My Money</h2>
                    <p className="text-gray-500 mb-6">Manage your personal income, expenses, savings and transactions without joining a room.</p>
                    
                    <div className="flex flex-col gap-3 w-full">
                        <Link to="/personal/login" className="w-full bg-purple-600 text-white py-3 rounded-lg hover:bg-purple-700 transition flex justify-center items-center gap-2">
                            <LogIn size={20} /> Personal Login
                        </Link>
                        <Link to="/personal/register" className="w-full bg-gray-100 text-gray-800 py-3 rounded-lg hover:bg-gray-200 transition flex justify-center items-center gap-2 mt-2 border border-gray-300">
                            <UserPlus size={20} /> Create Personal Account
                        </Link>
                    </div>
                </div>

            </div>
        </div>
    );
};

export default Welcome;
