import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { User, Camera, Music, Globe, Instagram, Twitter, Phone, ChevronDown, Save, ArrowLeft, Facebook } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { Input } from '../../components/ui/input';
import { Button } from '../../components/ui/button';
import { toast } from 'sonner';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

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
    // South Pacific Islands
    { code: '+679', country: 'Fiji' },
    { code: '+676', country: 'Tonga' },
    { code: '+685', country: 'Samoa' },
    { code: '+1-684', country: 'American Samoa' },
    { code: '+675', country: 'Papua New Guinea' },
    { code: '+677', country: 'Solomon Islands' },
    { code: '+678', country: 'Vanuatu' },
    { code: '+687', country: 'New Caledonia' },
    { code: '+689', country: 'French Polynesia' },
    { code: '+686', country: 'Kiribati' },
    { code: '+688', country: 'Tuvalu' },
    { code: '+674', country: 'Nauru' },
    { code: '+691', country: 'Micronesia' },
    { code: '+680', country: 'Palau' },
    { code: '+692', country: 'Marshall Islands' },
    { code: '+682', country: 'Cook Islands' },
    { code: '+683', country: 'Niue' },
    { code: '+690', country: 'Tokelau' },
    { code: '+1-670', country: 'N. Mariana Islands' },
    { code: '+1-671', country: 'Guam' },
    // Caribbean
    { code: '+1-876', country: 'Jamaica' },
    { code: '+1-868', country: 'Trinidad' },
    // Africa
    { code: '+234', country: 'Nigeria' },
    { code: '+233', country: 'Ghana' },
    { code: '+254', country: 'Kenya' },
    { code: '+27', country: 'South Africa' },
    { code: '+20', country: 'Egypt' },
    // Europe
    { code: '+49', country: 'Germany' },
    { code: '+33', country: 'France' },
    { code: '+34', country: 'Spain' },
    { code: '+39', country: 'Italy' },
    { code: '+31', country: 'Netherlands' },
    { code: '+46', country: 'Sweden' },
    { code: '+47', country: 'Norway' },
    // Asia
    { code: '+91', country: 'India' },
    { code: '+81', country: 'Japan' },
    { code: '+82', country: 'South Korea' },
    { code: '+86', country: 'China' },
    { code: '+63', country: 'Philippines' },
    { code: '+62', country: 'Indonesia' },
    { code: '+60', country: 'Malaysia' },
    { code: '+65', country: 'Singapore' },
    // Americas
    { code: '+55', country: 'Brazil' },
    { code: '+52', country: 'Mexico' },
    // Middle East
    { code: '+971', country: 'UAE' },
    { code: '+966', country: 'Saudi Arabia' },
];

