import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Mic2, Music, Upload, BarChart3, ChevronDown, Phone } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { Input } from '../../components/ui/input';
import { Button } from '../../components/ui/button';
import { toast } from 'sonner';
import Logo from '../../components/Logo';

const GENRES = [
    'Hip-Hop/Rap',
    'R&B/Soul',
    'Pop',
    'Rock',
    'Electronic/EDM',
    'Jazz',
    'Classical',
    'Reggae',
    'Country',
    'Latin',
    'Afrobeats',
    'Dancehall',
    'Gospel',
    'Alternative',
    'Indie',
    'Metal',
    'Other'
];

const COUNTRY_CODES = [
    { code: '+1', country: 'US/Canada' },
    { code: '+44', country: 'UK' },
    { code: '+61', country: 'Australia' },
    { code: '+64', country: 'New Zealand' },
    { code: '+91', country: 'India' },
    { code: '+234', country: 'Nigeria' },
    { code: '+233', country: 'Ghana' },
    { code: '+254', country: 'Kenya' },
    { code: '+27', country: 'South Africa' },
    { code: '+1-876', country: 'Jamaica' },
    { code: '+1-868', country: 'Trinidad' },
    { code: '+49', country: 'Germany' },
    { code: '+33', country: 'France' },
    { code: '+34', country: 'Spain' },
    { code: '+39', country: 'Italy' },
    { code: '+31', country: 'Netherlands' },
    { code: '+46', country: 'Sweden' },
    { code: '+47', country: 'Norway' },
    { code: '+81', country: 'Japan' },
    { code: '+82', country: 'South Korea' },
    { code: '+86', country: 'China' },
    { code: '+55', country: 'Brazil' },
    { code: '+52', country: 'Mexico' },
    { code: '+63', country: 'Philippines' },
    { code: '+62', country: 'Indonesia' },
    { code: '+60', country: 'Malaysia' },
    { code: '+65', country: 'Singapore' },
    { code: '+971', country: 'UAE' },
    { code: '+966', country: 'Saudi Arabia' },
    { code: '+20', country: 'Egypt' },
];

