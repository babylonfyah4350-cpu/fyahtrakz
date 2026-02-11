import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Upload, Music, Image, X, Disc } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { Input } from '../../components/ui/input';
import { Button } from '../../components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { toast } from 'sonner';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const GENRES = [
    'Pop', 'Rock', 'Hip Hop', 'Electronic', 'R&B', 
    'Jazz', 'Classical', 'Country', 'Indie', 'Metal', 
    'Folk', 'Blues', 'Reggae', 'Latin', 'Soul'
];

const UploadMusic = () => {
    const navigate = useNavigate();
    const { token, isArtist, isAuthenticated } = useAuth();
    const audioInputRef = useRef(null);
    const coverInputRef = useRef(null);

    const [title, setTitle] = useState('');
    const [genre, setGenre] = useState('');
    const [albumId, setAlbumId] = useState('');
    const [audioFile, setAudioFile] = useState(null);
    const [coverFile, setCoverFile] = useState(null);
    const [coverPreview, setCoverPreview] = useState(null);
    const [duration, setDuration] = useState(0);
    const [albums, setAlbums] = useState([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (!isAuthenticated || !isArtist) {
            navigate('/');
            return;
        }

        const fetchAlbums = async () => {
            try {
                const response = await axios.get(`${API}/albums`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                setAlbums(response.data);
            } catch (error) {
                console.error('Failed to fetch albums:', error);
            }
        };
        fetchAlbums();
    }, [token, isArtist, isAuthenticated, navigate]);

    const handleAudioChange = (e) => {
        const file = e.target.files?.[0];
        if (file) {
            if (!file.type.startsWith('audio/')) {
                toast.error('Please select an audio file');
                return;
            }
            setAudioFile(file);
            
            // Get duration
            const audio = new Audio();
            audio.src = URL.createObjectURL(file);
            audio.onloadedmetadata = () => {
                setDuration(Math.round(audio.duration));
            };
        }
    };

    const handleCoverChange = (e) => {
        const file = e.target.files?.[0];
        if (file) {
            if (!file.type.startsWith('image/')) {
                toast.error('Please select an image file');
                return;
            }
            setCoverFile(file);
            setCoverPreview(URL.createObjectURL(file));
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (!title.trim() || !genre || !audioFile) {
            toast.error('Please fill in all required fields');
            return;
        }

        setLoading(true);
        try {
            const formData = new FormData();
            formData.append('title', title.trim());
            formData.append('genre', genre);
            formData.append('duration', duration);
            formData.append('audio_file', audioFile);
            if (coverFile) {
                formData.append('cover_file', coverFile);
            }
            if (albumId) {
                formData.append('album_id', albumId);
            }

            await axios.post(`${API}/songs`, formData, {
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'multipart/form-data'
                }
            });

            toast.success('Song uploaded successfully!');
            navigate('/artist/dashboard');
        } catch (error) {
            console.error('Upload failed:', error);
            toast.error(error.response?.data?.detail || 'Failed to upload song');
        } finally {
            setLoading(false);
        }
    };

    const formatDuration = (seconds) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    if (!isArtist) {
        return null;
    }

    return (
        <div className="p-8 max-w-3xl mx-auto" data-testid="upload-music-page">
            <div className="mb-8">
                <h1 className="font-heading text-4xl font-bold text-white mb-2">Upload Music</h1>
                <p className="text-zinc-400">Share your music with the world</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-8">
                {/* Audio Upload */}
                <div
                    onClick={() => audioInputRef.current?.click()}
                    className={`relative border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all ${
                        audioFile
                            ? 'border-lime bg-lime/5'
                            : 'border-zinc-700 hover:border-zinc-600'
                    }`}
                    data-testid="audio-upload-area"
                >
                    <input
                        ref={audioInputRef}
                        type="file"
                        accept="audio/*"
                        onChange={handleAudioChange}
                        className="hidden"
                        data-testid="audio-input"
                    />
                    {audioFile ? (
                        <div className="flex items-center justify-center gap-4">
                            <div className="w-12 h-12 bg-lime/20 rounded-xl flex items-center justify-center">
                                <Music className="w-6 h-6 text-lime" />
                            </div>
                            <div className="text-left">
                                <p className="font-medium text-white">{audioFile.name}</p>
                                <p className="text-sm text-zinc-400">
                                    Duration: {formatDuration(duration)}
                                </p>
                            </div>
                            <button
                                type="button"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setAudioFile(null);
                                    setDuration(0);
                                }}
                                className="ml-auto btn-ghost text-zinc-400 hover:text-red-400"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                    ) : (
                        <>
                            <Upload className="w-12 h-12 mx-auto text-zinc-500 mb-4" />
                            <p className="text-white font-medium mb-1">Click to upload audio file</p>
                            <p className="text-sm text-zinc-500">MP3, WAV, M4A supported</p>
                        </>
                    )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Cover Image */}
                    <div>
                        <label className="block text-sm font-medium text-zinc-300 mb-2">
                            Cover Image
                        </label>
                        <div
                            onClick={() => coverInputRef.current?.click()}
                            className={`relative aspect-square rounded-xl cursor-pointer overflow-hidden transition-all ${
                                coverPreview
                                    ? ''
                                    : 'border-2 border-dashed border-zinc-700 hover:border-zinc-600'
                            }`}
                            data-testid="cover-upload-area"
                        >
                            <input
                                ref={coverInputRef}
                                type="file"
                                accept="image/*"
                                onChange={handleCoverChange}
                                className="hidden"
                                data-testid="cover-input"
                            />
                            {coverPreview ? (
                                <>
                                    <img
                                        src={coverPreview}
                                        alt="Cover preview"
                                        className="w-full h-full object-cover"
                                    />
                                    <button
                                        type="button"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setCoverFile(null);
                                            setCoverPreview(null);
                                        }}
                                        className="absolute top-2 right-2 w-8 h-8 bg-black/50 rounded-full flex items-center justify-center text-white hover:bg-black/70"
                                    >
                                        <X className="w-4 h-4" />
                                    </button>
                                </>
                            ) : (
                                <div className="flex flex-col items-center justify-center h-full">
                                    <Image className="w-10 h-10 text-zinc-500 mb-2" />
                                    <p className="text-sm text-zinc-500">Add cover</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Song Details */}
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-zinc-300 mb-2">
                                Song Title *
                            </label>
                            <Input
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                placeholder="Enter song title"
                                className="bg-zinc-800 border-zinc-700 text-white h-12"
                                data-testid="title-input"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-zinc-300 mb-2">
                                Genre *
                            </label>
                            <Select value={genre} onValueChange={setGenre}>
                                <SelectTrigger className="bg-zinc-800 border-zinc-700 text-white h-12" data-testid="genre-select">
                                    <SelectValue placeholder="Select genre" />
                                </SelectTrigger>
                                <SelectContent className="bg-zinc-900 border-zinc-800">
                                    {GENRES.map((g) => (
                                        <SelectItem key={g} value={g} className="hover:bg-zinc-800">
                                            {g}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-zinc-300 mb-2">
                                Album (Optional)
                            </label>
                            <Select value={albumId} onValueChange={setAlbumId}>
                                <SelectTrigger className="bg-zinc-800 border-zinc-700 text-white h-12" data-testid="album-select">
                                    <SelectValue placeholder="Select album or leave empty" />
                                </SelectTrigger>
                                <SelectContent className="bg-zinc-900 border-zinc-800">
                                    <SelectItem value="" className="hover:bg-zinc-800">
                                        No album (Single)
                                    </SelectItem>
                                    {albums.map((album) => (
                                        <SelectItem key={album.id} value={album.id} className="hover:bg-zinc-800">
                                            <div className="flex items-center gap-2">
                                                <Disc className="w-4 h-4" />
                                                {album.title}
                                            </div>
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
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
                        disabled={loading || !audioFile || !title.trim() || !genre}
                        className="bg-lime text-black hover:bg-lime-dark px-8"
                        data-testid="upload-submit"
                    >
                        {loading ? 'Uploading...' : 'Upload Song'}
                    </Button>
                </div>
            </form>
        </div>
    );
};

export default UploadMusic;
