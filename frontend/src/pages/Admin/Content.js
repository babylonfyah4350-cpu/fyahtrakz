import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
    Music, Search, Flag, Trash2, RotateCcw, AlertTriangle, CheckCircle
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { Input } from '../../components/ui/input';
import { Button } from '../../components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import {
    Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '../../components/ui/dialog';
import { Textarea } from '../../components/ui/textarea';
import { toast } from 'sonner';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const AdminContent = () => {
    const { token } = useAuth();
    const [songs, setSongs] = useState([]);
    const [total, setTotal] = useState(0);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [status, setStatus] = useState('all');
    const [selectedSong, setSelectedSong] = useState(null);
    const [showActionDialog, setShowActionDialog] = useState(false);
    const [actionType, setActionType] = useState('');
    const [reason, setReason] = useState('');
    const [actionLoading, setActionLoading] = useState(false);

    const fetchSongs = async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams();
            if (search) params.append('search', search);
            if (status !== 'all') params.append('status', status);
            
            const response = await axios.get(`${API}/admin/songs?${params.toString()}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setSongs(response.data.songs);
            setTotal(response.data.total);
        } catch (error) {
            toast.error('Failed to fetch songs');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchSongs();
    }, [status]);

    useEffect(() => {
        const timer = setTimeout(() => {
            fetchSongs();
        }, 300);
        return () => clearTimeout(timer);
    }, [search]);

    const openActionDialog = (song, action) => {
        setSelectedSong(song);
        setActionType(action);
        setReason('');
        setShowActionDialog(true);
    };

    const handleAction = async () => {
        if (!selectedSong) return;
        setActionLoading(true);

        try {
            let endpoint = '';
            let method = 'put';

            switch (actionType) {
                case 'remove':
                    endpoint = `/admin/songs/${selectedSong.id}/remove?reason=${encodeURIComponent(reason)}`;
                    break;
                case 'restore':
                    endpoint = `/admin/songs/${selectedSong.id}/restore`;
                    break;
                case 'flag':
                    endpoint = `/admin/songs/${selectedSong.id}/flag?reason=${encodeURIComponent(reason)}`;
                    break;
                case 'unflag':
                    endpoint = `/admin/songs/${selectedSong.id}/unflag`;
                    break;
                case 'delete':
                    endpoint = `/admin/songs/${selectedSong.id}`;
                    method = 'delete';
                    break;
            }

            if (method === 'delete') {
                await axios.delete(`${API}${endpoint}`, { headers: { Authorization: `Bearer ${token}` } });
            } else {
                await axios.put(`${API}${endpoint}`, {}, { headers: { Authorization: `Bearer ${token}` } });
            }

            toast.success(`Song ${actionType}d successfully`);
            setShowActionDialog(false);
            fetchSongs();
        } catch (error) {
            toast.error(error.response?.data?.detail || 'Action failed');
        } finally {
            setActionLoading(false);
        }
    };

    const formatDuration = (seconds) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    return (
        <div className="p-8" data-testid="admin-content">
            <div className="mb-8">
                <h1 className="font-heading text-4xl font-bold text-white mb-2">Content Moderation</h1>
                <p className="text-zinc-400">Manage and moderate platform content</p>
            </div>

            {/* Filters */}
            <div className="flex flex-wrap gap-4 mb-6">
                <div className="relative flex-1 min-w-[200px] max-w-md">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                    <Input
                        placeholder="Search songs or artists..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="pl-10 bg-zinc-800 border-zinc-700 text-white"
                    />
                </div>
                <Select value={status} onValueChange={setStatus}>
                    <SelectTrigger className="w-[150px] bg-zinc-800 border-zinc-700 text-white">
                        <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent className="bg-zinc-900 border-zinc-800">
                        <SelectItem value="all">All Songs</SelectItem>
                        <SelectItem value="flagged">Flagged</SelectItem>
                        <SelectItem value="removed">Removed</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            {/* Results count */}
            <p className="text-zinc-400 text-sm mb-4">{total} songs found</p>

            {/* Songs Table */}
            <div className="bg-zinc-800/30 rounded-xl overflow-hidden">
                <table className="w-full">
                    <thead>
                        <tr className="border-b border-zinc-700">
                            <th className="text-left text-xs font-medium text-zinc-500 uppercase tracking-wider p-4">Song</th>
                            <th className="text-left text-xs font-medium text-zinc-500 uppercase tracking-wider p-4">Artist</th>
                            <th className="text-left text-xs font-medium text-zinc-500 uppercase tracking-wider p-4">Genre</th>
                            <th className="text-left text-xs font-medium text-zinc-500 uppercase tracking-wider p-4">Plays</th>
                            <th className="text-left text-xs font-medium text-zinc-500 uppercase tracking-wider p-4">Status</th>
                            <th className="text-right text-xs font-medium text-zinc-500 uppercase tracking-wider p-4">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            [...Array(5)].map((_, i) => (
                                <tr key={i} className="border-b border-zinc-800">
                                    <td colSpan={6} className="p-4"><div className="h-12 skeleton rounded" /></td>
                                </tr>
                            ))
                        ) : songs.length === 0 ? (
                            <tr>
                                <td colSpan={6} className="p-8 text-center text-zinc-500">No songs found</td>
                            </tr>
                        ) : (
                            songs.map((song) => (
                                <tr key={song.id} className={`border-b border-zinc-800 hover:bg-zinc-800/50 ${song.is_removed ? 'opacity-50' : ''}`}>
                                    <td className="p-4">
                                        <div className="flex items-center gap-3">
                                            {song.cover_url ? (
                                                <img src={song.cover_url} alt={song.title} className="w-10 h-10 rounded object-cover" />
                                            ) : (
                                                <div className="w-10 h-10 rounded bg-zinc-700 flex items-center justify-center">
                                                    <Music className="w-4 h-4 text-zinc-500" />
                                                </div>
                                            )}
                                            <div>
                                                <p className="font-medium text-white">{song.title}</p>
                                                <p className="text-sm text-zinc-500">{formatDuration(song.duration)}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="p-4 text-zinc-300">{song.artist_name}</td>
                                    <td className="p-4">
                                        <span className="px-2 py-1 rounded-full text-xs bg-zinc-700 text-zinc-300">
                                            {song.genre}
                                        </span>
                                    </td>
                                    <td className="p-4 text-zinc-300">{song.play_count || 0}</td>
                                    <td className="p-4">
                                        {song.is_removed ? (
                                            <span className="px-2 py-1 rounded-full text-xs font-medium bg-red-500/20 text-red-400">Removed</span>
                                        ) : song.is_flagged ? (
                                            <span className="px-2 py-1 rounded-full text-xs font-medium bg-yellow-500/20 text-yellow-400">Flagged</span>
                                        ) : (
                                            <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-500/20 text-green-400">Active</span>
                                        )}
                                    </td>
                                    <td className="p-4 text-right">
                                        <div className="flex items-center justify-end gap-2">
                                            {song.is_removed ? (
                                                <Button variant="ghost" size="sm" onClick={() => openActionDialog(song, 'restore')}>
                                                    <RotateCcw className="w-4 h-4" />
                                                </Button>
                                            ) : (
                                                <>
                                                    {song.is_flagged ? (
                                                        <Button variant="ghost" size="sm" onClick={() => openActionDialog(song, 'unflag')}>
                                                            <CheckCircle className="w-4 h-4 text-green-500" />
                                                        </Button>
                                                    ) : (
                                                        <Button variant="ghost" size="sm" onClick={() => openActionDialog(song, 'flag')}>
                                                            <Flag className="w-4 h-4 text-yellow-500" />
                                                        </Button>
                                                    )}
                                                    <Button variant="ghost" size="sm" onClick={() => openActionDialog(song, 'remove')}>
                                                        <AlertTriangle className="w-4 h-4 text-orange-500" />
                                                    </Button>
                                                </>
                                            )}
                                            <Button variant="ghost" size="sm" onClick={() => openActionDialog(song, 'delete')}>
                                                <Trash2 className="w-4 h-4 text-red-500" />
                                            </Button>
                                        </div>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {/* Action Dialog */}
            <Dialog open={showActionDialog} onOpenChange={setShowActionDialog}>
                <DialogContent className="bg-zinc-900 border-zinc-800">
                    <DialogHeader>
                        <DialogTitle className="text-white capitalize">{actionType} Song</DialogTitle>
                    </DialogHeader>
                    <div className="py-4">
                        {selectedSong && (
                            <div className="flex items-center gap-3 mb-4 p-3 bg-zinc-800 rounded-lg">
                                <Music className="w-8 h-8 text-zinc-500" />
                                <div>
                                    <p className="font-medium text-white">{selectedSong.title}</p>
                                    <p className="text-sm text-zinc-400">by {selectedSong.artist_name}</p>
                                </div>
                            </div>
                        )}

                        {(actionType === 'remove' || actionType === 'flag') && (
                            <div>
                                <label className="block text-sm font-medium text-zinc-300 mb-2">Reason (optional)</label>
                                <Textarea
                                    value={reason}
                                    onChange={(e) => setReason(e.target.value)}
                                    placeholder="Enter reason..."
                                    className="bg-zinc-800 border-zinc-700 text-white"
                                />
                            </div>
                        )}

                        {actionType === 'delete' && (
                            <p className="text-red-400 text-sm">
                                Warning: This action is permanent and cannot be undone. The song will be permanently deleted from the platform.
                            </p>
                        )}
                    </div>
                    <DialogFooter>
                        <Button variant="ghost" onClick={() => setShowActionDialog(false)}>Cancel</Button>
                        <Button
                            onClick={handleAction}
                            disabled={actionLoading}
                            className={actionType === 'delete' ? 'bg-red-600 hover:bg-red-700' : 'bg-orange-600 hover:bg-orange-700'}
                        >
                            {actionLoading ? 'Processing...' : `${actionType.charAt(0).toUpperCase() + actionType.slice(1)} Song`}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default AdminContent;
