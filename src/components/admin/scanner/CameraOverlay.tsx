import React from 'react';

export const CameraOverlay = () => {
    return (
        <div className="absolute inset-0 pointer-events-none z-20 overflow-hidden">
            {/* SVG Mask to create the "card hole" effect */}
            <svg className="absolute w-full h-full" preserveAspectRatio="none">
                <defs>
                    <mask id="card-mask">
                        <rect width="100%" height="100%" fill="white" />
                        {/* 
                            Center Rectangle (The "Hole") 
                            Ratio 1.58:1 (Business Card standard)
                            We use rx/ry for rounded corners.
                            y="30%" means it starts at 30% from top, leaving space for UI.
                            height="30%" makes a reasonable card size on mobile vertical screens.
                            For mobile portrait, width should be mostly full (e.g. 85%).
                            height = width / 1.58
                        */}
                        <rect
                            x="10%"
                            y="35%"
                            width="80%"
                            height="30%"
                            rx="16"
                            ry="16"
                            fill="black"
                        />
                    </mask>
                </defs>
                {/* Dark overlay with the mask applied */}
                <rect width="100%" height="100%" fill="rgba(0, 0, 0, 0.6)" mask="url(#card-mask)" />

                {/* Visual Border for the hole (Green Guide) */}
                <rect
                    x="10%"
                    y="35%"
                    width="80%"
                    height="30%"
                    rx="16"
                    ry="16"
                    fill="none"
                    stroke="#10b981" // Emerald-500
                    strokeWidth="3"
                    strokeDasharray="20 10"
                    className="animate-pulse"
                />
            </svg>

            {/* Hint Text */}
            <div className="absolute top-[25%] left-0 right-0 text-center text-white/90 drop-shadow-md px-6 animate-in fade-in slide-in-from-top-5 duration-1000">
                <p className="text-lg font-bold">Coloca la tarjeta dentro del marco</p>
                <p className="text-sm opacity-80 mt-1">Sostén el móvil firme</p>
            </div>
        </div>
    );
};
