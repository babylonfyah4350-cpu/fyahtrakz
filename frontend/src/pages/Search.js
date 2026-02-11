import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { Search as SearchIcon, Music, Mic2, Disc, ListMusic } from 'lucide-react';
import SongCard from '../components/SongCard';
import { Input } from '../components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const genreColors = {
    'Pop': 'from-pink-500 to-rose-500',
    'Rock': 'from-red-600 to-orange-600',
    'Hip Hop': 'from-purple-600 to-indigo-600',
    'Electronic': 'from-cyan-500 to-blue-500',
    'R&B': 'from-violet-500 to-purple-500',
    'Jazz': 'from-amber-500 to-yellow-500',
    'Classical': 'from-slate-500 to-gray-500',
    'Country': 'from-orange-500 to-amber-500',
    'Indie': 'from-teal-500 to-emerald-500',
    'Metal': 'from-zinc-600 to-stone-700',
};

const Search = () => {
    const [query, setQuery] = useState('');
    const [results, setResults] = useState(null);
    const [genres, setGenres] = useState([]);
    const [loading, setLoading] = useState(false);
    const [activeTab, setActiveTab] = useState('all');

    useEffect(() => {
        const fetchGenres = async () => {
            try {
                const response = await axios.get(`${API}/browse/genres`);
                setGenres(response.data);
            } catch (error) {
                console.error('Failed to fetch genres:', error);
            }
        };
        fetchGenres();
    }, []);

    const searchDebounced = useCallback(
        async (searchQuery) => {
            if (!searchQuery.trim()) {
                setResults(null);
                return;
            }
            
            setLoading(true);
            try {
                const response = await axios.get(`${API}/search`, {
                    params: { q: searchQuery }
                });
                setResults(response.data);
            } catch (error) {
                console.error('Search failed:', error);
            } finally {
                setLoading(false);
            }
        },
        []
    );

    useEffect(() => {
        const timer = setTimeout(() => {
            searchDebounced(query);
        }, 300);
        return () => clearTimeout(timer);
    }, [query, searchDebounced]);

    const hasResults = results && (
        results.songs?.length > 0 ||
        results.albums?.length > 0 ||
        results.artists?.length > 0 ||
        results.playlists?.length > 0
    );

    return (
        <div className="p-8" data-testid="search-page">
            {/* Search Header */}
            <div className="mb-8">
                <h1 className="font-heading text-4xl font-bold text-white mb-6">Search</h1>
                <div className="relative max-w-xl">
                    <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-400" />
                    <Input
                        type="text"
                        placeholder="What do you want to listen to?"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        className="pl-12 h-14 bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-500 rounded-full text-lg"
                        data-testid="search-input"
                    />
                </div>
            </div>

            {/* Search Results */}
            {query && (
                <div className="animate-fade-in">
                    {loading ? (
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            {[...Array(8)].map((_, i) => (
                                <div key={i} className="aspect-square skeleton rounded-xl" />
                            ))}
                        </div>
                    ) : hasResults ? (
                        <Tabs value={activeTab} onValueChange={setActiveTab}>
                            <TabsList className="bg-zinc-800/50 mb-6">
                                <TabsTrigger value="all" data-testid="tab-all">All</TabsTrigger>
                                <TabsTrigger value="songs" data-testid="tab-songs">Songs</TabsTrigger>
                                <TabsTrigger value="artists" data-testid="tab-artists">Artists</TabsTrigger>
                                <TabsTrigger value="albums" data-testid="tab-albums">Albums</TabsTrigger>
                                <TabsTrigger value="playlists" data-testid="tab-playlists">Playlists</TabsTrigger>
                            </TabsList>

                            <TabsContent value="all" className="space-y-8">
                                {/* Songs */}
                                {results.songs?.length > 0 && (
                                    <section>
                                        <h2 className="font-heading text-xl font-bold text-white mb-4 flex items-center gap-2">
                                            <Music className="w-5 h-5 text-lime" /> Songs
                                        </h2>
                                        <div className="space-y-1">
                                            {results.songs.slice(0, 5).map((song, index) => (
                                                <SongCard
                                                    key={song.id}
                                                    song={song}
                                                    songs={results.songs}
                                                    index={index}
                                                    variant="list"
                                                />
                                            ))}
                                        </div>
                                    </section>
                                )}

                                {/* Artists */}
                                {results.artists?.length > 0 && (
                                    <section>
                                        <h2 className="font-heading text-xl font-bold text-white mb-4 flex items-center gap-2">
                                            <Mic2 className="w-5 h-5 text-purple" /> Artists
                                        </h2>
                                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                                            {results.artists.slice(0, 6).map((artist) => (
                                                <Link
                                                    key={artist.id}
                                                    to={`/artist/${artist.id}`}
                                                    className="artist-card"
                                                    data-testid={`search-artist-${artist.id}`}
                                                >
                                                    <div className="artist-avatar bg-gradient-to-br from-purple to-pink flex items-center justify-center">
                                                        <span className="text-2xl font-bold text-white">
                                                            {artist.name?.charAt(0).toUpperCase()}
                                                        </span>
                                                    </div>
                                                    <h3 className="font-semibold text-white truncate">{artist.name}</h3>
                                                    <p className="text-sm text-zinc-500">Artist</p>
                                                </Link>
                                            ))}
                                        </div>
                                    </section>
                                )}

                                {/* Albums */}
                                {results.albums?.length > 0 && (
                                    <section>
                                        <h2 className="font-heading text-xl font-bold text-white mb-4 flex items-center gap-2">
                                            <Disc className="w-5 h-5 text-pink" /> Albums
                                        </h2>
                                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                                            {results.albums.slice(0, 6).map((album) => (
                                                <Link
                                                    key={album.id}
                                                    to={`/album/${album.id}`}
                                                    className="song-card group"
                                                    data-testid={`search-album-${album.id}`}
                                                >
                                                    <div className="album-art w-full mb-3 flex items-center justify-center bg-gradient-to-br from-zinc-700 to-zinc-800">
                                                        <Disc className="w-12 h-12 text-zinc-600" />
                                                    </div>
                                                    <h3 className="font-semibold text-white truncate">{album.title}</h3>
                                                    <p className="text-sm text-zinc-400 truncate">{album.artist_name}</p>
                                                </Link>
                                            ))}
                                        </div>
                                    </section>
                                )}
                            </TabsContent>

                            <TabsContent value="songs">
                                <div className="space-y-1">
                                    {results.songs?.map((song, index) => (
                                        <SongCard
                                            key={song.id}
                                            song={song}
                                            songs={results.songs}
                                            index={index}
                                            variant="list"
                                        />
                                    ))}
                                </div>
                            </TabsContent>

                            <TabsContent value="artists">
                                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                                    {results.artists?.map((artist) => (
                                        <Link
                                            key={artist.id}
                                            to={`/artist/${artist.id}`}
                                            className="artist-card"
                                        >
                                            <div className="artist-avatar bg-gradient-to-br from-purple to-pink flex items-center justify-center">
                                                <span className="text-2xl font-bold text-white">
                                                    {artist.name?.charAt(0).toUpperCase()}
                                                </span>
                                            </div>
                                            <h3 className="font-semibold text-white truncate">{artist.name}</h3>
                                            <p className="text-sm text-zinc-500">Artist</p>
                                        </Link>
                                    ))}
                                </div>
                            </TabsContent>

                            <TabsContent value="albums">
                                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                                    {results.albums?.map((album) => (
                                        <Link
                                            key={album.id}
                                            to={`/album/${album.id}`}
                                            className="song-card group"
                                        >
                                            <div className="album-art w-full mb-3 flex items-center justify-center bg-gradient-to-br from-zinc-700 to-zinc-800">
                                                <Disc className="w-12 h-12 text-zinc-600" />
                                            </div>
                                            <h3 className="font-semibold text-white truncate">{album.title}</h3>
                                            <p className="text-sm text-zinc-400 truncate">{album.artist_name}</p>
                                        </Link>
                                    ))}
                                </div>
                            </TabsContent>

                            <TabsContent value="playlists">
                                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                                    {results.playlists?.map((playlist) => (
                                        <Link
                                            key={playlist.id}
                                            to={`/playlist/${playlist.id}`}
                                            className="song-card group"
                                        >
                                            <div className="album-art w-full mb-3 flex items-center justify-center bg-gradient-to-br from-lime/20 to-purple/20">
                                                <ListMusic className="w-12 h-12 text-lime" />
                                            </div>
                                            <h3 className="font-semibold text-white truncate">{playlist.name}</h3>
                                            <p className="text-sm text-zinc-400 truncate">By {playlist.user_name}</p>
                                        </Link>
                                    ))}
                                </div>
                            </TabsContent>
                        </Tabs>
                    ) : (
                        <div className="text-center py-12">
                            <SearchIcon className="w-16 h-16 mx-auto text-zinc-600 mb-4" />
                            <p className="text-zinc-400">No results found for "{query}"</p>
                        </div>
                    )}
                </div>
            )}

            {/* Browse Genres */}
            {!query && genres.length > 0 && (
                <section data-testid="browse-genres">
                    <h2 className="font-heading text-2xl font-bold text-white mb-6">Browse by Genre</h2>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                        {genres.map((genre) => {
                            const colorClass = genreColors[genre] || 'from-zinc-600 to-zinc-700';
                            return (
                                <Link
                                    key={genre}
                                    to={`/genre/${encodeURIComponent(genre)}`}
                                    className={`relative h-32 rounded-xl bg-gradient-to-br ${colorClass} overflow-hidden group hover:scale-105 transition-transform`}
                                    data-testid={`genre-${genre}`}
                                >
                                    <div className="absolute inset-0 bg-black/20 group-hover:bg-black/10 transition-colors" />
                                    <span className="absolute bottom-4 left-4 font-heading font-bold text-xl text-white">
                                        {genre}
                                    </span>
                                </Link>
                            );
                        })}
                    </div>
                </section>
            )}

            {/* No genres available */}
            {!query && genres.length === 0 && (
                <div className="text-center py-12" data-testid="no-genres">
                    <Music className="w-16 h-16 mx-auto text-zinc-600 mb-4" />
                    <h3 className="text-xl font-semibold text-white mb-2">Discover Music</h3>
                    <p className="text-zinc-400">Search for your favorite songs, artists, and albums</p>
                </div>
            )}
        </div>
    );
};

export default Search;
