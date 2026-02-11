import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Upload, Music, Image, X, Disc, CreditCard, Coins } from 'lucide-react';
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
    const { token, isArtist, isAuthenticated, user } = useAuth();
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
    const [credits, setCredits] = useState(0);
    const [pricePerUpload, setPricePerUpload] = useState(2.99);
    const [buyingCredits, setBuyingCredits] = useState(false);

    useEffect(() => {
        if (!isAuthenticated || !isArtist) {
            navigate('/');
            return;
        }

        const fetchData = async () => {
            try {
                const [albumsRes, creditsRes] = await Promise.all([
                    axios.get(`${API}/albums`, { headers: { Authorization: `Bearer ${token}` } }),
                    axios.get(`${API}/payments/upload-credits`, { headers: { Authorization: `Bearer ${token}` } })
                ]);
                setAlbums(albumsRes.data);
                setCredits(creditsRes.data.credits);
                setPricePerUpload(creditsRes.data.price_per_upload);
            } catch (error) {
                console.error('Failed to fetch data:', error);
            }
        };
        fetchData();
    }, [token, isArtist, isAuthenticated, navigate]);

    const handleBuyCredits = async () => {
        setBuyingCredits(true);
        try {
            const response = await axios.post(
                `${API}/payments/upload/checkout`,
                { origin_url: window.location.origin },
                { headers: { Authorization: `Bearer ${token}` } }
            );

            if (response.data.checkout_url) {
                window.location.href = response.data.checkout_url;
            }
        } catch (error) {
            console.error('Checkout error:', error);
            toast.error(error.response?.data?.detail || 'Failed to start checkout');
            setBuyingCredits(false);
        }
    };

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

        if (credits <= 0) {
            toast.error('No upload credits. Please purchase credits first.');
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
            if (albumId && albumId !== 'none') {
                formData.append('album_id', albumId);
            }

            await axios.post(`${API}/songs`, formData, {
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'multipart/form-data'
                }
            });

            toast.success('Song uploaded successfully!');
            setCredits(prev => prev - 1);
            navigate('/artist/dashboard');
        } catch (error) {
            console.error('Upload failed:', error);
            if (error.response?.status === 402) {
                toast.error('No upload credits. Please purchase credits first.');
            } else {
                toast.error(error.response?.data?.detail || 'Failed to upload song');
            }
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

            {/* Credits Section */}
            <div className="bg-gradient-to-r from-orange-500/10 to-amber-500/10 border border-orange-500/30 rounded-xl p-6 mb-8">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-orange-500/20 rounded-xl flex items-center justify-center">
                            <Coins className="w-6 h-6 text-orange-500" />
                        </div>
                        <div>
                            <p className="text-zinc-400 text-sm">Upload Credits</p>
                            <p className="font-heading text-3xl font-bold text-white">{credits}</p>
                        </div>
                    </div>
                    <Button
                        onClick={handleBuyCredits}
                        disabled={buyingCredits}
                        className="bg-gradient-to-r from-orange-500 to-amber-500 text-black hover:from-orange-600 hover:to-amber-600"
                        data-testid="buy-credits-btn"
                    >
                        {buyingCredits ? (
                            'Processing...'
                        ) : (
                            <>
                                <CreditCard className="w-4 h-4 mr-2" />
                                Buy Credit (${pricePerUpload} AUD)
                            </>
                        )}
                    </Button>
                </div>
                {credits === 0 && (
                    <p className="text-orange-400 text-sm mt-3">
                        You need at least 1 credit to upload a song. Purchase credits to continue.
                    </p>
                )}
            </div>

            <form onSubmit={handleSubmit} className="space-y-8">
                {/* Audio Upload */}
                <div
                    onClick={() => credits > 0 && audioInputRef.current?.click()}
                    className={`relative border-2 border-dashed rounded-xl p-8 text-center transition-all ${
                        credits === 0 ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
                    } ${
                        audioFile
                            ? 'border-orange-500 bg-orange-500/5'
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
                        disabled={credits === 0}
                        data-testid="audio-input"
                    />
                    {audioFile ? (
                        <div className="flex items-center justify-center gap-4">
                            <div className="w-12 h-12 bg-orange-500/20 rounded-xl flex items-center justify-center">
                                <Music className="w-6 h-6 text-orange-500" />
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
                            <p className="text-white font-medium mb-1">
                                {credits > 0 ? 'Click to upload audio file' : 'Purchase credits to upload'}
                            </p>
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
                            onClick={() => credits > 0 && coverInputRef.current?.click()}
                            className={`relative aspect-square rounded-xl overflow-hidden transition-all ${
                                credits === 0 ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
                            } ${
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
                                disabled={credits === 0}
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
                                disabled={credits === 0}
                                data-testid="title-input"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-zinc-300 mb-2">
                                Genre *
                            </label>
                            <Select value={genre} onValueChange={setGenre} disabled={credits === 0}>
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
                            <Select value={albumId} onValueChange={setAlbumId} disabled={credits === 0}>
                                <SelectTrigger className="bg-zinc-800 border-zinc-700 text-white h-12" data-testid="album-select">
                                    <SelectValue placeholder="Select album or leave empty" />
                                </SelectTrigger>
                                <SelectContent className="bg-zinc-900 border-zinc-800">
                                    <SelectItem value="none" className="hover:bg-zinc-800">
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
                        disabled={loading || !audioFile || !title.trim() || !genre || credits === 0}
                        className="bg-gradient-to-r from-orange-500 to-amber-500 text-black hover:from-orange-600 hover:to-amber-600 px-8"
                        data-testid="upload-submit"
                    >
                        {loading ? 'Uploading...' : 'Upload Song (1 Credit)'}
                    </Button>
                </div>
            </form>
        </div>
    );
};

export default UploadMusic;
