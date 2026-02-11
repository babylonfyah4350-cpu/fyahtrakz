import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { 
    Users, Music, DollarSign, BarChart3, Settings, 
    TrendingUp, CreditCard, Activity, AlertCircle
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { Button } from '../../components/ui/button';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const AdminDashboard = () => {
    const { token } = useAuth();
    const [analytics, setAnalytics] = useState(null);
    const [finance, setFinance] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [analyticsRes, financeRes] = await Promise.all([
                    axios.get(`${API}/admin/analytics/overview`, { headers: { Authorization: `Bearer ${token}` } }),
                    axios.get(`${API}/admin/finance/overview`, { headers: { Authorization: `Bearer ${token}` } })
                ]);
                setAnalytics(analyticsRes.data);
                setFinance(financeRes.data);
            } catch (error) {
                console.error('Failed to fetch admin data:', error);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [token]);

    if (loading) {
        return (
            <div className="p-8">
                <div className="h-10 w-64 skeleton rounded-lg mb-8" />
                <div className="grid grid-cols-4 gap-6 mb-8">
                    {[...Array(4)].map((_, i) => <div key={i} className="h-32 skeleton rounded-xl" />)}
                </div>
            </div>
        );
    }

    const statCards = [
        { label: 'Total Users', value: analytics?.users?.total || 0, icon: Users, color: 'from-blue-500 to-cyan-500', link: '/admin/users' },
        { label: 'Total Songs', value: analytics?.content?.songs || 0, icon: Music, color: 'from-purple-500 to-pink-500', link: '/admin/content' },
        { label: 'Revenue (AUD)', value: `$${(finance?.total_revenue || 0).toFixed(2)}`, icon: DollarSign, color: 'from-green-500 to-emerald-500', link: '/admin/finance' },
        { label: 'Active Subscriptions', value: finance?.active_subscriptions || 0, icon: CreditCard, color: 'from-orange-500 to-amber-500', link: '/admin/users' },
    ];

    return (
        <div className="p-8" data-testid="admin-dashboard">
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="font-heading text-4xl font-bold text-white">Admin Dashboard</h1>
                    <p className="text-zinc-400">Manage your FyahTrakz platform</p>
                </div>
                <Link to="/admin/settings">
                    <Button variant="outline" className="border-zinc-700">
                        <Settings className="w-4 h-4 mr-2" /> Settings
                    </Button>
                </Link>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                {statCards.map((stat, index) => (
                    <Link key={index} to={stat.link} className="block">
                        <div className="bg-zinc-800/50 rounded-xl p-6 hover:bg-zinc-800 transition-colors">
                            <div className="flex items-center gap-4">
                                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${stat.color} flex items-center justify-center`}>
                                    <stat.icon className="w-6 h-6 text-white" />
                                </div>
                                <div>
                                    <p className="text-zinc-400 text-sm">{stat.label}</p>
                                    <p className="font-heading text-2xl font-bold text-white">{stat.value}</p>
                                </div>
                            </div>
                        </div>
                    </Link>
                ))}
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                {/* User Breakdown */}
                <div className="bg-zinc-800/50 rounded-xl p-6">
                    <h2 className="font-heading text-xl font-bold text-white mb-4 flex items-center gap-2">
                        <Users className="w-5 h-5 text-blue-500" /> User Breakdown
                    </h2>
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <span className="text-zinc-400">Artists</span>
                            <span className="font-semibold text-white">{analytics?.users?.artists || 0}</span>
                        </div>
                        <div className="flex items-center justify-between">
                            <span className="text-zinc-400">Listeners</span>
                            <span className="font-semibold text-white">{analytics?.users?.listeners || 0}</span>
                        </div>
                        <div className="flex items-center justify-between">
                            <span className="text-zinc-400">New This Month</span>
                            <span className="font-semibold text-green-500">+{analytics?.users?.new_this_month || 0}</span>
                        </div>
                    </div>
                </div>

                {/* Revenue Breakdown */}
                <div className="bg-zinc-800/50 rounded-xl p-6">
                    <h2 className="font-heading text-xl font-bold text-white mb-4 flex items-center gap-2">
                        <DollarSign className="w-5 h-5 text-green-500" /> Revenue Breakdown
                    </h2>
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <span className="text-zinc-400">Subscriptions</span>
                            <span className="font-semibold text-white">
                                ${(finance?.revenue_by_type?.subscription?.total || 0).toFixed(2)}
                            </span>
                        </div>
                        <div className="flex items-center justify-between">
                            <span className="text-zinc-400">Upload Credits</span>
                            <span className="font-semibold text-white">
                                ${(finance?.revenue_by_type?.upload_credit?.total || 0).toFixed(2)}
                            </span>
                        </div>
                        <div className="flex items-center justify-between">
                            <span className="text-zinc-400">Total Transactions</span>
                            <span className="font-semibold text-white">{finance?.total_transactions || 0}</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Content Stats */}
            <div className="bg-zinc-800/50 rounded-xl p-6 mb-8">
                <h2 className="font-heading text-xl font-bold text-white mb-4 flex items-center gap-2">
                    <Activity className="w-5 h-5 text-purple-500" /> Platform Activity
                </h2>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                    <div className="text-center">
                        <p className="text-3xl font-bold text-white">{analytics?.content?.songs || 0}</p>
                        <p className="text-zinc-400 text-sm">Songs</p>
                    </div>
                    <div className="text-center">
                        <p className="text-3xl font-bold text-white">{analytics?.content?.albums || 0}</p>
                        <p className="text-zinc-400 text-sm">Albums</p>
                    </div>
                    <div className="text-center">
                        <p className="text-3xl font-bold text-white">{analytics?.content?.playlists || 0}</p>
                        <p className="text-zinc-400 text-sm">Playlists</p>
                    </div>
                    <div className="text-center">
                        <p className="text-3xl font-bold text-white">{(analytics?.content?.total_plays || 0).toLocaleString()}</p>
                        <p className="text-zinc-400 text-sm">Total Plays</p>
                    </div>
                </div>
            </div>

            {/* Quick Links */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Link to="/admin/users" className="bg-zinc-800/50 rounded-xl p-4 hover:bg-zinc-800 transition-colors flex items-center gap-3">
                    <Users className="w-5 h-5 text-blue-500" />
                    <span className="text-white font-medium">Manage Users</span>
                </Link>
                <Link to="/admin/content" className="bg-zinc-800/50 rounded-xl p-4 hover:bg-zinc-800 transition-colors flex items-center gap-3">
                    <Music className="w-5 h-5 text-purple-500" />
                    <span className="text-white font-medium">Moderate Content</span>
                </Link>
                <Link to="/admin/finance" className="bg-zinc-800/50 rounded-xl p-4 hover:bg-zinc-800 transition-colors flex items-center gap-3">
                    <DollarSign className="w-5 h-5 text-green-500" />
                    <span className="text-white font-medium">View Finances</span>
                </Link>
                <Link to="/admin/analytics" className="bg-zinc-800/50 rounded-xl p-4 hover:bg-zinc-800 transition-colors flex items-center gap-3">
                    <BarChart3 className="w-5 h-5 text-orange-500" />
                    <span className="text-white font-medium">Analytics</span>
                </Link>
            </div>
        </div>
    );
};

export default AdminDashboard;
