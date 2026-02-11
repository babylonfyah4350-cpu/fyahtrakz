import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
    BarChart3, TrendingUp, Music, Users, Play
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { toast } from 'sonner';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const AdminAnalytics = () => {
    const { token } = useAuth();
    const [overview, setOverview] = useState(null);
    const [topSongs, setTopSongs] = useState([]);
    const [topArtists, setTopArtists] = useState([]);
    const [growth, setGrowth] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [overviewRes, songsRes, artistsRes, growthRes] = await Promise.all([
                    axios.get(`${API}/admin/analytics/overview`, { headers: { Authorization: `Bearer ${token}` } }),
                    axios.get(`${API}/admin/analytics/top-songs?limit=10`, { headers: { Authorization: `Bearer ${token}` } }),
                    axios.get(`${API}/admin/analytics/top-artists?limit=10`, { headers: { Authorization: `Bearer ${token}` } }),
                    axios.get(`${API}/admin/analytics/growth`, { headers: { Authorization: `Bearer ${token}` } })
                ]);
                setOverview(overviewRes.data);
                setTopSongs(songsRes.data);
                setTopArtists(artistsRes.data);
                setGrowth(growthRes.data);
            } catch (error) {
                toast.error('Failed to fetch analytics');
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

    return (
        <div className="p-8" data-testid="admin-analytics">
            <div className="mb-8">
                <h1 className="font-heading text-4xl font-bold text-white mb-2">Analytics</h1>
                <p className="text-zinc-400">Platform performance and insights</p>
            </div>

            {/* Overview Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <div className="bg-zinc-800/50 rounded-xl p-6">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-blue-500/20 flex items-center justify-center">
                            <Users className="w-6 h-6 text-blue-500" />
                        </div>
                        <div>
                            <p className="text-zinc-400 text-sm">Total Users</p>
                            <p className="font-heading text-2xl font-bold text-white">{overview?.users?.total || 0}</p>
                        </div>
                    </div>
                </div>

                <div className="bg-zinc-800/50 rounded-xl p-6">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-purple-500/20 flex items-center justify-center">
                            <Music className="w-6 h-6 text-purple-500" />
                        </div>
                        <div>
                            <p className="text-zinc-400 text-sm">Total Songs</p>
                            <p className="font-heading text-2xl font-bold text-white">{overview?.content?.songs || 0}</p>
                        </div>
                    </div>
                </div>

                <div className="bg-zinc-800/50 rounded-xl p-6">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-green-500/20 flex items-center justify-center">
                            <Play className="w-6 h-6 text-green-500" />
                        </div>
                        <div>
                            <p className="text-zinc-400 text-sm">Total Plays</p>
                            <p className="font-heading text-2xl font-bold text-white">{(overview?.content?.total_plays || 0).toLocaleString()}</p>
                        </div>
                    </div>
                </div>

                <div className="bg-zinc-800/50 rounded-xl p-6">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-orange-500/20 flex items-center justify-center">
                            <TrendingUp className="w-6 h-6 text-orange-500" />
                        </div>
                        <div>
                            <p className="text-zinc-400 text-sm">New Users (Month)</p>
                            <p className="font-heading text-2xl font-bold text-green-400">+{overview?.users?.new_this_month || 0}</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Growth Charts */}
            {growth?.song_growth?.length > 0 && (
                <div className="bg-zinc-800/50 rounded-xl p-6 mb-8">
                    <h2 className="font-heading text-xl font-bold text-white mb-4">Song Uploads Over Time</h2>
                    <div className="flex items-end gap-2 h-40">
                        {growth.song_growth.map((month, i) => {
                            const maxUploads = Math.max(...growth.song_growth.map(m => m.count));
                            const height = maxUploads > 0 ? (month.count / maxUploads) * 100 : 0;
                            return (
                                <div key={i} className="flex-1 flex flex-col items-center gap-2">
                                    <span className="text-xs text-zinc-400">{month.count}</span>
                                    <div 
                                        className="w-full bg-gradient-to-t from-purple-500 to-pink-500 rounded-t"
                                        style={{ height: `${Math.max(height, 5)}%` }}
                                    />
                                    <span className="text-xs text-zinc-500">{month._id?.slice(5)}</span>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Top Songs */}
                <div className="bg-zinc-800/50 rounded-xl p-6">
                    <h2 className="font-heading text-xl font-bold text-white mb-4 flex items-center gap-2">
                        <Music className="w-5 h-5 text-purple-500" /> Top Songs
                    </h2>
                    <div className="space-y-3">
                        {topSongs.length === 0 ? (
                            <p className="text-zinc-500 text-center py-4">No songs yet</p>
                        ) : (
                            topSongs.map((song, index) => (
                                <div key={song.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-zinc-700/50">
                                    <span className="w-6 text-center text-zinc-500 font-medium">{index + 1}</span>
                                    {song.cover_url ? (
                                        <img src={song.cover_url} alt={song.title} className="w-10 h-10 rounded object-cover" />
                                    ) : (
                                        <div className="w-10 h-10 rounded bg-zinc-700 flex items-center justify-center">
                                            <Music className="w-4 h-4 text-zinc-500" />
                                        </div>
                                    )}
                                    <div className="flex-1 min-w-0">
                                        <p className="font-medium text-white truncate">{song.title}</p>
                                        <p className="text-sm text-zinc-400 truncate">{song.artist_name}</p>
                                    </div>
                                    <span className="text-zinc-400">{(song.play_count || 0).toLocaleString()} plays</span>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                {/* Top Artists */}
                <div className="bg-zinc-800/50 rounded-xl p-6">
                    <h2 className="font-heading text-xl font-bold text-white mb-4 flex items-center gap-2">
                        <Users className="w-5 h-5 text-blue-500" /> Top Artists
                    </h2>
                    <div className="space-y-3">
                        {topArtists.length === 0 ? (
                            <p className="text-zinc-500 text-center py-4">No artists yet</p>
                        ) : (
                            topArtists.map((artist, index) => (
                                <div key={artist._id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-zinc-700/50">
                                    <span className="w-6 text-center text-zinc-500 font-medium">{index + 1}</span>
                                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-orange-500 to-amber-500 flex items-center justify-center">
                                        <span className="font-bold text-white">{artist.artist_name?.charAt(0).toUpperCase()}</span>
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="font-medium text-white truncate">{artist.artist_name}</p>
                                        <p className="text-sm text-zinc-400">{artist.song_count} songs</p>
                                    </div>
                                    <span className="text-zinc-400">{(artist.total_plays || 0).toLocaleString()} plays</span>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AdminAnalytics;
