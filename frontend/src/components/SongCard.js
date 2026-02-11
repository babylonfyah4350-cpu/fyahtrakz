import React from 'react';
import { Play, Music, MoreHorizontal, PlusCircle } from 'lucide-react';
import { usePlayer } from '../contexts/PlayerContext';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from './ui/dropdown-menu';

const SongCard = ({ song, songs = [], index = 0, showArtist = true, variant = 'card' }) => {
    const { playSong, currentSong, isPlaying, addToQueue } = usePlayer();

    const isCurrentSong = currentSong?.id === song.id;

    const handlePlay = () => {
        playSong(song, songs.length > 0 ? songs : [song], index);
    };

    const formatDuration = (seconds) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    if (variant === 'list') {
        return (
            <div
                className={`group flex items-center gap-4 p-3 rounded-lg hover:bg-zinc-800/50 transition-all cursor-pointer ${
                    isCurrentSong ? 'bg-zinc-800/70' : ''
                }`}
                onClick={handlePlay}
                data-testid={`song-row-${song.id}`}
            >
                <div className="w-8 text-center">
                    {isCurrentSong && isPlaying ? (
                        <div className="flex items-center justify-center gap-0.5">
                            <div className="w-0.5 h-3 bg-lime visualizer-bar rounded-full" />
                            <div className="w-0.5 h-4 bg-lime visualizer-bar rounded-full" />
                            <div className="w-0.5 h-2 bg-lime visualizer-bar rounded-full" />
                        </div>
                    ) : (
                        <>
                            <span className="text-zinc-500 group-hover:hidden">{index + 1}</span>
                            <Play className="w-4 h-4 text-white hidden group-hover:block mx-auto" />
                        </>
                    )}
                </div>
                <div className="relative w-10 h-10 flex-shrink-0">
                    {song.cover_url ? (
                        <img
                            src={song.cover_url}
                            alt={song.title}
                            className="w-full h-full rounded object-cover"
                        />
                    ) : (
                        <div className="w-full h-full rounded bg-zinc-800 flex items-center justify-center">
                            <Music className="w-4 h-4 text-zinc-600" />
                        </div>
                    )}
                </div>
                <div className="flex-1 min-w-0">
                    <p className={`font-medium truncate ${isCurrentSong ? 'text-lime' : 'text-white'}`}>
                        {song.title}
                    </p>
                    {showArtist && (
                        <p className="text-sm text-zinc-400 truncate">{song.artist_name}</p>
                    )}
                </div>
                <span className="text-sm text-zinc-500">{formatDuration(song.duration)}</span>
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <button 
                            className="btn-ghost opacity-0 group-hover:opacity-100 transition-opacity"
                            onClick={(e) => e.stopPropagation()}
                            data-testid={`song-menu-${song.id}`}
                        >
                            <MoreHorizontal className="w-4 h-4" />
                        </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="bg-zinc-900 border-zinc-800">
                        <DropdownMenuItem 
                            onClick={(e) => { e.stopPropagation(); addToQueue(song); }}
                            className="hover:bg-zinc-800"
                        >
                            <PlusCircle className="w-4 h-4 mr-2" />
                            Add to Queue
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>
        );
    }

    return (
        <div
            className="song-card group"
            onClick={handlePlay}
            data-testid={`song-card-${song.id}`}
        >
            <div className="relative mb-4">
                {song.cover_url ? (
                    <img
                        src={song.cover_url}
                        alt={song.title}
                        className="album-art w-full"
                    />
                ) : (
                    <div className="album-art w-full flex items-center justify-center">
                        <Music className="w-12 h-12 text-zinc-600" />
                    </div>
                )}
                <div className="play-overlay absolute inset-0 flex items-center justify-center bg-black/40 rounded-lg">
                    <button
                        className={`w-12 h-12 rounded-full flex items-center justify-center transition-all ${
                            isCurrentSong && isPlaying
                                ? 'bg-lime animate-pulse-glow'
                                : 'bg-lime hover:scale-110 active:scale-95'
                        }`}
                        data-testid={`play-btn-${song.id}`}
                    >
                        <Play className="w-5 h-5 text-black ml-0.5" fill="black" />
                    </button>
                </div>
            </div>
            <h3 className={`font-semibold truncate mb-1 ${isCurrentSong ? 'text-lime' : 'text-white'}`}>
                {song.title}
            </h3>
            {showArtist && (
                <p className="text-sm text-zinc-400 truncate">{song.artist_name}</p>
            )}
            <p className="text-xs text-zinc-500 mt-1">{formatDuration(song.duration)}</p>
        </div>
    );
};

export default SongCard;
