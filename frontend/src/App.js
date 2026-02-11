import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'sonner';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { PlayerProvider } from './contexts/PlayerContext';

// Layout
import Sidebar from './components/Layout/Sidebar';
import Player from './components/Layout/Player';

// Pages
import Home from './pages/Home';
import Search from './pages/Search';
import Library from './pages/Library';
import Login from './pages/Auth/Login';
import Register from './pages/Auth/Register';
import ArtistProfile from './pages/ArtistProfile';
import Artists from './pages/Artists';
import PlaylistDetail from './pages/PlaylistDetail';
import CreatePlaylist from './pages/CreatePlaylist';
import ArtistDashboard from './pages/Artist/Dashboard';
import UploadMusic from './pages/Artist/UploadMusic';

import './App.css';

const ProtectedRoute = ({ children, requireArtist = false }) => {
    const { isAuthenticated, isArtist, loading } = useAuth();

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-background">
                <div className="w-12 h-12 border-4 border-lime border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    if (!isAuthenticated) {
        return <Navigate to="/login" />;
    }

    if (requireArtist && !isArtist) {
        return <Navigate to="/" />;
    }

    return children;
};

const AppLayout = ({ children }) => {
    return (
        <div className="app-container">
            <Sidebar />
            <main className="main-content">
                {children}
            </main>
            <Player />
        </div>
    );
};

const AuthLayout = ({ children }) => {
    return (
        <div className="min-h-screen bg-background">
            {children}
        </div>
    );
};

const AppRoutes = () => {
    const { isAuthenticated } = useAuth();

    return (
        <Routes>
            {/* Auth Routes */}
            <Route
                path="/login"
                element={
                    isAuthenticated ? (
                        <Navigate to="/" />
                    ) : (
                        <AuthLayout>
                            <Login />
                        </AuthLayout>
                    )
                }
            />
            <Route
                path="/register"
                element={
                    isAuthenticated ? (
                        <Navigate to="/" />
                    ) : (
                        <AuthLayout>
                            <Register />
                        </AuthLayout>
                    )
                }
            />

            {/* Main App Routes */}
            <Route
                path="/"
                element={
                    <AppLayout>
                        <Home />
                    </AppLayout>
                }
            />
            <Route
                path="/search"
                element={
                    <AppLayout>
                        <Search />
                    </AppLayout>
                }
            />
            <Route
                path="/library"
                element={
                    <ProtectedRoute>
                        <AppLayout>
                            <Library />
                        </AppLayout>
                    </ProtectedRoute>
                }
            />
            <Route
                path="/artists"
                element={
                    <AppLayout>
                        <Artists />
                    </AppLayout>
                }
            />
            <Route
                path="/artist/:id"
                element={
                    <AppLayout>
                        <ArtistProfile />
                    </AppLayout>
                }
            />
            <Route
                path="/playlist/create"
                element={
                    <ProtectedRoute>
                        <AppLayout>
                            <CreatePlaylist />
                        </AppLayout>
                    </ProtectedRoute>
                }
            />
            <Route
                path="/playlist/:id"
                element={
                    <ProtectedRoute>
                        <AppLayout>
                            <PlaylistDetail />
                        </AppLayout>
                    </ProtectedRoute>
                }
            />

            {/* Artist Routes */}
            <Route
                path="/artist/dashboard"
                element={
                    <ProtectedRoute requireArtist>
                        <AppLayout>
                            <ArtistDashboard />
                        </AppLayout>
                    </ProtectedRoute>
                }
            />
            <Route
                path="/artist/upload"
                element={
                    <ProtectedRoute requireArtist>
                        <AppLayout>
                            <UploadMusic />
                        </AppLayout>
                    </ProtectedRoute>
                }
            />

            {/* Catch all */}
            <Route path="*" element={<Navigate to="/" />} />
        </Routes>
    );
};

function App() {
    return (
        <BrowserRouter>
            <AuthProvider>
                <PlayerProvider>
                    <AppRoutes />
                    <Toaster
                        position="top-center"
                        toastOptions={{
                            style: {
                                background: '#18181b',
                                color: '#fafafa',
                                border: '1px solid #27272a',
                            },
                        }}
                    />
                </PlayerProvider>
            </AuthProvider>
        </BrowserRouter>
    );
}

export default App;
