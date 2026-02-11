import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
    Users, Search, Ban, CheckCircle, CreditCard, 
    Coins, ChevronRight, Mail, Calendar, Phone, Globe,
    Instagram, Twitter, Facebook, Music, User
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { Input } from '../../components/ui/input';
import { Button } from '../../components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import {
    Dialog, DialogContent, DialogHeader, DialogTitle,
} from '../../components/ui/dialog';
import { toast } from 'sonner';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

// TikTok icon component
const TikTokIcon = () => (
    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
        <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-5.2 1.74 2.89 2.89 0 012.31-4.64 2.93 2.93 0 01.88.13V9.4a6.84 6.84 0 00-1-.05A6.33 6.33 0 005 20.1a6.34 6.34 0 0010.86-4.43v-7a8.16 8.16 0 004.77 1.52v-3.4a4.85 4.85 0 01-1-.1z"/>
    </svg>
);

const AdminUsers = () => {
    const { token } = useAuth();
    const [users, setUsers] = useState([]);
    const [total, setTotal] = useState(0);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [userType, setUserType] = useState('all');
    const [status, setStatus] = useState('all');
    const [selectedUser, setSelectedUser] = useState(null);
    const [userDetail, setUserDetail] = useState(null);
    const [showUserDialog, setShowUserDialog] = useState(false);
    const [actionLoading, setActionLoading] = useState(false);

    const fetchUsers = async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams();
            if (search) params.append('search', search);
            if (userType !== 'all') params.append('user_type', userType);
            if (status !== 'all') params.append('status', status);
            
            const response = await axios.get(`${API}/admin/users?${params.toString()}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setUsers(response.data.users);
            setTotal(response.data.total);
        } catch (error) {
            toast.error('Failed to fetch users');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchUsers();
    }, [userType, status]);

    useEffect(() => {
        const timer = setTimeout(() => {
            fetchUsers();
        }, 300);
        return () => clearTimeout(timer);
    }, [search]);

    const viewUser = async (user) => {
        setSelectedUser(user);
        setShowUserDialog(true);
        try {
            const response = await axios.get(`${API}/admin/users/${user.id}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setUserDetail(response.data);
        } catch (error) {
            toast.error('Failed to fetch user details');
        }
    };

    const handleBan = async (userId, isBanned) => {
        setActionLoading(true);
        try {
            await axios.put(`${API}/admin/users/${userId}/${isBanned ? 'unban' : 'ban'}`, {}, {
                headers: { Authorization: `Bearer ${token}` }
            });
            toast.success(isBanned ? 'User unbanned' : 'User banned');
            fetchUsers();
            if (userDetail?.id === userId) {
                setUserDetail(prev => ({ ...prev, is_banned: !isBanned }));
            }
        } catch (error) {
            toast.error('Action failed');
        } finally {
            setActionLoading(false);
        }
    };

    const handleSubscription = async (userId, action, days = 30) => {
        setActionLoading(true);
        try {
            await axios.put(`${API}/admin/users/${userId}/subscription?action=${action}&days=${days}`, {}, {
                headers: { Authorization: `Bearer ${token}` }
            });
            toast.success(`Subscription ${action}ed`);
            const response = await axios.get(`${API}/admin/users/${userId}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setUserDetail(response.data);
        } catch (error) {
            toast.error(error.response?.data?.detail || 'Action failed');
        } finally {
            setActionLoading(false);
        }
    };

    const handleCredits = async (userId, credits) => {
        setActionLoading(true);
        try {
            await axios.put(`${API}/admin/users/${userId}/credits?credits=${credits}`, {}, {
                headers: { Authorization: `Bearer ${token}` }
            });
            toast.success(`Credits adjusted by ${credits}`);
            const response = await axios.get(`${API}/admin/users/${userId}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setUserDetail(response.data);
        } catch (error) {
            toast.error(error.response?.data?.detail || 'Action failed');
        } finally {
            setActionLoading(false);
        }
    };

    return (
        <div className="p-8" data-testid="admin-users">
            <div className="mb-8">
                <h1 className="font-heading text-4xl font-bold text-white mb-2">User Management</h1>
                <p className="text-zinc-400">View and manage all platform users</p>
            </div>

            {/* Filters */}
            <div className="flex flex-wrap gap-4 mb-6">
                <div className="relative flex-1 min-w-[200px] max-w-md">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                    <Input
                        placeholder="Search by name or email..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="pl-10 bg-zinc-800 border-zinc-700 text-white"
                    />
                </div>
                <Select value={userType} onValueChange={setUserType}>
                    <SelectTrigger className="w-[150px] bg-zinc-800 border-zinc-700 text-white">
                        <SelectValue placeholder="User Type" />
                    </SelectTrigger>
                    <SelectContent className="bg-zinc-900 border-zinc-800">
                        <SelectItem value="all">All Types</SelectItem>
                        <SelectItem value="listener">Listeners</SelectItem>
                        <SelectItem value="artist">Artists</SelectItem>
                    </SelectContent>
                </Select>
                <Select value={status} onValueChange={setStatus}>
                    <SelectTrigger className="w-[150px] bg-zinc-800 border-zinc-700 text-white">
                        <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent className="bg-zinc-900 border-zinc-800">
                        <SelectItem value="all">All Status</SelectItem>
                        <SelectItem value="active">Active</SelectItem>
                        <SelectItem value="banned">Banned</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            {/* Results count */}
            <p className="text-zinc-400 text-sm mb-4">{total} users found</p>

            {/* Users Table */}
            <div className="bg-zinc-800/30 rounded-xl overflow-hidden">
                <table className="w-full">
                    <thead>
                        <tr className="border-b border-zinc-700">
                            <th className="text-left text-xs font-medium text-zinc-500 uppercase tracking-wider p-4">User</th>
                            <th className="text-left text-xs font-medium text-zinc-500 uppercase tracking-wider p-4">Type</th>
                            <th className="text-left text-xs font-medium text-zinc-500 uppercase tracking-wider p-4">Status</th>
                            <th className="text-left text-xs font-medium text-zinc-500 uppercase tracking-wider p-4">Joined</th>
                            <th className="text-right text-xs font-medium text-zinc-500 uppercase tracking-wider p-4">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            [...Array(5)].map((_, i) => (
                                <tr key={i} className="border-b border-zinc-800">
                                    <td colSpan={5} className="p-4"><div className="h-10 skeleton rounded" /></td>
                                </tr>
                            ))
                        ) : users.length === 0 ? (
                            <tr>
                                <td colSpan={5} className="p-8 text-center text-zinc-500">No users found</td>
                            </tr>
                        ) : (
                            users.map((user) => (
                                <tr key={user.id} className="border-b border-zinc-800 hover:bg-zinc-800/50">
                                    <td className="p-4">
                                        <div className="flex items-center gap-3">
                                            {user.avatar ? (
                                                <img src={user.avatar} alt={user.name} className="w-10 h-10 rounded-full object-cover" />
                                            ) : (
                                                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-orange-500 to-amber-500 flex items-center justify-center">
                                                    <span className="font-bold text-white">{user.name?.charAt(0).toUpperCase()}</span>
                                                </div>
                                            )}
                                            <div>
                                                <p className="font-medium text-white">{user.name}</p>
                                                <p className="text-sm text-zinc-500">{user.email}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="p-4">
                                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                            user.user_type === 'artist' ? 'bg-purple-500/20 text-purple-400' : 'bg-blue-500/20 text-blue-400'
                                        }`}>
                                            {user.user_type}
                                        </span>
                                    </td>
                                    <td className="p-4">
                                        {user.is_banned ? (
                                            <span className="px-2 py-1 rounded-full text-xs font-medium bg-red-500/20 text-red-400">Banned</span>
                                        ) : (
                                            <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-500/20 text-green-400">Active</span>
                                        )}
                                    </td>
                                    <td className="p-4 text-zinc-400 text-sm">
                                        {new Date(user.created_at).toLocaleDateString()}
                                    </td>
                                    <td className="p-4 text-right">
                                        <Button variant="ghost" size="sm" onClick={() => viewUser(user)}>
                                            View <ChevronRight className="w-4 h-4 ml-1" />
                                        </Button>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {/* User Detail Dialog */}
            <Dialog open={showUserDialog} onOpenChange={setShowUserDialog}>
                <DialogContent className="bg-zinc-900 border-zinc-800 max-w-3xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle className="text-white">
                            {userDetail?.user_type === 'artist' ? 'Artist Profile' : 'User Details'}
                        </DialogTitle>
                    </DialogHeader>
                    {userDetail ? (
                        <div className="space-y-6">
                            {/* User Header */}
                            <div className="flex items-start gap-4">
                                {userDetail.avatar ? (
                                    <img src={userDetail.avatar} alt={userDetail.name} className="w-20 h-20 rounded-full object-cover" />
                                ) : (
                                    <div className="w-20 h-20 rounded-full bg-gradient-to-br from-orange-500 to-amber-500 flex items-center justify-center">
                                        <span className="text-3xl font-bold text-white">{userDetail.name?.charAt(0).toUpperCase()}</span>
                                    </div>
                                )}
                                <div className="flex-1">
                                    <h3 className="text-2xl font-bold text-white">{userDetail.name}</h3>
                                    <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium mt-1 ${
                                        userDetail.user_type === 'artist' ? 'bg-purple-500/20 text-purple-400' : 'bg-blue-500/20 text-blue-400'
                                    }`}>
                                        {userDetail.user_type}
                                    </span>
                                    {userDetail.is_banned && (
                                        <span className="ml-2 px-2 py-1 rounded-full text-xs font-medium bg-red-500/20 text-red-400">Banned</span>
                                    )}
                                </div>
                            </div>

                            {/* Contact Information (Private - Admin Only) */}
                            <div className="bg-zinc-800/50 rounded-lg p-4 space-y-3">
                                <h4 className="font-medium text-white flex items-center gap-2">
                                    <User className="w-4 h-4 text-orange-500" /> Contact Information
                                    <span className="text-xs bg-red-500/20 text-red-400 px-2 py-0.5 rounded">Admin Only</span>
                                </h4>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                                    <div className="flex items-center gap-2 text-zinc-300">
                                        <Mail className="w-4 h-4 text-zinc-500" />
                                        <span>{userDetail.email}</span>
                                    </div>
                                    {userDetail.phone_number && (
                                        <div className="flex items-center gap-2 text-zinc-300">
                                            <Phone className="w-4 h-4 text-zinc-500" />
                                            <span>{userDetail.country_code} {userDetail.phone_number}</span>
                                        </div>
                                    )}
                                    <div className="flex items-center gap-2 text-zinc-300">
                                        <Calendar className="w-4 h-4 text-zinc-500" />
                                        <span>Joined {new Date(userDetail.created_at).toLocaleDateString()}</span>
                                    </div>
                                </div>
                            </div>

                            {/* Artist-specific Info */}
                            {userDetail.user_type === 'artist' && (
                                <>
                                    {/* Bio & Genre */}
                                    <div className="bg-zinc-800/50 rounded-lg p-4 space-y-3">
                                        <h4 className="font-medium text-white flex items-center gap-2">
                                            <Music className="w-4 h-4 text-orange-500" /> Artist Info
                                        </h4>
                                        {userDetail.genre && (
                                            <div>
                                                <p className="text-xs text-zinc-500 uppercase mb-1">Primary Genre</p>
                                                <span className="px-3 py-1 bg-orange-500/20 text-orange-400 rounded-full text-sm">
                                                    {userDetail.genre}
                                                </span>
                                            </div>
                                        )}
                                        {userDetail.bio && (
                                            <div>
                                                <p className="text-xs text-zinc-500 uppercase mb-1">Bio</p>
                                                <p className="text-zinc-300 text-sm">{userDetail.bio}</p>
                                            </div>
                                        )}
                                    </div>

                                    {/* Social Links */}
                                    {(userDetail.website || userDetail.instagram || userDetail.twitter || userDetail.facebook || userDetail.tiktok) && (
                                        <div className="bg-zinc-800/50 rounded-lg p-4 space-y-3">
                                            <h4 className="font-medium text-white">Social Links</h4>
                                            <div className="flex flex-wrap gap-3">
                                                {userDetail.website && (
                                                    <a href={userDetail.website} target="_blank" rel="noopener noreferrer" 
                                                       className="flex items-center gap-2 px-3 py-2 bg-zinc-700 rounded-lg text-sm text-zinc-300 hover:bg-zinc-600">
                                                        <Globe className="w-4 h-4" /> Website
                                                    </a>
                                                )}
                                                {userDetail.instagram && (
                                                    <a href={`https://instagram.com/${userDetail.instagram}`} target="_blank" rel="noopener noreferrer"
                                                       className="flex items-center gap-2 px-3 py-2 bg-zinc-700 rounded-lg text-sm text-zinc-300 hover:bg-zinc-600">
                                                        <Instagram className="w-4 h-4" /> @{userDetail.instagram}
                                                    </a>
                                                )}
                                                {userDetail.twitter && (
                                                    <a href={`https://twitter.com/${userDetail.twitter}`} target="_blank" rel="noopener noreferrer"
                                                       className="flex items-center gap-2 px-3 py-2 bg-zinc-700 rounded-lg text-sm text-zinc-300 hover:bg-zinc-600">
                                                        <Twitter className="w-4 h-4" /> @{userDetail.twitter}
                                                    </a>
                                                )}
                                                {userDetail.facebook && (
                                                    <a href={`https://facebook.com/${userDetail.facebook}`} target="_blank" rel="noopener noreferrer"
                                                       className="flex items-center gap-2 px-3 py-2 bg-zinc-700 rounded-lg text-sm text-zinc-300 hover:bg-zinc-600">
                                                        <Facebook className="w-4 h-4" /> {userDetail.facebook}
                                                    </a>
                                                )}
                                                {userDetail.tiktok && (
                                                    <a href={`https://tiktok.com/@${userDetail.tiktok}`} target="_blank" rel="noopener noreferrer"
                                                       className="flex items-center gap-2 px-3 py-2 bg-zinc-700 rounded-lg text-sm text-zinc-300 hover:bg-zinc-600">
                                                        <TikTokIcon /> @{userDetail.tiktok}
                                                    </a>
                                                )}
                                            </div>
                                        </div>
                                    )}

                                    {/* Artist Stats */}
                                    <div className="grid grid-cols-3 gap-4">
                                        <div className="bg-zinc-800 rounded-lg p-4 text-center">
                                            <p className="text-2xl font-bold text-white">{userDetail.song_count || 0}</p>
                                            <p className="text-zinc-400 text-sm">Songs</p>
                                        </div>
                                        <div className="bg-zinc-800 rounded-lg p-4 text-center">
                                            <p className="text-2xl font-bold text-white">{userDetail.total_plays?.toLocaleString() || 0}</p>
                                            <p className="text-zinc-400 text-sm">Total Plays</p>
                                        </div>
                                        <div className="bg-zinc-800 rounded-lg p-4 text-center">
                                            <p className="text-2xl font-bold text-white">{userDetail.upload_credits || 0}</p>
                                            <p className="text-zinc-400 text-sm">Credits</p>
                                        </div>
                                    </div>
                                </>
                            )}

                            {/* Listener-specific Info */}
                            {userDetail.user_type === 'listener' && (
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="bg-zinc-800 rounded-lg p-4 text-center">
                                        <p className="text-2xl font-bold text-white">{userDetail.playlist_count || 0}</p>
                                        <p className="text-zinc-400 text-sm">Playlists</p>
                                    </div>
                                    <div className="bg-zinc-800 rounded-lg p-4 text-center">
                                        <p className={`text-lg font-bold ${userDetail.subscription?.status === 'active' ? 'text-green-400' : 'text-zinc-400'}`}>
                                            {userDetail.subscription?.status === 'active' ? 'Active' : 'No Subscription'}
                                        </p>
                                        {userDetail.subscription?.expires_at && (
                                            <p className="text-zinc-500 text-sm">Expires: {new Date(userDetail.subscription.expires_at).toLocaleDateString()}</p>
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* Actions */}
                            <div className="space-y-4">
                                <h4 className="font-medium text-white">Admin Actions</h4>
                                <div className="flex flex-wrap gap-2">
                                    <Button
                                        variant={userDetail.is_banned ? "default" : "destructive"}
                                        onClick={() => handleBan(userDetail.id, userDetail.is_banned)}
                                        disabled={actionLoading}
                                        className={userDetail.is_banned ? 'bg-green-600 hover:bg-green-700' : ''}
                                    >
                                        {userDetail.is_banned ? <CheckCircle className="w-4 h-4 mr-2" /> : <Ban className="w-4 h-4 mr-2" />}
                                        {userDetail.is_banned ? 'Unban User' : 'Ban User'}
                                    </Button>

                                    {userDetail.user_type === 'listener' && (
                                        <>
                                            <Button onClick={() => handleSubscription(userDetail.id, 'grant', 30)} disabled={actionLoading} className="bg-blue-600 hover:bg-blue-700">
                                                <CreditCard className="w-4 h-4 mr-2" /> Grant 30 Days
                                            </Button>
                                            {userDetail.subscription?.status === 'active' && (
                                                <Button variant="outline" onClick={() => handleSubscription(userDetail.id, 'revoke')} disabled={actionLoading}>
                                                    Revoke Subscription
                                                </Button>
                                            )}
                                        </>
                                    )}

                                    {userDetail.user_type === 'artist' && (
                                        <>
                                            <Button onClick={() => handleCredits(userDetail.id, 5)} disabled={actionLoading} className="bg-purple-600 hover:bg-purple-700">
                                                <Coins className="w-4 h-4 mr-2" /> +5 Credits
                                            </Button>
                                            <Button variant="outline" onClick={() => handleCredits(userDetail.id, -1)} disabled={actionLoading}>
                                                -1 Credit
                                            </Button>
                                        </>
                                    )}
                                </div>
                            </div>

                            {/* Recent Payments */}
                            {userDetail.recent_payments?.length > 0 && (
                                <div>
                                    <h4 className="font-medium text-white mb-2">Recent Payments</h4>
                                    <div className="space-y-2">
                                        {userDetail.recent_payments.slice(0, 5).map((payment, i) => (
                                            <div key={i} className="flex justify-between items-center bg-zinc-800 rounded-lg p-3">
                                                <div>
                                                    <p className="text-white text-sm">{payment.payment_type}</p>
                                                    <p className="text-zinc-500 text-xs">{new Date(payment.created_at).toLocaleDateString()}</p>
                                                </div>
                                                <div className="text-right">
                                                    <p className="text-white">${payment.amount}</p>
                                                    <p className={`text-xs ${payment.payment_status === 'paid' ? 'text-green-400' : 'text-zinc-400'}`}>
                                                        {payment.payment_status}
                                                    </p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="h-40 flex items-center justify-center">
                            <div className="w-8 h-8 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default AdminUsers;
