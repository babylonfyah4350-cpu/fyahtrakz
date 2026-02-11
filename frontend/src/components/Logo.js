import React from 'react';

const Logo = ({ size = 'default', showText = true, className = '' }) => {
    const sizes = {
        small: { icon: 32, text: 'text-lg' },
        default: { icon: 40, text: 'text-xl' },
        large: { icon: 56, text: 'text-2xl' },
    };

    const { icon, text } = sizes[size] || sizes.default;

    return (
        <div className={`flex items-center gap-3 ${className}`} data-testid="fyahtrakz-logo">
            <svg 
                width={icon} 
                height={icon} 
                viewBox="0 0 200 200" 
                xmlns="http://www.w3.org/2000/svg"
                className="flex-shrink-0"
            >
                <defs>
                    <linearGradient id="fireGradient" x1="0%" y1="100%" x2="100%" y2="0%">
                        <stop offset="0%" style={{ stopColor: '#ff4500', stopOpacity: 1 }} />
                        <stop offset="50%" style={{ stopColor: '#ff8c00', stopOpacity: 1 }} />
                        <stop offset="100%" style={{ stopColor: '#ffd700', stopOpacity: 1 }} />
                    </linearGradient>
                    <linearGradient id="darkGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" style={{ stopColor: '#1a1a1a', stopOpacity: 1 }} />
                        <stop offset="100%" style={{ stopColor: '#0d0d0d', stopOpacity: 1 }} />
                    </linearGradient>
                </defs>
                
                {/* Background circle */}
                <circle cx="100" cy="100" r="90" fill="url(#fireGradient)"/>
                
                {/* Inner dark circle */}
                <circle cx="100" cy="100" r="70" fill="url(#darkGradient)"/>
                
                {/* Sound wave / equalizer bars - fire style */}
                <g stroke="url(#fireGradient)" strokeWidth="5" strokeLinecap="round" fill="none">
                    {/* Center bars (equalizer style) */}
                    <line x1="60" y1="125" x2="60" y2="95"/>
                    <line x1="80" y1="135" x2="80" y2="75"/>
                    <line x1="100" y1="145" x2="100" y2="55"/>
                    <line x1="120" y1="135" x2="120" y2="75"/>
                    <line x1="140" y1="125" x2="140" y2="95"/>
                </g>
                
                {/* Fire flicker effect - small flames on top of bars */}
                <g fill="#ffd700" opacity="0.8">
                    <ellipse cx="100" cy="52" rx="4" ry="6"/>
                    <ellipse cx="80" cy="72" rx="3" ry="5"/>
                    <ellipse cx="120" cy="72" rx="3" ry="5"/>
                </g>
                
                {/* Outer glow ring */}
                <circle cx="100" cy="100" r="85" fill="none" stroke="#ff8c00" strokeWidth="2" opacity="0.4"/>
            </svg>
            
            {showText && (
                <span className={`font-heading ${text} font-bold bg-gradient-to-r from-orange-500 via-amber-500 to-yellow-400 bg-clip-text text-transparent`}>
                    FyahTrakz
                </span>
            )}
        </div>
    );
};

export default Logo;
