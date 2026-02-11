import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Settings, DollarSign, Shield, AlertTriangle, Save, Lock, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { Input } from '../../components/ui/input';
import { Button } from '../../components/ui/button';
import { Switch } from '../../components/ui/switch';
import { toast } from 'sonner';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const AdminSettings = () => {
    const { token } = useAuth();
    const [settings, setSettings] = useState(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [formData, setFormData] = useState({
        artist_upload_price: 2.99,
        listener_subscription_price: 14.99,
        allow_free_uploads: false,
        require_subscription: true,
        maintenance_mode: false
    });

    // Password change state
    const [passwordData, setPasswordData] = useState({
        current_password: '',
        new_password: '',
        confirm_password: ''
    });
    const [showPasswords, setShowPasswords] = useState({
        current: false,
        new: false,
        confirm: false
    });
    const [changingPassword, setChangingPassword] = useState(false);

    useEffect(() => {
        const fetchSettings = async () => {
            try {
                const response = await axios.get(`${API}/admin/settings`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                setSettings(response.data);
                setFormData({
                    artist_upload_price: response.data.artist_upload_price || 2.99,
                    listener_subscription_price: response.data.listener_subscription_price || 14.99,
                    allow_free_uploads: response.data.allow_free_uploads || false,
                    require_subscription: response.data.require_subscription !== false,
                    maintenance_mode: response.data.maintenance_mode || false
                });
            } catch (error) {
                toast.error('Failed to fetch settings');
            } finally {
                setLoading(false);
            }
        };
        fetchSettings();
    }, [token]);

    const handleSave = async () => {
        setSaving(true);
        try {
            const params = new URLSearchParams();
            params.append('artist_upload_price', formData.artist_upload_price);
            params.append('listener_subscription_price', formData.listener_subscription_price);
            params.append('allow_free_uploads', formData.allow_free_uploads);
            params.append('require_subscription', formData.require_subscription);
            params.append('maintenance_mode', formData.maintenance_mode);

            await axios.put(`${API}/admin/settings?${params.toString()}`, {}, {
                headers: { Authorization: `Bearer ${token}` }
            });
            toast.success('Settings saved successfully');
        } catch (error) {
            toast.error('Failed to save settings');
        } finally {
            setSaving(false);
        }
    };

    const handlePasswordChange = async (e) => {
        e.preventDefault();
        
        if (!passwordData.current_password || !passwordData.new_password || !passwordData.confirm_password) {
            toast.error('Please fill in all password fields');
            return;
        }

        if (passwordData.new_password.length < 6) {
            toast.error('New password must be at least 6 characters');
            return;
        }

        if (passwordData.new_password !== passwordData.confirm_password) {
            toast.error('New passwords do not match');
            return;
        }

        setChangingPassword(true);
        try {
            await axios.post(`${API}/auth/change-password`, {
                current_password: passwordData.current_password,
                new_password: passwordData.new_password
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            toast.success('Password changed successfully');
            setPasswordData({ current_password: '', new_password: '', confirm_password: '' });
        } catch (error) {
            toast.error(error.response?.data?.detail || 'Failed to change password');
        } finally {
            setChangingPassword(false);
        }
    };

    if (loading) {
        return (
            <div className="p-8">
                <div className="h-10 w-64 skeleton rounded-lg mb-8" />
                <div className="space-y-6">
                    {[...Array(4)].map((_, i) => <div key={i} className="h-24 skeleton rounded-xl" />)}
                </div>
            </div>
        );
    }

    return (
        <div className="p-8 max-w-3xl" data-testid="admin-settings">
            <div className="mb-8">
                <h1 className="font-heading text-4xl font-bold text-white mb-2">Platform Settings</h1>
                <p className="text-zinc-400">Configure pricing, security, and platform features</p>
            </div>

            <div className="space-y-6">
                {/* Security - Change Password */}
                <div className="bg-zinc-800/50 rounded-xl p-6">
                    <h2 className="font-heading text-xl font-bold text-white mb-4 flex items-center gap-2">
                        <Lock className="w-5 h-5 text-orange-500" /> Change Admin Password
                    </h2>
                    <form onSubmit={handlePasswordChange} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-zinc-300 mb-2">
                                Current Password
                            </label>
                            <div className="relative max-w-md">
                                <Input
                                    type={showPasswords.current ? 'text' : 'password'}
                                    value={passwordData.current_password}
                                    onChange={(e) => setPasswordData(prev => ({ ...prev, current_password: e.target.value }))}
                                    placeholder="Enter current password"
                                    className="bg-zinc-900 border-zinc-700 text-white pr-12"
                                    data-testid="current-password-input"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPasswords(prev => ({ ...prev, current: !prev.current }))}
                                    className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-white"
                                >
                                    {showPasswords.current ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                </button>
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-zinc-300 mb-2">
                                New Password
                            </label>
                            <div className="relative max-w-md">
                                <Input
                                    type={showPasswords.new ? 'text' : 'password'}
                                    value={passwordData.new_password}
                                    onChange={(e) => setPasswordData(prev => ({ ...prev, new_password: e.target.value }))}
                                    placeholder="Enter new password (min 6 chars)"
                                    className="bg-zinc-900 border-zinc-700 text-white pr-12"
                                    data-testid="new-password-input"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPasswords(prev => ({ ...prev, new: !prev.new }))}
                                    className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-white"
                                >
                                    {showPasswords.new ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                </button>
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-zinc-300 mb-2">
                                Confirm New Password
                            </label>
                            <div className="relative max-w-md">
                                <Input
                                    type={showPasswords.confirm ? 'text' : 'password'}
                                    value={passwordData.confirm_password}
                                    onChange={(e) => setPasswordData(prev => ({ ...prev, confirm_password: e.target.value }))}
                                    placeholder="Confirm new password"
                                    className="bg-zinc-900 border-zinc-700 text-white pr-12"
                                    data-testid="confirm-password-input"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPasswords(prev => ({ ...prev, confirm: !prev.confirm }))}
                                    className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-white"
                                >
                                    {showPasswords.confirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                </button>
                            </div>
                        </div>
                        <Button
                            type="submit"
                            disabled={changingPassword}
                            className="bg-orange-500 hover:bg-orange-600 text-black"
                            data-testid="change-password-submit"
                        >
                            {changingPassword ? 'Changing...' : 'Change Password'}
                        </Button>
                    </form>
                </div>

                {/* Pricing Section */}
                <div className="bg-zinc-800/50 rounded-xl p-6">
                    <h2 className="font-heading text-xl font-bold text-white mb-4 flex items-center gap-2">
                        <DollarSign className="w-5 h-5 text-green-500" /> Pricing
                    </h2>
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-zinc-300 mb-2">
                                Artist Upload Price (AUD per song)
                            </label>
                            <Input
                                type="number"
                                step="0.01"
                                value={formData.artist_upload_price}
                                onChange={(e) => setFormData(prev => ({ ...prev, artist_upload_price: parseFloat(e.target.value) }))}
                                className="bg-zinc-900 border-zinc-700 text-white max-w-xs"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-zinc-300 mb-2">
                                Listener Subscription Price (AUD per month)
                            </label>
                            <Input
                                type="number"
                                step="0.01"
                                value={formData.listener_subscription_price}
                                onChange={(e) => setFormData(prev => ({ ...prev, listener_subscription_price: parseFloat(e.target.value) }))}
                                className="bg-zinc-900 border-zinc-700 text-white max-w-xs"
                            />
                        </div>
                    </div>
                </div>

                {/* Access Control */}
                <div className="bg-zinc-800/50 rounded-xl p-6">
                    <h2 className="font-heading text-xl font-bold text-white mb-4 flex items-center gap-2">
                        <Shield className="w-5 h-5 text-blue-500" /> Access Control
                    </h2>
                    <div className="space-y-4">
                        <div className="flex items-center justify-between p-4 bg-zinc-900 rounded-lg">
                            <div>
                                <p className="font-medium text-white">Require Subscription for Listeners</p>
                                <p className="text-sm text-zinc-400">Listeners must subscribe to access music</p>
                            </div>
                            <Switch
                                checked={formData.require_subscription}
                                onCheckedChange={(checked) => setFormData(prev => ({ ...prev, require_subscription: checked }))}
                            />
                        </div>
                        <div className="flex items-center justify-between p-4 bg-zinc-900 rounded-lg">
                            <div>
                                <p className="font-medium text-white">Allow Free Uploads</p>
                                <p className="text-sm text-zinc-400">Artists can upload without purchasing credits</p>
                            </div>
                            <Switch
                                checked={formData.allow_free_uploads}
                                onCheckedChange={(checked) => setFormData(prev => ({ ...prev, allow_free_uploads: checked }))}
                            />
                        </div>
                    </div>
                </div>

                {/* Maintenance Mode */}
                <div className="bg-zinc-800/50 rounded-xl p-6">
                    <h2 className="font-heading text-xl font-bold text-white mb-4 flex items-center gap-2">
                        <AlertTriangle className="w-5 h-5 text-yellow-500" /> Maintenance
                    </h2>
                    <div className="flex items-center justify-between p-4 bg-zinc-900 rounded-lg">
                        <div>
                            <p className="font-medium text-white">Maintenance Mode</p>
                            <p className="text-sm text-zinc-400">Disable access to the platform temporarily</p>
                        </div>
                        <Switch
                            checked={formData.maintenance_mode}
                            onCheckedChange={(checked) => setFormData(prev => ({ ...prev, maintenance_mode: checked }))}
                        />
                    </div>
                    {formData.maintenance_mode && (
                        <p className="text-yellow-400 text-sm mt-3">
                            Warning: Enabling maintenance mode will prevent users from accessing the platform.
                        </p>
                    )}
                </div>

                {/* Save Button */}
                <Button
                    onClick={handleSave}
                    disabled={saving}
                    className="bg-gradient-to-r from-orange-500 to-amber-500 text-black hover:from-orange-600 hover:to-amber-600"
                >
                    {saving ? 'Saving...' : <><Save className="w-4 h-4 mr-2" /> Save Settings</>}
                </Button>
            </div>
        </div>
    );
};

export default AdminSettings;
