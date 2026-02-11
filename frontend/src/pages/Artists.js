import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { Mic2 } from 'lucide-react';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const Artists = () => {
    const [artists, setArtists] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchArtists = async () => {
            try {
                const response = await axios.get(`${API}/artists`);
                setArtists(response.data);
            } catch (error) {
                console.error('Failed to fetch artists:', error);
            } finally {
                setLoading(false);
            }
        };
        fetchArtists();
    }, []);

    if (loading) {
        return (
            <div className="p-8 animate-fade-in">
                <div className="h-12 w-48 skeleton rounded-lg mb-8" />
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-6">
                    {[...Array(12)].map((_, i) => (
                        <div key={i} className="text-center">
                            <div className="w-32 h-32 mx-auto skeleton rounded-full mb-4" />
                            <div className="h-4 w-24 mx-auto skeleton rounded" />
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    return (
        <div className="p-8" data-testid="artists-page">
            <h1 className="font-heading text-4xl font-bold text-white mb-8">Browse Artists</h1>

            {artists.length > 0 ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6">
                    {artists.map((artist) => (
                        <Link
                            key={artist.id}
                            to={`/artist/${artist.id}`}
                            className="artist-card"
                            data-testid={`artist-card-${artist.id}`}
                        >
                            {artist.avatar ? (
                                <img
                                    src={artist.avatar}
                                    alt={artist.name}
                                    className="artist-avatar"
                                />
                            ) : (
                                <div className="artist-avatar bg-gradient-to-br from-purple to-pink flex items-center justify-center">
                                    <span className="text-3xl font-bold text-white">
                                        {artist.name?.charAt(0).toUpperCase()}
                                    </span>
                                </div>
                            )}
                            <h3 className="font-semibold text-white truncate">{artist.name}</h3>
                            <p className="text-sm text-zinc-500">{artist.song_count || 0} songs</p>
                        </Link>
                    ))}
                </div>
            ) : (
                <div className="empty-state" data-testid="no-artists">
                    <Mic2 className="w-16 h-16 mx-auto text-zinc-600 mb-4" />
                    <h3 className="text-xl font-semibold text-white mb-2">No artists yet</h3>
                    <p className="text-zinc-400">Be the first to share your music!</p>
                </div>
            )}
        </div>
    );
};

export default Artists;
