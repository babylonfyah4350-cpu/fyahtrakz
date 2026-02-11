import React from 'react';

const Logo = ({ size = 'default', showText = true, className = '' }) => {
    const sizes = {
        small: { icon: 32, text: 'text-lg' },
        default: { icon: 40, text: 'text-xl' },
        large: { icon: 56, text: 'text-2xl' },
    };

    const { icon, text } = sizes[size] || sizes.default;

    return (
        <div className={`flex items-center gap-3 ${className}`} data-testid="tunepulse-logo">
            <svg 
                width={icon} 
                height={icon} 
                viewBox="0 0 200 200" 
                xmlns="http://www.w3.org/2000/svg"
                className="flex-shrink-0"
            >
                <defs>
                    <linearGradient id="pulseGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" style={{ stopColor: '#ccf381', stopOpacity: 1 }} />
                        <stop offset="100%" style={{ stopColor: '#a8e063', stopOpacity: 1 }} />
                    </linearGradient>
                    <linearGradient id="darkGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" style={{ stopColor: '#18181b', stopOpacity: 1 }} />
                        <stop offset="100%" style={{ stopColor: '#09090b', stopOpacity: 1 }} />
                    </linearGradient>
                </defs>
                
                {/* Background circle */}
                <circle cx="100" cy="100" r="90" fill="url(#pulseGradient)"/>
                
                {/* Inner dark circle */}
                <circle cx="100" cy="100" r="70" fill="url(#darkGradient)"/>
                
                {/* Sound wave / pulse lines */}
                <g stroke="#ccf381" strokeWidth="4" strokeLinecap="round" fill="none">
                    {/* Left wave */}
                    <path d="M 55 100 Q 55 75, 55 70 Q 55 65, 55 100 Q 55 135, 55 130" opacity="0.6"/>
                    <path d="M 45 100 Q 45 60, 45 55 Q 45 50, 45 100 Q 45 150, 45 145" opacity="0.4"/>
                    
                    {/* Center bars (equalizer style) */}
                    <line x1="75" y1="120" x2="75" y2="80"/>
                    <line x1="90" y1="130" x2="90" y2="70"/>
                    <line x1="105" y1="140" x2="105" y2="60"/>
                    <line x1="120" y1="130" x2="120" y2="70"/>
                    <line x1="135" y1="120" x2="135" y2="80"/>
                    
                    {/* Right wave */}
                    <path d="M 155 100 Q 155 75, 155 70 Q 155 65, 155 100 Q 155 135, 155 130" opacity="0.6"/>
                    <path d="M 165 100 Q 165 60, 165 55 Q 165 50, 165 100 Q 165 150, 165 145" opacity="0.4"/>
                </g>
                
                {/* Pulse ring effect */}
                <circle cx="100" cy="100" r="85" fill="none" stroke="#ccf381" strokeWidth="2" opacity="0.3"/>
            </svg>
            
            {showText && (
                <span className={`font-heading ${text} font-bold text-white`}>
                    FyahTrakz
                </span>
            )}
        </div>
    );
};

export default Logo;
