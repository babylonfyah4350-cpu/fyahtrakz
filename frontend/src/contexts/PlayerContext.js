import React, { createContext, useContext, useState, useRef, useCallback, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from './AuthContext';

const PlayerContext = createContext(null);

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export const PlayerProvider = ({ children }) => {
    const { token } = useAuth();
    const audioRef = useRef(new Audio());
    const [currentSong, setCurrentSong] = useState(null);
    const [queue, setQueue] = useState([]);
    const [queueIndex, setQueueIndex] = useState(0);
    const [isPlaying, setIsPlaying] = useState(false);
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);
    const [volume, setVolume] = useState(0.7);
    const [shuffle, setShuffle] = useState(false);
    const [repeat, setRepeat] = useState('none'); // none, one, all

    useEffect(() => {
        const audio = audioRef.current;
        
        const handleTimeUpdate = () => setCurrentTime(audio.currentTime);
        const handleLoadedMetadata = () => setDuration(audio.duration);
        const handleEnded = () => {
            if (repeat === 'one') {
                audio.currentTime = 0;
                audio.play();
            } else {
                playNext();
            }
        };

        audio.addEventListener('timeupdate', handleTimeUpdate);
        audio.addEventListener('loadedmetadata', handleLoadedMetadata);
        audio.addEventListener('ended', handleEnded);

        return () => {
            audio.removeEventListener('timeupdate', handleTimeUpdate);
            audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
            audio.removeEventListener('ended', handleEnded);
        };
    }, [repeat]);

    useEffect(() => {
        audioRef.current.volume = volume;
    }, [volume]);

    const recordPlay = async (songId) => {
        if (token) {
            try {
                await axios.post(`${API}/songs/${songId}/play`, {}, {
                    headers: { Authorization: `Bearer ${token}` }
                });
            } catch (error) {
                console.error('Failed to record play:', error);
            }
        }
    };

    const playSong = useCallback(async (song, songList = null, index = 0) => {
        const audio = audioRef.current;
        
        if (songList) {
            setQueue(songList);
            setQueueIndex(index);
        }
        
        setCurrentSong(song);
        audio.src = song.audio_url;
        
        try {
            await audio.play();
            setIsPlaying(true);
            recordPlay(song.id);
        } catch (error) {
            console.error('Playback failed:', error);
        }
    }, [token]);

    const togglePlay = useCallback(() => {
        const audio = audioRef.current;
        if (isPlaying) {
            audio.pause();
        } else {
            audio.play();
        }
        setIsPlaying(!isPlaying);
    }, [isPlaying]);

    const playNext = useCallback(() => {
        if (queue.length === 0) return;
        
        let nextIndex;
        if (shuffle) {
            nextIndex = Math.floor(Math.random() * queue.length);
        } else {
            nextIndex = queueIndex + 1;
            if (nextIndex >= queue.length) {
                if (repeat === 'all') {
                    nextIndex = 0;
                } else {
                    setIsPlaying(false);
                    return;
                }
            }
        }
        
        setQueueIndex(nextIndex);
        playSong(queue[nextIndex]);
    }, [queue, queueIndex, shuffle, repeat, playSong]);

    const playPrevious = useCallback(() => {
        if (queue.length === 0) return;
        
        const audio = audioRef.current;
        if (audio.currentTime > 3) {
            audio.currentTime = 0;
            return;
        }
        
        let prevIndex = queueIndex - 1;
        if (prevIndex < 0) {
            if (repeat === 'all') {
                prevIndex = queue.length - 1;
            } else {
                prevIndex = 0;
            }
        }
        
        setQueueIndex(prevIndex);
        playSong(queue[prevIndex]);
    }, [queue, queueIndex, repeat, playSong]);

    const seekTo = useCallback((time) => {
        audioRef.current.currentTime = time;
        setCurrentTime(time);
    }, []);

    const toggleShuffle = useCallback(() => {
        setShuffle(prev => !prev);
    }, []);

    const toggleRepeat = useCallback(() => {
        setRepeat(prev => {
            if (prev === 'none') return 'all';
            if (prev === 'all') return 'one';
            return 'none';
        });
    }, []);

    const addToQueue = useCallback((song) => {
        setQueue(prev => [...prev, song]);
    }, []);

    const value = {
        currentSong,
        queue,
        queueIndex,
        isPlaying,
        currentTime,
        duration,
        volume,
        shuffle,
        repeat,
        playSong,
        togglePlay,
        playNext,
        playPrevious,
        seekTo,
        setVolume,
        toggleShuffle,
        toggleRepeat,
        addToQueue,
        setQueue
    };

    return (
        <PlayerContext.Provider value={value}>
            {children}
        </PlayerContext.Provider>
    );
};

export const usePlayer = () => {
    const context = useContext(PlayerContext);
    if (!context) {
        throw new Error('usePlayer must be used within a PlayerProvider');
    }
    return context;
};
