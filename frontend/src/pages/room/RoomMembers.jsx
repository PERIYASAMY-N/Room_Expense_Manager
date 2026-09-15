import { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import api from '../../services/api';
import { Users, Mail, UserCheck, UserX } from 'lucide-react';

const RoomMembers = () => {
    const { room } = useOutletContext();
    const [members, setMembers] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchMembers = async () => {
            try {
                const res = await api.get(`/rooms/${room.id}/members`);
                setMembers(res.data);
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        fetchMembers();
    }, [room.id]);

    if (loading) return <div className="text-center py-10">Loading Members...</div>;

    return (
        <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Room Members</h2>
            <p className="text-gray-500 mb-6">Invite Code: <span className="font-mono font-bold text-gray-800 bg-gray-200 px-2 py-1 rounded">{room.invite_code}</span></p>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Member Name</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Username</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {members.map((member) => (
                                <tr key={member.member_id} className="hover:bg-gray-50">
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="flex items-center">
                                            <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold mr-3">
                                                {member.full_name.charAt(0).toUpperCase()}
                                            </div>
                                            <div className="text-sm font-medium text-gray-900">{member.full_name}</div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        @{member.username}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-md ${
                                            member.role === 'ADMIN' ? 'bg-purple-100 text-purple-800' : 'bg-gray-100 text-gray-800'
                                        }`}>
                                            {member.role}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        {member.is_active ? (
                                            <span className="flex items-center text-sm text-emerald-600 font-medium">
                                                <UserCheck className="h-4 w-4 mr-1" /> Active
                                            </span>
                                        ) : (
                                            <span className="flex items-center text-sm text-red-600 font-medium">
                                                <UserX className="h-4 w-4 mr-1" /> Inactive
                                            </span>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default RoomMembers;