const EditProfile = () => {
    const navigate = useNavigate();
    const { token, user, isArtist, isAuthenticated, refreshUser } = useAuth();
    const avatarInputRef = useRef(null);
    
    const [loading, setLoading] = useState(false);
    const [avatarPreview, setAvatarPreview] = useState(null);
    const [avatarFile, setAvatarFile] = useState(null);
    
    // Form fields
    const [name, setName] = useState('');
    const [bio, setBio] = useState('');
    const [genre, setGenre] = useState('');
    const [countryCode, setCountryCode] = useState('+61');
    const [phoneNumber, setPhoneNumber] = useState('');
    const [website, setWebsite] = useState('');
    const [instagram, setInstagram] = useState('');
    const [twitter, setTwitter] = useState('');
    const [facebook, setFacebook] = useState('');
    const [tiktok, setTiktok] = useState('');

    useEffect(() => {
        if (!isAuthenticated || !isArtist) {
            navigate('/');
            return;
        }
        
        // Populate form with current user data
        if (user) {
            setName(user.name || '');
            setBio(user.bio || '');
            setGenre(user.genre || '');
            setCountryCode(user.country_code || '+61');
            setPhoneNumber(user.phone_number || '');
            setWebsite(user.website || '');
            setInstagram(user.instagram || '');
            setTwitter(user.twitter || '');
            setFacebook(user.facebook || '');
            setTiktok(user.tiktok || '');
            setAvatarPreview(user.avatar || null);
        }
    }, [user, isAuthenticated, isArtist, navigate]);

    const handleAvatarChange = (e) => {
        const file = e.target.files?.[0];
        if (file) {
            if (!file.type.startsWith('image/')) {
                toast.error('Please select an image file');
                return;
            }
            if (file.size > 5 * 1024 * 1024) {
                toast.error('Image must be less than 5MB');
                return;
            }
            setAvatarFile(file);
            setAvatarPreview(URL.createObjectURL(file));
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (!name.trim()) {
            toast.error('Name is required');
            return;
        }

        setLoading(true);
        try {
            const formData = new FormData();
            formData.append('name', name.trim());
            formData.append('bio', bio);
            formData.append('genre', genre);
            formData.append('country_code', countryCode);
            formData.append('phone_number', phoneNumber);
            formData.append('website', website);
            formData.append('instagram', instagram);
            formData.append('twitter', twitter);
            formData.append('facebook', facebook);
            formData.append('tiktok', tiktok);
            
            if (avatarFile) {
                formData.append('avatar_file', avatarFile);
            }

            await axios.put(`${API}/auth/profile`, formData, {
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'multipart/form-data'
                }
            });

            toast.success('Profile updated successfully!');
            
            // Refresh user data in context
            if (refreshUser) {
                await refreshUser();
            }
            
            navigate('/artist/dashboard');
        } catch (error) {
            console.error('Update failed:', error);
            toast.error(error.response?.data?.detail || 'Failed to update profile');
        } finally {
            setLoading(false);
        }
    };

    if (!isArtist) {
        return null;
    }

    return (
        <div className="p-8 max-w-2xl mx-auto" data-testid="edit-profile-page">
            <div className="mb-8">
                <button
                    onClick={() => navigate(-1)}
                    className="flex items-center gap-2 text-zinc-400 hover:text-white mb-4"
                >
                    <ArrowLeft className="w-4 h-4" />
                    Back
                </button>
                <h1 className="font-heading text-4xl font-bold text-white mb-2">Edit Profile</h1>
                <p className="text-zinc-400">Update your artist profile and information</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-8">
                {/* Avatar Section */}
                <div className="flex items-center gap-6">
                    <div
                        onClick={() => avatarInputRef.current?.click()}
                        className="relative w-32 h-32 rounded-full overflow-hidden cursor-pointer group"
                    >
                        {avatarPreview ? (
                            <img
                                src={avatarPreview}
                                alt="Profile"
                                className="w-full h-full object-cover"
                            />
                        ) : (
                            <div className="w-full h-full bg-zinc-800 flex items-center justify-center">
                                <User className="w-12 h-12 text-zinc-600" />
                            </div>
                        )}
                        <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                            <Camera className="w-8 h-8 text-white" />
                        </div>
                        <input
                            ref={avatarInputRef}
                            type="file"
                            accept="image/*"
                            onChange={handleAvatarChange}
                            className="hidden"
                        />
                    </div>
                    <div>
                        <h3 className="font-medium text-white mb-1">Profile Photo</h3>
                        <p className="text-sm text-zinc-400">Click to upload a new photo</p>
                        <p className="text-xs text-zinc-500 mt-1">JPG, PNG. Max 5MB</p>
                    </div>
                </div>

                {/* Basic Info */}
                <div className="bg-zinc-800/50 rounded-xl p-6 space-y-4">
                    <h2 className="font-heading text-lg font-bold text-white flex items-center gap-2">
                        <User className="w-5 h-5 text-orange-500" /> Basic Information
                    </h2>
                    
                    <div>
                        <label className="block text-sm font-medium text-zinc-300 mb-2">
                            Artist / Stage Name *
                        </label>
                        <Input
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="Your artist name"
                            className="bg-zinc-900 border-zinc-700 text-white"
                            data-testid="edit-name-input"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-zinc-300 mb-2">
                            Bio
                        </label>
                        <textarea
                            value={bio}
                            onChange={(e) => setBio(e.target.value)}
                            placeholder="Tell listeners about yourself and your music..."
                            rows={4}
                            className="w-full bg-zinc-900 border border-zinc-700 text-white rounded-md px-4 py-3 resize-none focus:outline-none focus:ring-2 focus:ring-orange-500"
                            data-testid="edit-bio-input"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-zinc-300 mb-2">
                            <Music className="w-4 h-4 inline mr-1" /> Primary Genre
                        </label>
                        <div className="relative">
                            <select
                                value={genre}
                                onChange={(e) => setGenre(e.target.value)}
                                className="w-full h-12 bg-zinc-900 border border-zinc-700 text-white rounded-md px-4 pr-10 appearance-none focus:outline-none focus:ring-2 focus:ring-orange-500"
                                data-testid="edit-genre-select"
                            >
                                <option value="">Select your primary genre</option>
                                {GENRES.map((g) => (
                                    <option key={g} value={g}>{g}</option>
                                ))}
                            </select>
                            <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-400 pointer-events-none" />
                        </div>
                    </div>
                </div>

                {/* Contact Info */}
                <div className="bg-zinc-800/50 rounded-xl p-6 space-y-4">
                    <h2 className="font-heading text-lg font-bold text-white flex items-center gap-2">
                        <Phone className="w-5 h-5 text-orange-500" /> Contact Information
                    </h2>
                    
                    <div>
                        <label className="block text-sm font-medium text-zinc-300 mb-2">
                            Phone Number
                        </label>
                        <div className="flex gap-2">
                            <div className="relative w-32">
                                <select
                                    value={countryCode}
                                    onChange={(e) => setCountryCode(e.target.value)}
                                    className="w-full h-12 bg-zinc-900 border border-zinc-700 text-white rounded-md px-3 pr-8 appearance-none focus:outline-none focus:ring-2 focus:ring-orange-500 text-sm"
                                    data-testid="edit-country-code-select"
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
                                className="bg-zinc-900 border-zinc-700 text-white flex-1"
                                data-testid="edit-phone-input"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-zinc-300 mb-2">
                            <Globe className="w-4 h-4 inline mr-1" /> Website
                        </label>
                        <Input
                            type="url"
                            value={website}
                            onChange={(e) => setWebsite(e.target.value)}
                            placeholder="https://yourwebsite.com"
                            className="bg-zinc-900 border-zinc-700 text-white"
                            data-testid="edit-website-input"
                        />
                    </div>
                </div>

                {/* Social Links */}
                <div className="bg-zinc-800/50 rounded-xl p-6 space-y-4">
                    <h2 className="font-heading text-lg font-bold text-white">Social Links</h2>
                    
                    <div>
                        <label className="block text-sm font-medium text-zinc-300 mb-2">
                            <Instagram className="w-4 h-4 inline mr-1" /> Instagram
                        </label>
                        <div className="flex">
                            <span className="inline-flex items-center px-4 bg-zinc-900 border border-r-0 border-zinc-700 rounded-l-md text-zinc-400 text-sm">
                                @
                            </span>
                            <Input
                                value={instagram}
                                onChange={(e) => setInstagram(e.target.value.replace('@', ''))}
                                placeholder="username"
                                className="bg-zinc-900 border-zinc-700 text-white rounded-l-none"
                                data-testid="edit-instagram-input"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-zinc-300 mb-2">
                            <Twitter className="w-4 h-4 inline mr-1" /> Twitter / X
                        </label>
                        <div className="flex">
                            <span className="inline-flex items-center px-4 bg-zinc-900 border border-r-0 border-zinc-700 rounded-l-md text-zinc-400 text-sm">
                                @
                            </span>
                            <Input
                                value={twitter}
                                onChange={(e) => setTwitter(e.target.value.replace('@', ''))}
                                placeholder="username"
                                className="bg-zinc-900 border-zinc-700 text-white rounded-l-none"
                                data-testid="edit-twitter-input"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-zinc-300 mb-2">
                            <Facebook className="w-4 h-4 inline mr-1" /> Facebook
                        </label>
                        <div className="flex">
                            <span className="inline-flex items-center px-4 bg-zinc-900 border border-r-0 border-zinc-700 rounded-l-md text-zinc-400 text-sm">
                                facebook.com/
                            </span>
                            <Input
                                value={facebook}
                                onChange={(e) => setFacebook(e.target.value)}
                                placeholder="username or page"
                                className="bg-zinc-900 border-zinc-700 text-white rounded-l-none"
                                data-testid="edit-facebook-input"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-zinc-300 mb-2">
                            <svg className="w-4 h-4 inline mr-1" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-5.2 1.74 2.89 2.89 0 012.31-4.64 2.93 2.93 0 01.88.13V9.4a6.84 6.84 0 00-1-.05A6.33 6.33 0 005 20.1a6.34 6.34 0 0010.86-4.43v-7a8.16 8.16 0 004.77 1.52v-3.4a4.85 4.85 0 01-1-.1z"/>
                            </svg>
                            TikTok
                        </label>
                        <div className="flex">
                            <span className="inline-flex items-center px-4 bg-zinc-900 border border-r-0 border-zinc-700 rounded-l-md text-zinc-400 text-sm">
                                @
                            </span>
                            <Input
                                value={tiktok}
                                onChange={(e) => setTiktok(e.target.value.replace('@', ''))}
                                placeholder="username"
                                className="bg-zinc-900 border-zinc-700 text-white rounded-l-none"
                                data-testid="edit-tiktok-input"
                            />
                        </div>
                    </div>
                </div>

                {/* Submit Buttons */}
                <div className="flex gap-4">
                    <Button
                        type="button"
                        variant="ghost"
                        onClick={() => navigate(-1)}
                        className="px-6"
                    >
                        Cancel
                    </Button>
                    <Button
                        type="submit"
                        disabled={loading}
                        className="bg-gradient-to-r from-orange-500 to-amber-500 text-black hover:from-orange-600 hover:to-amber-600 px-8"
                        data-testid="save-profile-btn"
                    >
                        {loading ? 'Saving...' : <><Save className="w-4 h-4 mr-2" /> Save Changes</>}
                    </Button>
                </div>
            </form>
        </div>
    );
};

export default EditProfile;
