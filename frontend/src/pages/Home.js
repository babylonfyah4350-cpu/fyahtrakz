import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { Music, TrendingUp, Sparkles, Clock, ChevronRight } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import SongCard from '../components/SongCard';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const Home = () => {
    const { user, token } = useAuth();
    const [recommendations, setRecommendations] = useState(null);
    const [featured, setFeatured] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [featuredRes] = await Promise.all([
                    axios.get(`${API}/browse/featured`)
                ]);
                setFeatured(featuredRes.data);

                if (token) {
                    const recRes = await axios.get(`${API}/recommendations`, {
                        headers: { Authorization: `Bearer ${token}` }
                    });
                    setRecommendations(recRes.data);
                }
            } catch (error) {
                console.error('Failed to fetch data:', error);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [token]);

    const getGreeting = () => {
        const hour = new Date().getHours();
        if (hour < 12) return 'Good morning';
        if (hour < 18) return 'Good afternoon';
        return 'Good evening';
    };

    if (loading) {
        return (
            <div className="p-8 animate-fade-in">
                <div className="h-12 w-64 skeleton rounded-lg mb-8" />
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                    {[...Array(8)].map((_, i) => (
                        <div key={i} className="aspect-square skeleton rounded-xl" />
                    ))}
                </div>
            </div>
        );
    }

    return (
        <div className="p-8" data-testid="home-page">
            {/* Hero Section */}
            <div className="mb-10">
                <h1 className="font-heading text-4xl md:text-5xl font-bold text-white mb-2 animate-slide-up">
                    {user ? `${getGreeting()}, ${user.name.split(' ')[0]}` : 'Discover New Music'}
                </h1>
                <p className="text-zinc-400 text-lg animate-slide-up stagger-1">
                    {user ? 'Here\'s what we think you\'ll love' : 'Sign in to get personalized recommendations'}
                </p>
            </div>

            {/* For You Section */}
            {recommendations?.for_you?.length > 0 && (
                <section className="mb-10 animate-slide-up stagger-2" data-testid="for-you-section">
                    <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center gap-3">
                            <Sparkles className="w-5 h-5 text-lime" />
                            <h2 className="font-heading text-2xl font-bold text-white">Made For You</h2>
                        </div>
                        <Link to="/recommendations" className="text-sm text-zinc-400 hover:text-white flex items-center gap-1">
                            See all <ChevronRight className="w-4 h-4" />
                        </Link>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-5">
                        {recommendations.for_you.slice(0, 6).map((song, index) => (
                            <SongCard
                                key={song.id}
                                song={song}
                                songs={recommendations.for_you}
                                index={index}
                            />
                        ))}
                    </div>
                </section>
            )}

            {/* Trending Section */}
            {recommendations?.trending?.length > 0 && (
                <section className="mb-10 animate-slide-up stagger-3" data-testid="trending-section">
                    <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center gap-3">
                            <TrendingUp className="w-5 h-5 text-pink" />
                            <h2 className="font-heading text-2xl font-bold text-white">Trending Now</h2>
                        </div>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-5">
                        {recommendations.trending.slice(0, 6).map((song, index) => (
                            <SongCard
                                key={song.id}
                                song={song}
                                songs={recommendations.trending}
                                index={index}
                            />
                        ))}
                    </div>
                </section>
            )}

            {/* New Releases */}
            {recommendations?.new_releases?.length > 0 && (
                <section className="mb-10 animate-slide-up stagger-4" data-testid="new-releases-section">
                    <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center gap-3">
                            <Clock className="w-5 h-5 text-purple" />
                            <h2 className="font-heading text-2xl font-bold text-white">New Releases</h2>
                        </div>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-5">
                        {recommendations.new_releases.slice(0, 6).map((song, index) => (
                            <SongCard
                                key={song.id}
                                song={song}
                                songs={recommendations.new_releases}
                                index={index}
                            />
                        ))}
                    </div>
                </section>
            )}

            {/* Top Artists */}
            {featured?.top_artists?.length > 0 && (
                <section className="mb-10 animate-slide-up stagger-5" data-testid="top-artists-section">
                    <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center gap-3">
                            <Music className="w-5 h-5 text-lime" />
                            <h2 className="font-heading text-2xl font-bold text-white">Popular Artists</h2>
                        </div>
                        <Link to="/artists" className="text-sm text-zinc-400 hover:text-white flex items-center gap-1">
                            See all <ChevronRight className="w-4 h-4" />
                        </Link>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-5">
                        {featured.top_artists.slice(0, 6).map((artist) => (
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
                                <p className="text-sm text-zinc-500">Artist</p>
                            </Link>
                        ))}
                    </div>
                </section>
            )}

            {/* Empty State for new users */}
            {!user && (!featured?.top_artists?.length) && (
                <div className="empty-state" data-testid="empty-home">
                    <Music className="w-16 h-16 mx-auto text-zinc-600 mb-4" />
                    <h3 className="text-xl font-semibold text-white mb-2">Welcome to TunePulse</h3>
                    <p className="text-zinc-400 mb-6">
                        Sign in to discover personalized music recommendations
                    </p>
                    <Link to="/login" className="btn-primary inline-block">
                        Get Started
                    </Link>
                </div>
            )}
        </div>
    );
};

export default Home;