const RegisterArtist = () => {
    const navigate = useNavigate();
    const { register } = useAuth();
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [bio, setBio] = useState('');
    const [genre, setGenre] = useState('');
    const [countryCode, setCountryCode] = useState('+61');
    const [phoneNumber, setPhoneNumber] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!name || !email || !password) {
            toast.error('Please fill in all required fields');
            return;
        }

        if (password.length < 6) {
            toast.error('Password must be at least 6 characters');
            return;
        }

        setLoading(true);
        try {
            await register(email, password, name, 'artist', bio, genre, countryCode, phoneNumber);
            toast.success('Welcome to FyahTrakz! Start uploading your music.');
            navigate('/artist/dashboard');
        } catch (error) {
            toast.error(error.response?.data?.detail || 'Registration failed');
        } finally {
            setLoading(false);
        }
    };

    const features = [
        { icon: Upload, text: 'Upload unlimited songs' },
        { icon: BarChart3, text: 'Track your plays & stats' },
        { icon: Music, text: 'Reach new listeners' },
    ];

    return (
        <div className="min-h-screen flex bg-background" data-testid="register-artist-page">
            {/* Left Side - Branding */}
            <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-orange-500/20 via-amber-500/10 to-background p-12 flex-col justify-between">
                <Logo size="large" />
                
                <div>
                    <h1 className="font-heading text-5xl font-bold text-white mb-4">
                        Share Your Music<br />With The World
                    </h1>
                    <p className="text-xl text-zinc-400 mb-8">
                        Join FyahTrakz as an artist and start building your fanbase today.
                    </p>
                    
                    <div className="space-y-4">
                        {features.map((feature, index) => (
                            <div key={index} className="flex items-center gap-4">
                                <div className="w-12 h-12 rounded-xl bg-orange-500/20 flex items-center justify-center">
                                    <feature.icon className="w-6 h-6 text-orange-500" />
                                </div>
                                <span className="text-lg text-zinc-300">{feature.text}</span>
                            </div>
                        ))}
                    </div>
                </div>

                <p className="text-zinc-500 text-sm">
                    Free uploads • Keep 100% of your rights
                </p>
            </div>

            {/* Right Side - Form */}
            <div className="flex-1 flex items-center justify-center p-8 overflow-y-auto">
                <div className="w-full max-w-md py-8">
                    {/* Mobile Logo */}
                    <div className="lg:hidden flex justify-center mb-8">
                        <Logo size="large" />
                    </div>

                    <div className="text-center mb-8">
                        <div className="inline-flex items-center gap-2 px-4 py-2 bg-orange-500/20 rounded-full mb-4">
                            <Mic2 className="w-5 h-5 text-orange-500" />
                            <span className="text-orange-500 font-medium">Artist Account</span>
                        </div>
                        <h2 className="font-heading text-3xl font-bold text-white mb-2">
                            Create Artist Account
                        </h2>
                        <p className="text-zinc-400">Start your music journey</p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-5">
                        <div>
                            <label className="block text-sm font-medium text-zinc-300 mb-2">
                                Artist / Stage Name <span className="text-orange-500">*</span>
                            </label>
                            <Input
                                type="text"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                placeholder="Your artist name"
                                className="bg-zinc-800 border-zinc-700 text-white h-12"
                                data-testid="artist-name-input"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-zinc-300 mb-2">
                                Email <span className="text-orange-500">*</span>
                            </label>
                            <Input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="your@email.com"
                                className="bg-zinc-800 border-zinc-700 text-white h-12"
                                data-testid="artist-email-input"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-zinc-300 mb-2">
                                Password <span className="text-orange-500">*</span>
                            </label>
                            <div className="relative">
                                <Input
                                    type={showPassword ? 'text' : 'password'}
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="Create a password (min 6 chars)"
                                    className="bg-zinc-800 border-zinc-700 text-white h-12 pr-12"
                                    data-testid="artist-password-input"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-white"
                                >
                                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                </button>
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-zinc-300 mb-2">
                                <Phone className="w-4 h-4 inline mr-1" /> Phone Number
                            </label>
                            <div className="flex gap-2">
                                <div className="relative w-32">
                                    <select
                                        value={countryCode}
                                        onChange={(e) => setCountryCode(e.target.value)}
                                        className="w-full h-12 bg-zinc-800 border border-zinc-700 text-white rounded-md px-3 pr-8 appearance-none focus:outline-none focus:ring-2 focus:ring-orange-500 text-sm"
                                        data-testid="artist-country-code-select"
                                    >
                                        {COUNTRY_CODES.map((c) => (
                                            <option key={c.code} value={c.code}>
                                                {c.code} {c.country}
                                            </option>
                                        ))}
                                    </select>
                                    <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400 pointer-events-none" />
                                </div>
                                <Input
                                    type="tel"
                                    value={phoneNumber}
                                    onChange={(e) => setPhoneNumber(e.target.value.replace(/[^0-9]/g, ''))}
                                    placeholder="Phone number"
                                    className="bg-zinc-800 border-zinc-700 text-white h-12 flex-1"
                                    data-testid="artist-phone-input"
                                />
                            </div>
                            <p className="text-xs text-zinc-500 mt-1">Optional - For account recovery & updates</p>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-zinc-300 mb-2">
                                Primary Genre
                            </label>
                            <div className="relative">
                                <select
                                    value={genre}
                                    onChange={(e) => setGenre(e.target.value)}
                                    className="w-full h-12 bg-zinc-800 border border-zinc-700 text-white rounded-md px-4 pr-10 appearance-none focus:outline-none focus:ring-2 focus:ring-orange-500"
                                    data-testid="artist-genre-select"
                                >
                                    <option value="">Select your primary genre</option>
                                    {GENRES.map((g) => (
                                        <option key={g} value={g}>{g}</option>
                                    ))}
                                </select>
                                <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-400 pointer-events-none" />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-zinc-300 mb-2">
                                Artist Bio
                            </label>
                            <textarea
                                value={bio}
                                onChange={(e) => setBio(e.target.value)}
                                placeholder="Tell listeners about yourself and your music..."
                                rows={3}
                                className="w-full bg-zinc-800 border border-zinc-700 text-white rounded-md px-4 py-3 resize-none focus:outline-none focus:ring-2 focus:ring-orange-500"
                                data-testid="artist-bio-input"
                            />
                            <p className="text-xs text-zinc-500 mt-1">Optional - You can add this later</p>
                        </div>

                        <Button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-gradient-to-r from-orange-500 to-amber-500 text-black hover:from-orange-600 hover:to-amber-600 h-12 font-semibold"
                            data-testid="artist-register-submit"
                        >
                            {loading ? 'Creating account...' : 'Create Artist Account'}
                        </Button>
                    </form>

                    <div className="mt-8 text-center space-y-4">
                        <p className="text-zinc-400">
                            Already have an account?{' '}
                            <Link to="/login" className="text-orange-500 hover:underline">
                                Sign in
                            </Link>
                        </p>
                        <p className="text-zinc-500 text-sm">
                            Want to listen instead?{' '}
                            <Link to="/register" className="text-zinc-400 hover:text-white">
                                Create listener account
                            </Link>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default RegisterArtist;
