import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { Home, Search, Library, PlusCircle, Mic2, LogOut, Upload, BarChart3, Shield } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import Logo from '../Logo';

const Sidebar = () => {
    const { user, logout, isArtist } = useAuth();
    const navigate = useNavigate();
    const isAdmin = user?.user_type === 'admin';

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    const navItems = [
        { to: '/', icon: Home, label: 'Home' },
        { to: '/search', icon: Search, label: 'Search' },
        { to: '/library', icon: Library, label: 'Your Library' },
    ];

    const artistItems = [
        { to: '/artist/dashboard', icon: BarChart3, label: 'Dashboard' },
        { to: '/artist/upload', icon: Upload, label: 'Upload Music' },
    ];

    const adminItems = [
        { to: '/admin', icon: Shield, label: 'Admin Panel' },
    ];

    return (
        <aside className="sidebar" data-testid="sidebar">
            {/* Logo */}
            <div className="p-6">
                <Logo size="default" />
            </div>

            {/* Main Navigation */}
            <nav className="px-3 mb-6">
                {navItems.map(({ to, icon: Icon, label }) => (
                    <NavLink
                        key={to}
                        to={to}
                        className={({ isActive }) =>
                            `nav-item mb-1 ${isActive ? 'active' : ''}`
                        }
                        data-testid={`nav-${label.toLowerCase().replace(' ', '-')}`}
                    >
                        <Icon className="w-5 h-5" />
                        <span className="font-medium">{label}</span>
                    </NavLink>
                ))}
            </nav>

            {/* Playlist Section */}
            <div className="px-3 mb-6">
                <NavLink
                    to="/playlist/create"
                    className="nav-item mb-1 group"
                    data-testid="create-playlist-btn"
                >
                    <div className="w-8 h-8 bg-zinc-700 group-hover:bg-lime rounded flex items-center justify-center transition-colors">
                        <PlusCircle className="w-4 h-4 text-zinc-400 group-hover:text-black transition-colors" />
                    </div>
                    <span className="font-medium">Create Playlist</span>
                </NavLink>
            </div>

            {/* Artist Section */}
            {isArtist && (
                <div className="px-3 mb-6">
                    <h3 className="text-xs font-semibold uppercase tracking-widest text-zinc-500 px-3 mb-3">
                        Artist Tools
                    </h3>
                    {artistItems.map(({ to, icon: Icon, label }) => (
                        <NavLink
                            key={to}
                            to={to}
                            className={({ isActive }) =>
                                `nav-item mb-1 ${isActive ? 'active' : ''}`
                            }
                            data-testid={`nav-${label.toLowerCase().replace(' ', '-')}`}
                        >
                            <Icon className="w-5 h-5" />
                            <span className="font-medium">{label}</span>
                        </NavLink>
                    ))}
                </div>
            )}

            <div className="border-t border-zinc-800 mx-3 my-4" />

            {/* Browse Artists */}
            <div className="px-3 mb-6">
                <NavLink
                    to="/artists"
                    className={({ isActive }) =>
                        `nav-item mb-1 ${isActive ? 'active' : ''}`
                    }
                    data-testid="nav-artists"
                >
                    <Mic2 className="w-5 h-5" />
                    <span className="font-medium">Browse Artists</span>
                </NavLink>
            </div>

            {/* User Section */}
            <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-zinc-800 bg-background/80 backdrop-blur-sm">
                {user ? (
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple to-pink flex items-center justify-center">
                                <span className="text-xs font-bold text-white">
                                    {user.name?.charAt(0).toUpperCase()}
                                </span>
                            </div>
                            <div>
                                <p className="text-sm font-medium text-white truncate max-w-[120px]">{user.name}</p>
                                <p className="text-xs text-zinc-500 capitalize">{user.user_type}</p>
                            </div>
                        </div>
                        <button
                            onClick={handleLogout}
                            className="btn-ghost"
                            data-testid="logout-btn"
                            title="Logout"
                        >
                            <LogOut className="w-4 h-4" />
                        </button>
                    </div>
                ) : (
                    <NavLink
                        to="/login"
                        className="btn-primary w-full text-center block"
                        data-testid="login-btn"
                    >
                        Sign In
                    </NavLink>
                )}
            </div>
        </aside>
    );
};

export default Sidebar;
