import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { ListMusic, Globe, Lock } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { Input } from '../components/ui/input';
import { Button } from '../components/ui/button';
import { Textarea } from '../components/ui/textarea';
import { Switch } from '../components/ui/switch';
import { toast } from 'sonner';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const CreatePlaylist = () => {
    const navigate = useNavigate();
    const { token, isAuthenticated } = useAuth();
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [isPublic, setIsPublic] = useState(true);
    const [loading, setLoading] = useState(false);

    if (!isAuthenticated) {
        navigate('/login');
        return null;
    }

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!name.trim()) {
            toast.error('Please enter a playlist name');
            return;
        }

        setLoading(true);
        try {
            const response = await axios.post(`${API}/playlists`, {
                name: name.trim(),
                description: description.trim() || null,
                is_public: isPublic
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            toast.success('Playlist created!');
            navigate(`/playlist/${response.data.id}`);
        } catch (error) {
            toast.error(error.response?.data?.detail || 'Failed to create playlist');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="p-8 max-w-2xl mx-auto" data-testid="create-playlist-page">
            <div className="mb-8">
                <h1 className="font-heading text-4xl font-bold text-white mb-2">Create Playlist</h1>
                <p className="text-zinc-400">Organize your favorite music</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
                <div className="flex items-start gap-6">
                    <div className="w-40 h-40 rounded-xl bg-gradient-to-br from-lime/20 to-purple/20 flex items-center justify-center flex-shrink-0">
                        <ListMusic className="w-16 h-16 text-lime" />
                    </div>
                    <div className="flex-1 space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-zinc-300 mb-2">
                                Name *
                            </label>
                            <Input
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                placeholder="My awesome playlist"
                                className="bg-zinc-800 border-zinc-700 text-white h-12"
                                data-testid="playlist-name-input"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-zinc-300 mb-2">
                                Description
                            </label>
                            <Textarea
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                placeholder="What's this playlist about?"
                                className="bg-zinc-800 border-zinc-700 text-white min-h-[100px]"
                                data-testid="playlist-description-input"
                            />
                        </div>
                    </div>
                </div>

                <div className="flex items-center justify-between p-4 bg-zinc-800/50 rounded-xl">
                    <div className="flex items-center gap-3">
                        {isPublic ? (
                            <Globe className="w-5 h-5 text-lime" />
                        ) : (
                            <Lock className="w-5 h-5 text-zinc-400" />
                        )}
                        <div>
                            <p className="font-medium text-white">
                                {isPublic ? 'Public playlist' : 'Private playlist'}
                            </p>
                            <p className="text-sm text-zinc-400">
                                {isPublic
                                    ? 'Anyone can see and listen to this playlist'
                                    : 'Only you can see this playlist'}
                            </p>
                        </div>
                    </div>
                    <Switch
                        checked={isPublic}
                        onCheckedChange={setIsPublic}
                        data-testid="public-toggle"
                    />
                </div>

                <div className="flex gap-4 pt-4">
                    <Button
                        type="button"
                        variant="ghost"
                        onClick={() => navigate(-1)}
                        className="px-6"
                    >
                        Cancel
                    </Button>
                    <Button
                        type="submit"
                        disabled={loading || !name.trim()}
                        className="bg-lime text-black hover:bg-lime-dark px-8"
                        data-testid="create-playlist-submit"
                    >
                        {loading ? 'Creating...' : 'Create Playlist'}
                    </Button>
                </div>
            </form>
        </div>
    );
};

export default CreatePlaylist;
