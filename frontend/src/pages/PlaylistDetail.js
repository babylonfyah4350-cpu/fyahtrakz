import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { Play, Shuffle, MoreHorizontal, Trash2, Edit2, ListMusic, Music } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { usePlayer } from '../contexts/PlayerContext';
import SongCard from '../components/SongCard';
import { Button } from '../components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '../components/ui/dropdown-menu';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from '../components/ui/dialog';
import { Input } from '../components/ui/input';
import { toast } from 'sonner';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const PlaylistDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { user, token } = useAuth();
    const { playSong } = usePlayer();
    const [playlist, setPlaylist] = useState(null);
    const [loading, setLoading] = useState(true);
    const [editDialog, setEditDialog] = useState(false);
    const [editName, setEditName] = useState('');
    const [editDescription, setEditDescription] = useState('');

    const isOwner = user && playlist?.user_id === user.id;

    useEffect(() => {
        const fetchPlaylist = async () => {
            try {
                const response = await axios.get(`${API}/playlists/${id}`, {
                    headers: token ? { Authorization: `Bearer ${token}` } : {}
                });
                setPlaylist(response.data);
                setEditName(response.data.name);
                setEditDescription(response.data.description || '');
            } catch (error) {
                console.error('Failed to fetch playlist:', error);
                toast.error('Failed to load playlist');
            } finally {
                setLoading(false);
            }
        };
        fetchPlaylist();
    }, [id, token]);

    const handlePlayAll = () => {
        if (playlist?.songs?.length > 0) {
            playSong(playlist.songs[0], playlist.songs, 0);
        }
    };

    const handleShuffle = () => {
        if (playlist?.songs?.length > 0) {
            const randomIndex = Math.floor(Math.random() * playlist.songs.length);
            playSong(playlist.songs[randomIndex], playlist.songs, randomIndex);
        }
    };

    const handleDelete = async () => {
        if (!window.confirm('Are you sure you want to delete this playlist?')) return;
        
        try {
            await axios.delete(`${API}/playlists/${id}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            toast.success('Playlist deleted');
            navigate('/library');
        } catch (error) {
            toast.error('Failed to delete playlist');
        }
    };

    const handleEdit = async () => {
        try {
            await axios.put(`${API}/playlists/${id}`, {
                name: editName,
                description: editDescription
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setPlaylist(prev => ({ ...prev, name: editName, description: editDescription }));
            setEditDialog(false);
            toast.success('Playlist updated');
        } catch (error) {
            toast.error('Failed to update playlist');
        }
    };

    const handleRemoveSong = async (songId) => {
        try {
            await axios.delete(`${API}/playlists/${id}/songs/${songId}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setPlaylist(prev => ({
                ...prev,
                songs: prev.songs.filter(s => s.id !== songId),
                song_count: prev.song_count - 1
            }));
            toast.success('Song removed from playlist');
        } catch (error) {
            toast.error('Failed to remove song');
        }
    };

    if (loading) {
        return (
            <div className="p-8 animate-fade-in">
                <div className="flex items-end gap-6 mb-8">
                    <div className="w-48 h-48 skeleton rounded-xl" />
                    <div>
                        <div className="h-8 w-32 skeleton rounded mb-4" />
                        <div className="h-12 w-64 skeleton rounded" />
                    </div>
                </div>
            </div>
        );
    }

    if (!playlist) {
        return (
            <div className="p-8 text-center">
                <ListMusic className="w-16 h-16 mx-auto text-zinc-600 mb-4" />
                <h2 className="text-xl font-semibold text-white mb-2">Playlist not found</h2>
                <Link to="/library" className="text-lime hover:underline">Back to library</Link>
            </div>
        );
    }

    return (
        <div data-testid="playlist-detail-page">
            {/* Header */}
            <div className="relative h-80 overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-b from-lime/20 via-background/80 to-background" />
                <div className="absolute bottom-0 left-0 right-0 p-8 flex items-end gap-6">
                    {playlist.cover_url ? (
                        <img
                            src={playlist.cover_url}
                            alt={playlist.name}
                            className="w-48 h-48 rounded-xl object-cover shadow-2xl"
                        />
                    ) : (
                        <div className="w-48 h-48 rounded-xl bg-gradient-to-br from-lime/20 to-purple/20 flex items-center justify-center shadow-2xl">
                            <ListMusic className="w-20 h-20 text-lime" />
                        </div>
                    )}
                    <div className="flex-1">
                        <span className="text-sm font-medium text-zinc-300 uppercase tracking-wider">Playlist</span>
                        <h1 className="font-heading text-4xl md:text-5xl font-bold text-white mt-1 mb-2">
                            {playlist.name}
                        </h1>
                        {playlist.description && (
                            <p className="text-zinc-400 mb-2">{playlist.description}</p>
                        )}
                        <div className="flex items-center gap-2 text-zinc-400 text-sm">
                            <span>By {playlist.user_name}</span>
                            <span>•</span>
                            <span>{playlist.song_count} songs</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Actions */}
            <div className="px-8 py-6 flex items-center gap-4">
                <Button
                    onClick={handlePlayAll}
                    className="bg-lime text-black hover:bg-lime-dark rounded-full px-8 h-14 text-lg font-semibold"
                    disabled={!playlist.songs?.length}
                    data-testid="play-all-btn"
                >
                    <Play className="w-6 h-6 mr-2" fill="black" />
                    Play
                </Button>
                <Button
                    onClick={handleShuffle}
                    variant="outline"
                    className="rounded-full h-14 px-6 border-zinc-700 hover:border-zinc-600"
                    disabled={!playlist.songs?.length}
                    data-testid="shuffle-btn"
                >
                    <Shuffle className="w-5 h-5" />
                </Button>
                {isOwner && (
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button
                                variant="ghost"
                                className="rounded-full h-14 w-14"
                                data-testid="playlist-menu-btn"
                            >
                                <MoreHorizontal className="w-6 h-6" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="start" className="bg-zinc-900 border-zinc-800">
                            <DropdownMenuItem onClick={() => setEditDialog(true)} className="hover:bg-zinc-800">
                                <Edit2 className="w-4 h-4 mr-2" /> Edit Playlist
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={handleDelete} className="text-red-400 hover:bg-zinc-800">
                                <Trash2 className="w-4 h-4 mr-2" /> Delete Playlist
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                )}
            </div>

            {/* Songs */}
            <div className="px-8 pb-8">
                {playlist.songs?.length > 0 ? (
                    <div className="space-y-1">
                        {playlist.songs.map((song, index) => (
                            <div key={song.id} className="group flex items-center">
                                <div className="flex-1">
                                    <SongCard
                                        song={song}
                                        songs={playlist.songs}
                                        index={index}
                                        variant="list"
                                    />
                                </div>
                                {isOwner && (
                                    <button
                                        onClick={() => handleRemoveSong(song.id)}
                                        className="btn-ghost opacity-0 group-hover:opacity-100 text-zinc-400 hover:text-red-400 ml-2"
                                        data-testid={`remove-song-${song.id}`}
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                )}
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="empty-state" data-testid="empty-playlist">
                        <Music className="w-16 h-16 mx-auto text-zinc-600 mb-4" />
                        <h3 className="text-xl font-semibold text-white mb-2">This playlist is empty</h3>
                        <p className="text-zinc-400 mb-6">Find songs you love and add them here</p>
                        <Link to="/search" className="btn-primary inline-block">
                            Find Songs
                        </Link>
                    </div>
                )}
            </div>

            {/* Edit Dialog */}
            <Dialog open={editDialog} onOpenChange={setEditDialog}>
                <DialogContent className="bg-zinc-900 border-zinc-800">
                    <DialogHeader>
                        <DialogTitle className="text-white">Edit Playlist</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div>
                            <label className="text-sm font-medium text-zinc-300">Name</label>
                            <Input
                                value={editName}
                                onChange={(e) => setEditName(e.target.value)}
                                className="bg-zinc-800 border-zinc-700 text-white mt-1"
                                data-testid="edit-name-input"
                            />
                        </div>
                        <div>
                            <label className="text-sm font-medium text-zinc-300">Description</label>
                            <Input
                                value={editDescription}
                                onChange={(e) => setEditDescription(e.target.value)}
                                className="bg-zinc-800 border-zinc-700 text-white mt-1"
                                placeholder="Add a description"
                                data-testid="edit-description-input"
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="ghost" onClick={() => setEditDialog(false)}>Cancel</Button>
                        <Button onClick={handleEdit} className="bg-lime text-black hover:bg-lime-dark">
                            Save Changes
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default PlaylistDetail;
