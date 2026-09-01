import React from 'react';
import { Link } from 'react-router-dom';
import { Users, Plus, LogIn } from 'lucide-react';

const Welcome = () => {
    return (
        <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
            <div className="text-center mb-12">
                <div className="bg-blue-600 text-white p-4 rounded-2xl inline-block mb-6 shadow-lg">
                    <Users size={48} />
                </div>
                <h1 className="text-4xl font-extrabold text-gray-900 mb-4">ROOM EXPENSE MANAGER</h1>
                <p className="text-xl text-gray-600 max-w-md mx-auto">
                    Simple and transparent expense settlement for roommates.
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl w-full">
                <Link to="/create-room" className="group bg-white p-8 rounded-2xl shadow-sm border border-gray-200 hover:shadow-md hover:border-blue-500 transition-all flex flex-col items-center text-center">
                    <div className="bg-blue-50 text-blue-600 p-4 rounded-full mb-4 group-hover:scale-110 transition-transform">
                        <Plus size={32} />
                    </div>
                    <h2 className="text-xl font-bold text-gray-900 mb-2">Create New Room</h2>
                    <p className="text-gray-500 text-sm">Set up a new space for your roommates and become the admin.</p>
                </Link>

                <Link to="/join-room" className="group bg-white p-8 rounded-2xl shadow-sm border border-gray-200 hover:shadow-md hover:border-green-500 transition-all flex flex-col items-center text-center">
                    <div className="bg-green-50 text-green-600 p-4 rounded-full mb-4 group-hover:scale-110 transition-transform">
                        <Users size={32} />
                    </div>
                    <h2 className="text-xl font-bold text-gray-900 mb-2">Join Existing Room</h2>
                    <p className="text-gray-500 text-sm">Have an invite code? Join your friends' room right here.</p>
                </Link>

                <Link to="/login" className="group bg-white p-8 rounded-2xl shadow-sm border border-gray-200 hover:shadow-md hover:border-purple-500 transition-all flex flex-col items-center text-center">
                    <div className="bg-purple-50 text-purple-600 p-4 rounded-full mb-4 group-hover:scale-110 transition-transform">
                        <LogIn size={32} />
                    </div>
                    <h2 className="text-xl font-bold text-gray-900 mb-2">Login to Room</h2>
                    <p className="text-gray-500 text-sm">Already a member? Sign in to access your room dashboard.</p>
                </Link>
            </div>
        </div>
    );
};

export default Welcome;
