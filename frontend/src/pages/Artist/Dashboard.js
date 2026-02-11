import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Music, Play, Upload, Disc, TrendingUp, BarChart3, Trash2, UserCog } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { Button } from '../../components/ui/button';
import { toast } from 'sonner';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const ArtistDashboard = () => {
    const navigate = useNavigate();
    const { token, isArtist, isAuthenticated, user } = useAuth();
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [deleteConfirm, setDeleteConfirm] = useState(null);
    const [deleting, setDeleting] = useState(false);

    const fetchStats = async () => {
        try {
            const response = await axios.get(`${API}/stats/artist`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setStats(response.data);
        } catch (error) {
            console.error('Failed to fetch stats:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (!isAuthenticated || !isArtist) {
            navigate('/');
            return;
        }
        fetchStats();
    }, [token, isArtist, isAuthenticated, navigate]);

    const handleDeleteSong = async (songId, songTitle) => {
        if (deleteConfirm !== songId) {
            setDeleteConfirm(songId);
            return;
        }

        setDeleting(true);
        try {
            await axios.delete(`${API}/songs/${songId}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            toast.success(`"${songTitle}" has been deleted`);
            setDeleteConfirm(null);
            // Refresh stats
            fetchStats();
        } catch (error) {
            console.error('Delete failed:', error);
            toast.error(error.response?.data?.detail || 'Failed to delete song');
        } finally {
            setDeleting(false);
        }
    };

    if (!isArtist) {
        return null;
    }

    if (loading) {
        return (
            <div className="p-8 animate-fade-in">
                <div className="h-12 w-64 skeleton rounded-lg mb-8" />
                <div className="grid grid-cols-3 gap-6 mb-8">
                    {[...Array(3)].map((_, i) => (
                        <div key={i} className="h-32 skeleton rounded-xl" />
                    ))}
                </div>
            </div>
        );
    }

    return (
        <div className="p-8" data-testid="artist-dashboard">
            {/* Header */}
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="font-heading text-4xl font-bold text-white mb-2">Artist Dashboard</h1>
                    <p className="text-zinc-400">Welcome back, {user?.name}</p>
                </div>
                <Link to="/artist/upload">
                    <Button className="bg-lime text-black hover:bg-lime-dark" data-testid="upload-btn">
                        <Upload className="w-4 h-4 mr-2" />
                        Upload Music
                    </Button>
                </Link>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
                <div className="bg-zinc-800/50 rounded-xl p-6" data-testid="total-plays-stat">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-lime/20 rounded-xl flex items-center justify-center">
                            <Play className="w-6 h-6 text-lime" />
                        </div>
                        <div>
                            <p className="text-zinc-400 text-sm">Total Plays</p>
                            <p className="font-heading text-3xl font-bold text-white">
                                {stats?.total_plays?.toLocaleString() || 0}
                            </p>
                        </div>
                    </div>
                </div>

                <div className="bg-zinc-800/50 rounded-xl p-6" data-testid="songs-stat">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-purple/20 rounded-xl flex items-center justify-center">
                            <Music className="w-6 h-6 text-purple" />
                        </div>
                        <div>
                            <p className="text-zinc-400 text-sm">Songs</p>
                            <p className="font-heading text-3xl font-bold text-white">
                                {stats?.song_count || 0}
                            </p>
                        </div>
                    </div>
                </div>

                <div className="bg-zinc-800/50 rounded-xl p-6" data-testid="albums-stat">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-pink/20 rounded-xl flex items-center justify-center">
                            <Disc className="w-6 h-6 text-pink" />
                        </div>
                        <div>
                            <p className="text-zinc-400 text-sm">Albums</p>
                            <p className="font-heading text-3xl font-bold text-white">
                                {stats?.album_count || 0}
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Top Songs */}
            <section className="mb-10" data-testid="top-songs-section">
                <div className="flex items-center gap-3 mb-6">
                    <TrendingUp className="w-5 h-5 text-lime" />
                    <h2 className="font-heading text-2xl font-bold text-white">Your Songs</h2>
                </div>
                
                {stats?.top_songs?.length > 0 ? (
                    <div className="bg-zinc-800/30 rounded-xl overflow-hidden">
                        <table className="w-full">
                            <thead>
                                <tr className="border-b border-zinc-700">
                                    <th className="text-left text-xs font-medium text-zinc-500 uppercase tracking-wider p-4">#</th>
                                    <th className="text-left text-xs font-medium text-zinc-500 uppercase tracking-wider p-4">Title</th>
                                    <th className="text-left text-xs font-medium text-zinc-500 uppercase tracking-wider p-4">Genre</th>
                                    <th className="text-right text-xs font-medium text-zinc-500 uppercase tracking-wider p-4">Plays</th>
                                    <th className="text-right text-xs font-medium text-zinc-500 uppercase tracking-wider p-4">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {stats.top_songs.map((song, index) => (
                                    <tr key={song.id} className="border-b border-zinc-800 hover:bg-zinc-800/50 transition-colors">
                                        <td className="p-4 text-zinc-400">{index + 1}</td>
                                        <td className="p-4">
                                            <div className="flex items-center gap-3">
                                                {song.cover_url ? (
                                                    <img
                                                        src={song.cover_url}
                                                        alt={song.title}
                                                        className="w-10 h-10 rounded object-cover"
                                                    />
                                                ) : (
                                                    <div className="w-10 h-10 rounded bg-zinc-700 flex items-center justify-center">
                                                        <Music className="w-4 h-4 text-zinc-500" />
                                                    </div>
                                                )}
                                                <span className="font-medium text-white">{song.title}</span>
                                            </div>
                                        </td>
                                        <td className="p-4 text-zinc-400">{song.genre}</td>
                                        <td className="p-4 text-right text-zinc-400">
                                            {song.play_count?.toLocaleString() || 0}
                                        </td>
                                        <td className="p-4 text-right">
                                            {deleteConfirm === song.id ? (
                                                <div className="flex items-center justify-end gap-2">
                                                    <button
                                                        onClick={() => setDeleteConfirm(null)}
                                                        className="px-3 py-1 text-sm text-zinc-400 hover:text-white"
                                                        disabled={deleting}
                                                    >
                                                        Cancel
                                                    </button>
                                                    <button
                                                        onClick={() => handleDeleteSong(song.id, song.title)}
                                                        className="px-3 py-1 text-sm bg-red-500 text-white rounded hover:bg-red-600 disabled:opacity-50"
                                                        disabled={deleting}
                                                        data-testid={`confirm-delete-${song.id}`}
                                                    >
                                                        {deleting ? 'Deleting...' : 'Confirm'}
                                                    </button>
                                                </div>
                                            ) : (
                                                <button
                                                    onClick={() => handleDeleteSong(song.id, song.title)}
                                                    className="p-2 text-zinc-400 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-colors"
                                                    title="Delete song"
                                                    data-testid={`delete-song-${song.id}`}
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <div className="bg-zinc-800/30 rounded-xl p-12 text-center">
                        <BarChart3 className="w-12 h-12 mx-auto text-zinc-600 mb-4" />
                        <h3 className="text-lg font-semibold text-white mb-2">No songs yet</h3>
                        <p className="text-zinc-400 mb-6">Upload your first track to see stats here</p>
                        <Link to="/artist/upload" className="btn-primary inline-block">
                            Upload Your First Song
                        </Link>
                    </div>
                )}
            </section>

            {/* Quick Actions */}
            <section data-testid="quick-actions">
                <h2 className="font-heading text-2xl font-bold text-white mb-6">Quick Actions</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Link
                        to="/artist/upload"
                        className="flex items-center gap-4 p-4 bg-zinc-800/50 rounded-xl hover:bg-zinc-800 transition-colors group"
                        data-testid="action-upload"
                    >
                        <div className="w-12 h-12 bg-lime/10 rounded-xl flex items-center justify-center group-hover:bg-lime/20 transition-colors">
                            <Upload className="w-6 h-6 text-lime" />
                        </div>
                        <div>
                            <p className="font-medium text-white">Upload New Song</p>
                            <p className="text-sm text-zinc-400">Share your latest track</p>
                        </div>
                    </Link>
                    <Link
                        to="/artist/edit-profile"
                        className="flex items-center gap-4 p-4 bg-zinc-800/50 rounded-xl hover:bg-zinc-800 transition-colors group"
                        data-testid="action-edit-profile"
                    >
                        <div className="w-12 h-12 bg-orange-500/10 rounded-xl flex items-center justify-center group-hover:bg-orange-500/20 transition-colors">
                            <UserCog className="w-6 h-6 text-orange-500" />
                        </div>
                        <div>
                            <p className="font-medium text-white">Edit Profile</p>
                            <p className="text-sm text-zinc-400">Update your artist info</p>
                        </div>
                    </Link>
                    <Link
                        to={`/artist/${user?.id}`}
                        className="flex items-center gap-4 p-4 bg-zinc-800/50 rounded-xl hover:bg-zinc-800 transition-colors group"
                        data-testid="action-profile"
                    >
                        <div className="w-12 h-12 bg-purple/10 rounded-xl flex items-center justify-center group-hover:bg-purple/20 transition-colors">
                            <Music className="w-6 h-6 text-purple" />
                        </div>
                        <div>
                            <p className="font-medium text-white">View Artist Profile</p>
                            <p className="text-sm text-zinc-400">See how others see you</p>
                        </div>
                    </Link>
                </div>
            </section>
        </div>
    );
};

export default ArtistDashboard;
