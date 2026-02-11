import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { XCircle, ArrowLeft } from 'lucide-react';
import { Button } from '../../components/ui/button';
import Logo from '../../components/Logo';

const PaymentCancel = () => {
    const navigate = useNavigate();

    return (
        <div className="min-h-screen bg-background flex items-center justify-center p-4" data-testid="payment-cancel-page">
            <div className="max-w-md w-full text-center">
                <div className="flex justify-center mb-6">
                    <Logo size="large" showText={false} />
                </div>

                <div className="w-20 h-20 mx-auto bg-zinc-700/50 rounded-full flex items-center justify-center mb-6">
                    <XCircle className="w-12 h-12 text-zinc-400" />
                </div>
                
                <h1 className="font-heading text-3xl font-bold text-white mb-2">
                    Payment Cancelled
                </h1>
                <p className="text-zinc-400 mb-8">
                    Your payment was cancelled. No charges were made.
                </p>
                
                <div className="space-y-3">
                    <Button
                        onClick={() => navigate(-1)}
                        className="bg-gradient-to-r from-orange-500 to-amber-500 text-black hover:from-orange-600 hover:to-amber-600 w-full"
                        data-testid="try-again-btn"
                    >
                        <ArrowLeft className="w-4 h-4 mr-2" />
                        Go Back
                    </Button>
                    <Link to="/" className="block">
                        <Button variant="ghost" className="w-full">
                            Go Home
                        </Button>
                    </Link>
                </div>
            </div>
        </div>
    );
};

export default PaymentCancel;
