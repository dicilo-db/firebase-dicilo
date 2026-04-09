'use client';

import { useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';

export function TrackingScript() {
    const pathname = usePathname();
    const hasLogged = useRef<Record<string, boolean>>({});

    useEffect(() => {
        // Prevent strictly duplicate page-view logs on same mount/route
        if (hasLogged.current[pathname]) return;
        hasLogged.current[pathname] = true;

        const logVisit = async () => {
            try {
                // Ignore analytics parsing on localhost/dev loops
                if (window.location.hostname === 'localhost') return;

                const data = {
                    url: pathname,
                    referrer: document.referrer || '',
                    screen: typeof window !== 'undefined' ? `${window.screen.width}x${window.screen.height}` : 'Unknown',
                    device: /Mobi|Android/i.test(navigator.userAgent) ? 'Mobile' : 'Desktop',
                    browser: navigator.userAgentData ? (navigator.userAgentData.brands[0]?.brand || 'Unknown') : 'Unknown',
                    timestamp: new Date().toISOString()
                };

                // Add slight delay to not block rendering
                setTimeout(() => {
                    fetch('/api/metrics/log', {
                        method: 'POST',
                        body: JSON.stringify(data),
                        headers: { 'Content-Type': 'application/json' },
                        // Keepalive true to ensure it sends even if user navigates fast
                        keepalive: true
                    }).catch(() => { /* Silent failure for tracking */ });
                }, 1000);
            } catch (error) {
                // Silent
            }
        };

        logVisit();
    }, [pathname]);

    return null;
}
