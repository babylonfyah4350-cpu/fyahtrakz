import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Plus, ListMusic, Clock, Music } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import SongCard from '../components/SongCard';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Button } from '../components/ui/button';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const Library = () => {
    const { user, token, isAuthenticated } = useAuth();
    const navigate = useNavigate();
    const [playlists, setPlaylists] = useState([]);
    const [history, setHistory] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('playlists');

    useEffect(() => {
        if (!isAuthenticated) {
            navigate('/login');
            return;
        }

        const fetchLibrary = async () => {
            try {
                const [playlistsRes, historyRes] = await Promise.all([
                    axios.get(`${API}/playlists/my`, {
                        headers: { Authorization: `Bearer ${token}` }
                    }),
                    axios.get(`${API}/library/history`, {
                        headers: { Authorization: `Bearer ${token}` }
                    })
                ]);
                setPlaylists(playlistsRes.data);
                setHistory(historyRes.data);
            } catch (error) {
                console.error('Failed to fetch library:', error);
            } finally {
                setLoading(false);
            }
        };
        fetchLibrary();
    }, [token, isAuthenticated, navigate]);

    if (!isAuthenticated) {
        return null;
    }

    if (loading) {
        return (
            <div className="p-8 animate-fade-in">
                <div className="h-12 w-48 skeleton rounded-lg mb-8" />
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {[...Array(8)].map((_, i) => (
                        <div key={i} className="aspect-square skeleton rounded-xl" />
                    ))}
                </div>
            </div>
        );
    }

    return (
        <div className="p-8" data-testid="library-page">
            <div className="flex items-center justify-between mb-8">
                <h1 className="font-heading text-4xl font-bold text-white">Your Library</h1>
                <Link to="/playlist/create">
                    <Button className="bg-lime text-black hover:bg-lime-dark" data-testid="create-playlist-btn">
                        <Plus className="w-4 h-4 mr-2" />
                        Create Playlist
                    </Button>
                </Link>
            </div>

            <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="bg-zinc-800/50 mb-6">
                    <TabsTrigger value="playlists" data-testid="tab-playlists">
                        <ListMusic className="w-4 h-4 mr-2" />
                        Playlists
                    </TabsTrigger>
                    <TabsTrigger value="history" data-testid="tab-history">
                        <Clock className="w-4 h-4 mr-2" />
                        Recently Played
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="playlists">
                    {playlists.length > 0 ? (
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-5">
                            {playlists.map((playlist) => (
                                <Link
                                    key={playlist.id}
                                    to={`/playlist/${playlist.id}`}
                                    className="song-card group"
                                    data-testid={`playlist-card-${playlist.id}`}
                                >
                                    <div className="relative mb-4">
                                        {playlist.cover_url ? (
                                            <img
                                                src={playlist.cover_url}
                                                alt={playlist.name}
                                                className="album-art w-full"
                                            />
                                        ) : (
                                            <div className="album-art w-full flex items-center justify-center bg-gradient-to-br from-lime/20 to-purple/20">
                                                <ListMusic className="w-12 h-12 text-lime" />
                                            </div>
                                        )}
                                    </div>
                                    <h3 className="font-semibold text-white truncate">{playlist.name}</h3>
                                    <p className="text-sm text-zinc-400 truncate">
                                        {playlist.song_count} {playlist.song_count === 1 ? 'song' : 'songs'}
                                    </p>
                                </Link>
                            ))}
                        </div>
                    ) : (
                        <div className="empty-state" data-testid="no-playlists">
                            <ListMusic className="w-16 h-16 mx-auto text-zinc-600 mb-4" />
                            <h3 className="text-xl font-semibold text-white mb-2">No playlists yet</h3>
                            <p className="text-zinc-400 mb-6">Create your first playlist to start organizing your music</p>
                            <Link to="/playlist/create" className="btn-primary inline-block">
                                Create Playlist
                            </Link>
                        </div>
                    )}
                </TabsContent>

                <TabsContent value="history">
                    {history.length > 0 ? (
                        <div className="space-y-1">
                            {history.map((song, index) => (
                                <SongCard
                                    key={`${song.id}-${index}`}
                                    song={song}
                                    songs={history}
                                    index={index}
                                    variant="list"
                                />
                            ))}
                        </div>
                    ) : (
                        <div className="empty-state" data-testid="no-history">
                            <Music className="w-16 h-16 mx-auto text-zinc-600 mb-4" />
                            <h3 className="text-xl font-semibold text-white mb-2">No listening history</h3>
                            <p className="text-zinc-400 mb-6">Start playing music to see your history here</p>
                            <Link to="/search" className="btn-primary inline-block">
                                Discover Music
                            </Link>
                        </div>
                    )}
                </TabsContent>
            </Tabs>
        </div>
    );
};

export default Library;
