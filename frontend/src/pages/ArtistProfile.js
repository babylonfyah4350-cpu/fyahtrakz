import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';
import { Play, Shuffle, Music, Disc, Users } from 'lucide-react';
import { usePlayer } from '../contexts/PlayerContext';
import SongCard from '../components/SongCard';
import { Button } from '../components/ui/button';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const ArtistProfile = () => {
    const { id } = useParams();
    const { playSong } = usePlayer();
    const [artist, setArtist] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchArtist = async () => {
            try {
                const response = await axios.get(`${API}/artists/${id}`);
                setArtist(response.data);
            } catch (error) {
                console.error('Failed to fetch artist:', error);
            } finally {
                setLoading(false);
            }
        };
        fetchArtist();
    }, [id]);

    const handlePlayAll = () => {
        if (artist?.songs?.length > 0) {
            playSong(artist.songs[0], artist.songs, 0);
        }
    };

    const handleShuffle = () => {
        if (artist?.songs?.length > 0) {
            const randomIndex = Math.floor(Math.random() * artist.songs.length);
            playSong(artist.songs[randomIndex], artist.songs, randomIndex);
        }
    };

    if (loading) {
        return (
            <div className="p-8 animate-fade-in">
                <div className="flex items-end gap-6 mb-8">
                    <div className="w-48 h-48 skeleton rounded-full" />
                    <div>
                        <div className="h-8 w-32 skeleton rounded mb-4" />
                        <div className="h-12 w-64 skeleton rounded" />
                    </div>
                </div>
            </div>
        );
    }

    if (!artist) {
        return (
            <div className="p-8 text-center">
                <Users className="w-16 h-16 mx-auto text-zinc-600 mb-4" />
                <h2 className="text-xl font-semibold text-white mb-2">Artist not found</h2>
                <Link to="/artists" className="text-lime hover:underline">Browse artists</Link>
            </div>
        );
    }

    return (
        <div data-testid="artist-profile-page">
            {/* Hero Section */}
            <div className="relative h-80 overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-b from-purple/30 via-background/80 to-background" />
                <div className="absolute bottom-0 left-0 right-0 p-8 flex items-end gap-6">
                    {artist.avatar ? (
                        <img
                            src={artist.avatar}
                            alt={artist.name}
                            className="w-48 h-48 rounded-full object-cover shadow-2xl"
                        />
                    ) : (
                        <div className="w-48 h-48 rounded-full bg-gradient-to-br from-purple to-pink flex items-center justify-center shadow-2xl">
                            <span className="text-6xl font-bold text-white">
                                {artist.name?.charAt(0).toUpperCase()}
                            </span>
                        </div>
                    )}
                    <div>
                        <span className="text-sm font-medium text-zinc-300 uppercase tracking-wider">Artist</span>
                        <h1 className="font-heading text-5xl md:text-6xl font-bold text-white mt-1 mb-4">
                            {artist.name}
                        </h1>
                        <div className="flex items-center gap-4 text-zinc-400">
                            <span>{artist.song_count} songs</span>
                            <span>•</span>
                            <span>{artist.album_count} albums</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Action Buttons */}
            <div className="px-8 py-6 flex items-center gap-4">
                <Button
                    onClick={handlePlayAll}
                    className="bg-lime text-black hover:bg-lime-dark rounded-full px-8 h-14 text-lg font-semibold"
                    disabled={!artist.songs?.length}
                    data-testid="play-all-btn"
                >
                    <Play className="w-6 h-6 mr-2" fill="black" />
                    Play
                </Button>
                <Button
                    onClick={handleShuffle}
                    variant="outline"
                    className="rounded-full h-14 px-6 border-zinc-700 hover:border-zinc-600"
                    disabled={!artist.songs?.length}
                    data-testid="shuffle-btn"
                >
                    <Shuffle className="w-5 h-5" />
                </Button>
            </div>

            {/* Bio */}
            {artist.bio && (
                <div className="px-8 mb-8">
                    <p className="text-zinc-400 max-w-2xl">{artist.bio}</p>
                </div>
            )}

            {/* Popular Songs */}
            {artist.songs?.length > 0 && (
                <section className="px-8 mb-10" data-testid="artist-songs">
                    <h2 className="font-heading text-2xl font-bold text-white mb-4">Popular</h2>
                    <div className="space-y-1">
                        {artist.songs.slice(0, 10).map((song, index) => (
                            <SongCard
                                key={song.id}
                                song={song}
                                songs={artist.songs}
                                index={index}
                                variant="list"
                                showArtist={false}
                            />
                        ))}
                    </div>
                </section>
            )}

            {/* Albums */}
            {artist.albums?.length > 0 && (
                <section className="px-8 mb-10" data-testid="artist-albums">
                    <h2 className="font-heading text-2xl font-bold text-white mb-4">Albums</h2>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-5">
                        {artist.albums.map((album) => (
                            <Link
                                key={album.id}
                                to={`/album/${album.id}`}
                                className="song-card group"
                                data-testid={`album-card-${album.id}`}
                            >
                                <div className="relative mb-4">
                                    {album.cover_url ? (
                                        <img
                                            src={album.cover_url}
                                            alt={album.title}
                                            className="album-art w-full"
                                        />
                                    ) : (
                                        <div className="album-art w-full flex items-center justify-center">
                                            <Disc className="w-12 h-12 text-zinc-600" />
                                        </div>
                                    )}
                                </div>
                                <h3 className="font-semibold text-white truncate">{album.title}</h3>
                                <p className="text-sm text-zinc-400">{album.song_count} songs</p>
                            </Link>
                        ))}
                    </div>
                </section>
            )}

            {/* Empty State */}
            {(!artist.songs?.length && !artist.albums?.length) && (
                <div className="px-8 py-12 text-center">
                    <Music className="w-16 h-16 mx-auto text-zinc-600 mb-4" />
                    <p className="text-zinc-400">This artist hasn't uploaded any music yet</p>
                </div>
            )}
        </div>
    );
};

export default ArtistProfile;
