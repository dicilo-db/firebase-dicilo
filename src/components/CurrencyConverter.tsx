'use client';

import React, { useEffect } from 'react';

declare global {
    interface Window {
        RemoteCalc: (config: any) => void;
    }
}

export function CurrencyConverter() {
    useEffect(() => {
        // Check if script is already present to avoid duplicates
        const existingScript = document.querySelector('script[src="https://fxverify.com/Content/remote/remote-widgets.js"]');

        const initWidget = () => {
            if (window.RemoteCalc) {
                window.RemoteCalc({
                    "Url": "https://fxverify.com",
                    "TopPaneStyle": "YmFja2dyb3VuZDogbGluZWFyLWdyYWRpZW50KCNmZmYgMjAlLCAjZjVmNWY1IDQ1JSk7IGNvbG9yOiBibGFjazsgYm9yZGVyOiBzb2xpZCAxcHggI2FhYTsgYm9yZGVyLWJvdHRvbTogbm9uZTsg",
                    "BottomPaneStyle": "YmFja2dyb3VuZDogI2YzZjNmMzsgYm9yZGVyOiBzb2xpZCAxcHggI2FhYTsgY29sb3I6IGJsYWNrOyBkaXNwbGF5OiBub25lICFpbXBvcnRhbnQ7",
                    "ButtonStyle": "YmFja2dyb3VuZDogIzM0MzU0MDsgY29sb3I6IHdoaXRlOyBib3JkZXItcmFkaXVzOiAyMHB4Ow==",
                    "TitleStyle": "dGV4dC1hbGlnbjogbGVmdDsgZm9udC1zaXplOiA0MHB4OyBmb250LXdlaWdodDogNTAwOw==",
                    "TextboxStyle": "YmFja2dyb3VuZC1jb2xvcjogd2hpdGU7IGNvbG9yOiBibGFjazsgYm9yZGVyOiBzb2xpZCAxcHggI2FhYWFhYQ==",
                    "ContainerWidth": "100%", // Adapted to fit container width
                    "HighlightColor": "#ffff00",
                    "IsDisplayTitle": false,
                    "IsShowEmbedButton": "false",
                    "CompactType": "large",
                    "Calculator": "currency-converter",
                    "ContainerId": "currency-converter-702667"
                });
            }
        };

        if (!existingScript) {
            const script = document.createElement('script');
            script.src = 'https://fxverify.com/Content/remote/remote-widgets.js';
            script.async = true;
            script.onload = initWidget;
            document.body.appendChild(script);
        } else {
            // If script exists, just init (or wait for it if it's loading? For simplicity assuming it might be ready or re-trigger)
            // Ideally we check readiness. Since it's external, we might need a slight delay or check if loaded.
            initWidget();
        }

        // Cleanup not really possible for global script side effects easily without potentially breaking other instances if any.
    }, []);

    return (
        <div className="w-full rounded-lg overflow-hidden bg-white shadow-sm border border-gray-200">
            <div id="currency-converter-702667" className="w-full min-h-[300px]"></div>
        </div>
    );
}
