import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Music, Check, CreditCard, Headphones } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { Button } from '../components/ui/button';
import Logo from '../components/Logo';
import { toast } from 'sonner';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const Subscribe = () => {
    const navigate = useNavigate();
    const { token, user, isAuthenticated } = useAuth();
    const [loading, setLoading] = useState(false);

    if (!isAuthenticated) {
        navigate('/login');
        return null;
    }

    if (user?.user_type === 'artist') {
        navigate('/');
        return null;
    }

    const handleSubscribe = async () => {
        setLoading(true);
        try {
            const response = await axios.post(
                `${API}/payments/subscription/checkout`,
                {
                    origin_url: window.location.origin,
                    payment_type: 'subscription'
                },
                { headers: { Authorization: `Bearer ${token}` } }
            );

            if (response.data.checkout_url) {
                window.location.href = response.data.checkout_url;
            }
        } catch (error) {
            console.error('Checkout error:', error);
            toast.error(error.response?.data?.detail || 'Failed to start checkout');
            setLoading(false);
        }
    };

    const features = [
        'Unlimited music streaming',
        'Access to all songs and albums',
        'Create unlimited playlists',
        'Personalized recommendations',
        'High quality audio',
        'Support independent artists'
    ];

    return (
        <div className="min-h-screen bg-background flex items-center justify-center p-4" data-testid="subscribe-page">
            <div className="max-w-lg w-full">
                <div className="text-center mb-8">
                    <div className="flex justify-center mb-4">
                        <Logo size="large" />
                    </div>
                    <h1 className="font-heading text-3xl md:text-4xl font-bold text-white mb-2">
                        Unlock the Music
                    </h1>
                    <p className="text-zinc-400">
                        Subscribe to FyahTrakz and start streaming
                    </p>
                </div>

                <div className="bg-gradient-to-br from-zinc-800/80 to-zinc-900/80 rounded-2xl p-8 border border-zinc-700/50">
                    <div className="flex items-center justify-between mb-6">
                        <div>
                            <h2 className="text-xl font-bold text-white">Monthly Subscription</h2>
                            <p className="text-zinc-400">Full access to all features</p>
                        </div>
                        <div className="text-right">
                            <div className="flex items-baseline gap-1">
                                <span className="text-3xl font-bold bg-gradient-to-r from-orange-500 to-amber-500 bg-clip-text text-transparent">
                                    $14.99
                                </span>
                                <span className="text-zinc-400">/mo</span>
                            </div>
                            <span className="text-xs text-zinc-500">AUD</span>
                        </div>
                    </div>

                    <div className="space-y-3 mb-8">
                        {features.map((feature, index) => (
                            <div key={index} className="flex items-center gap-3">
                                <div className="w-5 h-5 rounded-full bg-orange-500/20 flex items-center justify-center">
                                    <Check className="w-3 h-3 text-orange-500" />
                                </div>
                                <span className="text-zinc-300">{feature}</span>
                            </div>
                        ))}
                    </div>

                    <Button
                        onClick={handleSubscribe}
                        disabled={loading}
                        className="w-full bg-gradient-to-r from-orange-500 via-amber-500 to-yellow-500 text-black hover:from-orange-600 hover:via-amber-600 hover:to-yellow-600 h-14 text-lg font-semibold"
                        data-testid="subscribe-btn"
                    >
                        {loading ? (
                            <>Processing...</>
                        ) : (
                            <>
                                <CreditCard className="w-5 h-5 mr-2" />
                                Subscribe Now
                            </>
                        )}
                    </Button>

                    <p className="text-center text-xs text-zinc-500 mt-4">
                        Secure payment powered by Stripe. Cancel anytime.
                    </p>
                </div>

                <div className="mt-6 text-center">
                    <Button variant="ghost" onClick={() => navigate('/')}>
                        Maybe Later
                    </Button>
                </div>
            </div>
        </div>
    );
};

export default Subscribe;
