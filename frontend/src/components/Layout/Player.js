import React from 'react';
import { 
    Play, Pause, SkipBack, SkipForward, Volume2, VolumeX, 
    Shuffle, Repeat, Repeat1, Heart, ListMusic, Music 
} from 'lucide-react';
import { usePlayer } from '../../contexts/PlayerContext';
import { Slider } from '../ui/slider';

const formatTime = (seconds) => {
    if (isNaN(seconds)) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
};

const Player = () => {
    const {
        currentSong,
        isPlaying,
        currentTime,
        duration,
        volume,
        shuffle,
        repeat,
        togglePlay,
        playNext,
        playPrevious,
        seekTo,
        setVolume,
        toggleShuffle,
        toggleRepeat
    } = usePlayer();

    if (!currentSong) {
        return (
            <div className="player-bar" data-testid="player-bar">
                <div className="flex items-center justify-center h-16">
                    <div className="flex items-center gap-3 text-zinc-500">
                        <Music className="w-5 h-5" />
                        <span className="text-sm">Select a song to start playing</span>
                    </div>
                </div>
            </div>
        );
    }

    const progress = duration ? (currentTime / duration) * 100 : 0;

    return (
        <div className="player-bar" data-testid="player-bar">
            <div className="flex items-center justify-between gap-4">
                {/* Song Info */}
                <div className="flex items-center gap-4 min-w-[200px] w-[30%]" data-testid="now-playing-info">
                    <div className="relative group">
                        {currentSong.cover_url ? (
                            <img
                                src={currentSong.cover_url}
                                alt={currentSong.title}
                                className="w-14 h-14 rounded-lg object-cover"
                            />
                        ) : (
                            <div className="w-14 h-14 rounded-lg bg-gradient-to-br from-zinc-700 to-zinc-800 flex items-center justify-center">
                                <Music className="w-6 h-6 text-zinc-500" />
                            </div>
                        )}
                        {isPlaying && (
                            <div className="absolute inset-0 flex items-center justify-center gap-0.5">
                                <div className="w-0.5 h-3 bg-lime visualizer-bar rounded-full" />
                                <div className="w-0.5 h-4 bg-lime visualizer-bar rounded-full" />
                                <div className="w-0.5 h-2 bg-lime visualizer-bar rounded-full" />
                                <div className="w-0.5 h-5 bg-lime visualizer-bar rounded-full" />
                            </div>
                        )}
                    </div>
                    <div className="overflow-hidden">
                        <p className="font-medium text-white truncate" data-testid="now-playing-title">
                            {currentSong.title}
                        </p>
                        <p className="text-sm text-zinc-400 truncate" data-testid="now-playing-artist">
                            {currentSong.artist_name}
                        </p>
                    </div>
                    <button className="btn-ghost text-zinc-400 hover:text-lime" data-testid="like-btn">
                        <Heart className="w-4 h-4" />
                    </button>
                </div>

                {/* Controls */}
                <div className="flex flex-col items-center gap-2 w-[40%]">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={toggleShuffle}
                            className={`btn-ghost ${shuffle ? 'text-lime' : 'text-zinc-400'}`}
                            data-testid="shuffle-btn"
                        >
                            <Shuffle className="w-4 h-4" />
                        </button>
                        <button
                            onClick={playPrevious}
                            className="btn-ghost text-zinc-400 hover:text-white"
                            data-testid="prev-btn"
                        >
                            <SkipBack className="w-5 h-5" fill="currentColor" />
                        </button>
                        <button
                            onClick={togglePlay}
                            className="w-10 h-10 bg-white rounded-full flex items-center justify-center hover:scale-105 active:scale-95 transition-transform"
                            data-testid="play-pause-btn"
                        >
                            {isPlaying ? (
                                <Pause className="w-5 h-5 text-black" fill="black" />
                            ) : (
                                <Play className="w-5 h-5 text-black ml-0.5" fill="black" />
                            )}
                        </button>
                        <button
                            onClick={playNext}
                            className="btn-ghost text-zinc-400 hover:text-white"
                            data-testid="next-btn"
                        >
                            <SkipForward className="w-5 h-5" fill="currentColor" />
                        </button>
                        <button
                            onClick={toggleRepeat}
                            className={`btn-ghost ${repeat !== 'none' ? 'text-lime' : 'text-zinc-400'}`}
                            data-testid="repeat-btn"
                        >
                            {repeat === 'one' ? (
                                <Repeat1 className="w-4 h-4" />
                            ) : (
                                <Repeat className="w-4 h-4" />
                            )}
                        </button>
                    </div>

                    {/* Progress Bar */}
                    <div className="flex items-center gap-2 w-full max-w-[500px]">
                        <span className="text-xs text-zinc-400 w-10 text-right" data-testid="current-time">
                            {formatTime(currentTime)}
                        </span>
                        <div className="flex-1">
                            <Slider
                                value={[progress]}
                                max={100}
                                step={0.1}
                                onValueChange={([value]) => seekTo((value / 100) * duration)}
                                className="cursor-pointer"
                                data-testid="progress-slider"
                            />
                        </div>
                        <span className="text-xs text-zinc-400 w-10" data-testid="duration">
                            {formatTime(duration)}
                        </span>
                    </div>
                </div>

                {/* Volume & Queue */}
                <div className="flex items-center justify-end gap-3 min-w-[200px] w-[30%]">
                    <button className="btn-ghost text-zinc-400 hover:text-white" data-testid="queue-btn">
                        <ListMusic className="w-4 h-4" />
                    </button>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => setVolume(volume === 0 ? 0.7 : 0)}
                            className="btn-ghost text-zinc-400 hover:text-white"
                            data-testid="volume-btn"
                        >
                            {volume === 0 ? (
                                <VolumeX className="w-4 h-4" />
                            ) : (
                                <Volume2 className="w-4 h-4" />
                            )}
                        </button>
                        <div className="w-24">
                            <Slider
                                value={[volume * 100]}
                                max={100}
                                step={1}
                                onValueChange={([value]) => setVolume(value / 100)}
                                data-testid="volume-slider"
                            />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Player;
