import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Music, Eye, EyeOff, Mic2, Headphones } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { Input } from '../../components/ui/input';
import { Button } from '../../components/ui/button';
import { toast } from 'sonner';

const Register = () => {
    const navigate = useNavigate();
    const { register } = useAuth();
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [userType, setUserType] = useState('listener');
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!name || !email || !password) {
            toast.error('Please fill in all fields');
            return;
        }

        if (password.length < 6) {
            toast.error('Password must be at least 6 characters');
            return;
        }

        setLoading(true);
        try {
            await register(email, password, name, userType);
            toast.success('Account created successfully!');
            navigate('/');
        } catch (error) {
            toast.error(error.response?.data?.detail || 'Registration failed');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center p-4 bg-background" data-testid="register-page">
            <div className="w-full max-w-md">
                {/* Logo */}
                <div className="text-center mb-8">
                    <div className="inline-flex items-center gap-3 mb-4">
                        <div className="w-12 h-12 bg-lime rounded-xl flex items-center justify-center">
                            <Music className="w-7 h-7 text-black" />
                        </div>
                        <span className="font-heading text-2xl font-bold text-white">TunePulse</span>
                    </div>
                    <h1 className="font-heading text-3xl font-bold text-white mb-2">Create account</h1>
                    <p className="text-zinc-400">Start your musical journey</p>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* User Type Selection */}
                    <div>
                        <label className="block text-sm font-medium text-zinc-300 mb-3">
                            I am a...
                        </label>
                        <div className="grid grid-cols-2 gap-3">
                            <button
                                type="button"
                                onClick={() => setUserType('listener')}
                                className={`p-4 rounded-xl border-2 transition-all ${
                                    userType === 'listener'
                                        ? 'border-lime bg-lime/10'
                                        : 'border-zinc-700 hover:border-zinc-600'
                                }`}
                                data-testid="user-type-listener"
                            >
                                <Headphones className={`w-6 h-6 mx-auto mb-2 ${
                                    userType === 'listener' ? 'text-lime' : 'text-zinc-400'
                                }`} />
                                <span className={`font-medium ${
                                    userType === 'listener' ? 'text-lime' : 'text-zinc-300'
                                }`}>Listener</span>
                            </button>
                            <button
                                type="button"
                                onClick={() => setUserType('artist')}
                                className={`p-4 rounded-xl border-2 transition-all ${
                                    userType === 'artist'
                                        ? 'border-purple bg-purple/10'
                                        : 'border-zinc-700 hover:border-zinc-600'
                                }`}
                                data-testid="user-type-artist"
                            >
                                <Mic2 className={`w-6 h-6 mx-auto mb-2 ${
                                    userType === 'artist' ? 'text-purple' : 'text-zinc-400'
                                }`} />
                                <span className={`font-medium ${
                                    userType === 'artist' ? 'text-purple' : 'text-zinc-300'
                                }`}>Artist</span>
                            </button>
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-zinc-300 mb-2">
                            {userType === 'artist' ? 'Artist Name' : 'Name'}
                        </label>
                        <Input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder={userType === 'artist' ? 'Your artist name' : 'Your name'}
                            className="bg-zinc-800 border-zinc-700 text-white h-12"
                            data-testid="name-input"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-zinc-300 mb-2">
                            Email
                        </label>
                        <Input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="Enter your email"
                            className="bg-zinc-800 border-zinc-700 text-white h-12"
                            data-testid="email-input"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-zinc-300 mb-2">
                            Password
                        </label>
                        <div className="relative">
                            <Input
                                type={showPassword ? 'text' : 'password'}
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="Create a password"
                                className="bg-zinc-800 border-zinc-700 text-white h-12 pr-12"
                                data-testid="password-input"
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

                    <Button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-lime text-black hover:bg-lime-dark h-12 font-semibold"
                        data-testid="register-submit"
                    >
                        {loading ? 'Creating account...' : 'Create Account'}
                    </Button>
                </form>

                <div className="mt-8 text-center">
                    <p className="text-zinc-400">
                        Already have an account?{' '}
                        <Link to="/login" className="text-lime hover:underline" data-testid="login-link">
                            Sign in
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    );
};

export default Register;
