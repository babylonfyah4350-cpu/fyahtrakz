import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
    DollarSign, TrendingUp, CreditCard, RefreshCw, Search
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { Input } from '../../components/ui/input';
import { Button } from '../../components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { toast } from 'sonner';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const AdminFinance = () => {
    const { token } = useAuth();
    const [overview, setOverview] = useState(null);
    const [transactions, setTransactions] = useState([]);
    const [total, setTotal] = useState(0);
    const [loading, setLoading] = useState(true);
    const [paymentType, setPaymentType] = useState('all');
    const [status, setStatus] = useState('all');
    const [refundLoading, setRefundLoading] = useState(null);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [overviewRes, transactionsRes] = await Promise.all([
                axios.get(`${API}/admin/finance/overview`, { headers: { Authorization: `Bearer ${token}` } }),
                fetchTransactions()
            ]);
            setOverview(overviewRes.data);
        } catch (error) {
            toast.error('Failed to fetch financial data');
        } finally {
            setLoading(false);
        }
    };

    const fetchTransactions = async () => {
        try {
            const params = new URLSearchParams();
            if (paymentType !== 'all') params.append('payment_type', paymentType);
            if (status !== 'all') params.append('status', status);
            
            const response = await axios.get(`${API}/admin/finance/transactions?${params.toString()}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setTransactions(response.data.transactions);
            setTotal(response.data.total);
            return response.data;
        } catch (error) {
            console.error('Failed to fetch transactions:', error);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    useEffect(() => {
        fetchTransactions();
    }, [paymentType, status]);

    const handleRefund = async (transactionId) => {
        if (!window.confirm('Are you sure you want to refund this transaction?')) return;
        
        setRefundLoading(transactionId);
        try {
            await axios.post(`${API}/admin/finance/refund/${transactionId}`, {}, {
                headers: { Authorization: `Bearer ${token}` }
            });
            toast.success('Transaction refunded');
            fetchData();
        } catch (error) {
            toast.error(error.response?.data?.detail || 'Refund failed');
        } finally {
            setRefundLoading(null);
        }
    };

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

    return (
        <div className="p-8" data-testid="admin-finance">
            <div className="mb-8">
                <h1 className="font-heading text-4xl font-bold text-white mb-2">Financial Dashboard</h1>
                <p className="text-zinc-400">Monitor revenue and manage transactions</p>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <div className="bg-gradient-to-br from-green-500/20 to-emerald-500/20 border border-green-500/30 rounded-xl p-6">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-green-500/20 flex items-center justify-center">
                            <DollarSign className="w-6 h-6 text-green-500" />
                        </div>
                        <div>
                            <p className="text-zinc-400 text-sm">Total Revenue</p>
                            <p className="font-heading text-2xl font-bold text-white">${(overview?.total_revenue || 0).toFixed(2)}</p>
                            <p className="text-xs text-zinc-500">{overview?.currency}</p>
                        </div>
                    </div>
                </div>

                <div className="bg-zinc-800/50 rounded-xl p-6">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-blue-500/20 flex items-center justify-center">
                            <CreditCard className="w-6 h-6 text-blue-500" />
                        </div>
                        <div>
                            <p className="text-zinc-400 text-sm">Subscriptions</p>
                            <p className="font-heading text-2xl font-bold text-white">
                                ${(overview?.revenue_by_type?.subscription?.total || 0).toFixed(2)}
                            </p>
                            <p className="text-xs text-zinc-500">{overview?.revenue_by_type?.subscription?.count || 0} transactions</p>
                        </div>
                    </div>
                </div>

                <div className="bg-zinc-800/50 rounded-xl p-6">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-purple-500/20 flex items-center justify-center">
                            <TrendingUp className="w-6 h-6 text-purple-500" />
                        </div>
                        <div>
                            <p className="text-zinc-400 text-sm">Upload Credits</p>
                            <p className="font-heading text-2xl font-bold text-white">
                                ${(overview?.revenue_by_type?.upload_credit?.total || 0).toFixed(2)}
                            </p>
                            <p className="text-xs text-zinc-500">{overview?.revenue_by_type?.upload_credit?.count || 0} transactions</p>
                        </div>
                    </div>
                </div>

                <div className="bg-zinc-800/50 rounded-xl p-6">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-orange-500/20 flex items-center justify-center">
                            <CreditCard className="w-6 h-6 text-orange-500" />
                        </div>
                        <div>
                            <p className="text-zinc-400 text-sm">Active Subscribers</p>
                            <p className="font-heading text-2xl font-bold text-white">{overview?.active_subscriptions || 0}</p>
                            <p className="text-xs text-zinc-500">current</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Monthly Revenue Chart placeholder */}
            {overview?.monthly_revenue?.length > 0 && (
                <div className="bg-zinc-800/50 rounded-xl p-6 mb-8">
                    <h2 className="font-heading text-xl font-bold text-white mb-4">Monthly Revenue</h2>
                    <div className="flex items-end gap-2 h-40">
                        {overview.monthly_revenue.map((month, i) => {
                            const maxRevenue = Math.max(...overview.monthly_revenue.map(m => m.total));
                            const height = maxRevenue > 0 ? (month.total / maxRevenue) * 100 : 0;
                            return (
                                <div key={i} className="flex-1 flex flex-col items-center gap-2">
                                    <div 
                                        className="w-full bg-gradient-to-t from-orange-500 to-amber-500 rounded-t"
                                        style={{ height: `${Math.max(height, 5)}%` }}
                                    />
                                    <span className="text-xs text-zinc-500">{month._id.slice(5)}</span>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* Transactions */}
            <div className="mb-6">
                <h2 className="font-heading text-xl font-bold text-white mb-4">Transactions</h2>
                <div className="flex gap-4 mb-4">
                    <Select value={paymentType} onValueChange={setPaymentType}>
                        <SelectTrigger className="w-[180px] bg-zinc-800 border-zinc-700 text-white">
                            <SelectValue placeholder="Payment Type" />
                        </SelectTrigger>
                        <SelectContent className="bg-zinc-900 border-zinc-800">
                            <SelectItem value="all">All Types</SelectItem>
                            <SelectItem value="subscription">Subscriptions</SelectItem>
                            <SelectItem value="upload_credit">Upload Credits</SelectItem>
                        </SelectContent>
                    </Select>
                    <Select value={status} onValueChange={setStatus}>
                        <SelectTrigger className="w-[150px] bg-zinc-800 border-zinc-700 text-white">
                            <SelectValue placeholder="Status" />
                        </SelectTrigger>
                        <SelectContent className="bg-zinc-900 border-zinc-800">
                            <SelectItem value="all">All Status</SelectItem>
                            <SelectItem value="paid">Paid</SelectItem>
                            <SelectItem value="pending">Pending</SelectItem>
                            <SelectItem value="refunded">Refunded</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </div>

            <div className="bg-zinc-800/30 rounded-xl overflow-hidden">
                <table className="w-full">
                    <thead>
                        <tr className="border-b border-zinc-700">
                            <th className="text-left text-xs font-medium text-zinc-500 uppercase tracking-wider p-4">Date</th>
                            <th className="text-left text-xs font-medium text-zinc-500 uppercase tracking-wider p-4">User</th>
                            <th className="text-left text-xs font-medium text-zinc-500 uppercase tracking-wider p-4">Type</th>
                            <th className="text-left text-xs font-medium text-zinc-500 uppercase tracking-wider p-4">Amount</th>
                            <th className="text-left text-xs font-medium text-zinc-500 uppercase tracking-wider p-4">Status</th>
                            <th className="text-right text-xs font-medium text-zinc-500 uppercase tracking-wider p-4">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {transactions.length === 0 ? (
                            <tr>
                                <td colSpan={6} className="p-8 text-center text-zinc-500">No transactions found</td>
                            </tr>
                        ) : (
                            transactions.map((tx) => (
                                <tr key={tx.id} className="border-b border-zinc-800 hover:bg-zinc-800/50">
                                    <td className="p-4 text-zinc-300 text-sm">
                                        {new Date(tx.created_at).toLocaleDateString()}
                                    </td>
                                    <td className="p-4 text-zinc-300">{tx.user_email}</td>
                                    <td className="p-4">
                                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                            tx.payment_type === 'subscription' ? 'bg-blue-500/20 text-blue-400' : 'bg-purple-500/20 text-purple-400'
                                        }`}>
                                            {tx.payment_type === 'upload_credit' ? 'Upload Credit' : 'Subscription'}
                                        </span>
                                    </td>
                                    <td className="p-4 text-white font-medium">${tx.amount} {tx.currency?.toUpperCase()}</td>
                                    <td className="p-4">
                                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                            tx.payment_status === 'paid' ? 'bg-green-500/20 text-green-400' :
                                            tx.payment_status === 'refunded' ? 'bg-red-500/20 text-red-400' :
                                            'bg-yellow-500/20 text-yellow-400'
                                        }`}>
                                            {tx.payment_status}
                                        </span>
                                    </td>
                                    <td className="p-4 text-right">
                                        {tx.payment_status === 'paid' && (
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => handleRefund(tx.id)}
                                                disabled={refundLoading === tx.id}
                                            >
                                                <RefreshCw className={`w-4 h-4 ${refundLoading === tx.id ? 'animate-spin' : ''}`} />
                                            </Button>
                                        )}
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default AdminFinance;
