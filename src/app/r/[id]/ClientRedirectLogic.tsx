'use client';

import { useEffect } from 'react';

export default function ClientRedirectLogic({
    trackingId,
    destinationUrl
}: {
    trackingId: string,
    destinationUrl: string
}) {

    useEffect(() => {
        // 1. Fire and Forget Tracking
        // We use fetch with keepalive to ensure it survives the redirect
        try {
            fetch(`/api/track/click?id=${trackingId}`, {
                method: 'GET',
                keepalive: true,
                mode: 'no-cors' // Optional: if we don't care about response
            }).catch(e => console.error("Tracking error", e));
        } catch (e) {
            console.error("Tracking init error", e);
        }

        // 2. Schedule Redirect
        const timer = setTimeout(() => {
            window.location.href = destinationUrl;
        }, 800); // 800ms delay as requested

        return () => clearTimeout(timer);
    }, [trackingId, destinationUrl]);

    return null; // Logic only
}
