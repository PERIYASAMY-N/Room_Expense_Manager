import React, { useState, useEffect } from 'react';
import { memberService } from '../services/api';
import { UserPlus, Trash2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const Members = () => {
    const { user } = useAuth();
    const [members, setMembers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [formData, setFormData] = useState({ name: '' });

    const fetchMembers = async () => {
        try {
            const response = await memberService.getAll();
            setMembers(response.data.data);
        } catch (err) {
            console.error('Failed to fetch members', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchMembers();
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            await memberService.create(formData);
            setFormData({ name: '' });
            setIsFormOpen(false);
            fetchMembers();
        } catch (error) {
            console.error('Failed to save member', error);
            alert('Error adding member');
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm('Are you sure you want to deactivate this member?')) {
            try {
                await memberService.delete(id);
                fetchMembers();
            } catch (error) {
                console.error('Failed to delete member', error);
            }
        }
    };

    return (
        <div className="max-w-3xl mx-auto space-y-6 px-4 md:px-0">
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-black text-gray-900">Room Members</h1>
                <button 
                    onClick={() => {
                        setFormData({ name: '' });
                        setIsFormOpen(!isFormOpen);
                    }}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl flex items-center gap-2 font-bold transition-colors shadow-sm"
                >
                    <UserPlus size={20} />
                    <span className="hidden sm:inline">Add Member</span>
                </button>
            </div>

            {isFormOpen && (
                <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 animate-fadeIn">
                    <h2 className="text-sm font-bold uppercase tracking-widest text-gray-400 mb-4">Add New Member</h2>
                    <form onSubmit={handleSubmit} className="flex gap-4 items-end">
                        <div className="flex-1">
                            <input 
                                type="text"
                                required
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                className="w-full border-b-2 border-gray-200 focus:border-blue-600 outline-none px-0 py-2 text-lg bg-transparent transition-colors placeholder-gray-300 font-medium"
                                placeholder="Enter member name"
                            />
                        </div>
                        <button type="submit" className="bg-gray-900 text-white px-6 py-2.5 rounded-xl font-bold hover:bg-gray-800 transition-colors">
                            Save
                        </button>
                        <button 
                            type="button" 
                            onClick={() => setIsFormOpen(false)}
                            className="bg-gray-100 text-gray-700 px-6 py-2.5 rounded-xl font-bold hover:bg-gray-200 transition-colors hidden md:block"
                        >
                            Cancel
                        </button>
                    </form>
                </div>
            )}

            <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="divide-y divide-gray-100">
                    {loading ? (
                        <div className="p-8 text-center text-gray-500">Loading members...</div>
                    ) : members.length === 0 ? (
                        <div className="p-8 text-center text-gray-500">No members found. Add some!</div>
                    ) : (
                        members.map((member) => {
                            // Quick heuristic: If this is the logged-in user, they might be admin (assuming first creator or specific flag, but backend doesn't explicitly return role here. Let's just say "Admin" for the first member or simple label).
                            // In this simple UI, we just label "Member" and "Active".
                            const isMe = member.id === user?.memberId;
                            return (
                                <div key={member.id} className="p-5 flex justify-between items-center hover:bg-gray-50 transition-colors group">
                                    <div>
                                        <p className="font-bold text-gray-900 text-lg flex items-center gap-2">
                                            {member.name}
                                            {isMe && <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-bold">YOU</span>}
                                        </p>
                                        <div className="flex items-center gap-2 mt-1">
                                            <span className="text-sm text-gray-500 font-medium">Member</span>
                                            <span className="text-xs bg-green-50 text-green-600 px-2 py-0.5 rounded-full font-bold">Active</span>
                                        </div>
                                    </div>
                                    <div>
                                        <button 
                                            onClick={() => handleDelete(member.id)} 
                                            className="text-gray-300 hover:text-red-500 transition-colors p-2 md:opacity-0 group-hover:opacity-100"
                                            title="Deactivate Member"
                                        >
                                            <Trash2 size={20} />
                                        </button>
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>
            </div>
        </div>
    );
};

export default Members;
