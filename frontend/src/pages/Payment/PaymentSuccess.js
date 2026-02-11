import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { CheckCircle, XCircle, Loader2, Music, CreditCard } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { Button } from '../../components/ui/button';
import Logo from '../../components/Logo';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const PaymentSuccess = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const { token, user } = useAuth();
    const [status, setStatus] = useState('loading');
    const [paymentDetails, setPaymentDetails] = useState(null);
    const sessionId = searchParams.get('session_id');

    useEffect(() => {
        if (!sessionId || !token) {
            setStatus('error');
            return;
        }

        const pollPaymentStatus = async (attempts = 0) => {
            const maxAttempts = 10;
            const pollInterval = 2000;

            if (attempts >= maxAttempts) {
                setStatus('timeout');
                return;
            }

            try {
                const response = await axios.get(`${API}/payments/status/${sessionId}`, {
                    headers: { Authorization: `Bearer ${token}` }
                });

                setPaymentDetails(response.data);

                if (response.data.payment_status === 'paid') {
                    setStatus('success');
                } else if (response.data.status === 'expired') {
                    setStatus('expired');
                } else {
                    setTimeout(() => pollPaymentStatus(attempts + 1), pollInterval);
                }
            } catch (error) {
                console.error('Error checking payment:', error);
                if (attempts < maxAttempts - 1) {
                    setTimeout(() => pollPaymentStatus(attempts + 1), pollInterval);
                } else {
                    setStatus('error');
                }
            }
        };

        pollPaymentStatus();
    }, [sessionId, token]);

    const getRedirectPath = () => {
        if (paymentDetails?.payment_type === 'subscription') {
            return '/';
        } else if (paymentDetails?.payment_type === 'upload_credit') {
            return '/artist/upload';
        }
        return '/';
    };

    return (
        <div className="min-h-screen bg-background flex items-center justify-center p-4" data-testid="payment-success-page">
            <div className="max-w-md w-full text-center">
                <div className="flex justify-center mb-6">
                    <Logo size="large" showText={false} />
                </div>

                {status === 'loading' && (
                    <div className="animate-fade-in">
                        <Loader2 className="w-16 h-16 mx-auto text-orange-500 animate-spin mb-4" />
                        <h1 className="font-heading text-2xl font-bold text-white mb-2">
                            Processing Payment
                        </h1>
                        <p className="text-zinc-400">Please wait while we confirm your payment...</p>
                    </div>
                )}

                {status === 'success' && (
                    <div className="animate-fade-in">
                        <div className="w-20 h-20 mx-auto bg-green-500/20 rounded-full flex items-center justify-center mb-6">
                            <CheckCircle className="w-12 h-12 text-green-500" />
                        </div>
                        <h1 className="font-heading text-3xl font-bold text-white mb-2">
                            Payment Successful!
                        </h1>
                        <p className="text-zinc-400 mb-6">
                            {paymentDetails?.payment_type === 'subscription'
                                ? 'Welcome to FyahTrakz! You now have full access to stream music.'
                                : 'Your upload credit has been added. You can now upload your track!'}
                        </p>
                        <div className="bg-zinc-800/50 rounded-xl p-4 mb-6">
                            <div className="flex justify-between items-center">
                                <span className="text-zinc-400">Amount Paid</span>
                                <span className="font-semibold text-white">
                                    ${paymentDetails?.amount?.toFixed(2)} {paymentDetails?.currency?.toUpperCase()}
                                </span>
                            </div>
                        </div>
                        <Button
                            onClick={() => navigate(getRedirectPath())}
                            className="bg-gradient-to-r from-orange-500 to-amber-500 text-black hover:from-orange-600 hover:to-amber-600 w-full"
                            data-testid="continue-btn"
                        >
                            {paymentDetails?.payment_type === 'upload_credit' ? 'Upload Your Song' : 'Start Listening'}
                        </Button>
                    </div>
                )}

                {(status === 'error' || status === 'expired' || status === 'timeout') && (
                    <div className="animate-fade-in">
                        <div className="w-20 h-20 mx-auto bg-red-500/20 rounded-full flex items-center justify-center mb-6">
                            <XCircle className="w-12 h-12 text-red-500" />
                        </div>
                        <h1 className="font-heading text-3xl font-bold text-white mb-2">
                            {status === 'timeout' ? 'Payment Timeout' : 'Payment Failed'}
                        </h1>
                        <p className="text-zinc-400 mb-6">
                            {status === 'timeout'
                                ? 'We couldn\'t confirm your payment. Please check your email for confirmation.'
                                : 'Something went wrong with your payment. Please try again.'}
                        </p>
                        <div className="space-y-3">
                            <Button
                                onClick={() => navigate(-1)}
                                className="bg-gradient-to-r from-orange-500 to-amber-500 text-black hover:from-orange-600 hover:to-amber-600 w-full"
                            >
                                Try Again
                            </Button>
                            <Link to="/" className="block">
                                <Button variant="ghost" className="w-full">
                                    Go Home
                                </Button>
                            </Link>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default PaymentSuccess;
