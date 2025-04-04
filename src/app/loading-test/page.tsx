'use client'

import BookLoadingAnimation from "@/components/BookLoadingAnimation";
import { useEffect, useState } from 'react';

export default function LoadingTestPage() {
    const [hasError, setHasError] = useState(false);
    const [errorMessage, setErrorMessage] = useState('');

    useEffect(() => {
        console.log("Loading test page mounted");

        // Catch any uncaught errors at the window level
        const handleError = (event: ErrorEvent) => {
            console.error("Global error caught:", event.error);
            setHasError(true);
            setErrorMessage(event.error?.toString() || "Unknown error occurred");
            event.preventDefault();
        };

        window.addEventListener('error', handleError);

        return () => {
            window.removeEventListener('error', handleError);
            console.log("Loading test page unmounted");
        };
    }, []);

    if (hasError) {
        return (
            <div className="p-8 bg-red-50 text-red-800 rounded-lg max-w-3xl mx-auto my-12">
                <h1 className="text-2xl font-bold mb-4">Error Loading Animation</h1>
                <p className="mb-4">{errorMessage}</p>
                <pre className="bg-red-100 p-4 rounded overflow-auto">{errorMessage}</pre>
            </div>
        );
    }

    try {
        return (
            <>
                <div className="fixed top-0 left-0 right-0 bg-amber-100 p-2 text-amber-800 text-sm z-50">
                    Animation test page - This should display the BookLoadingAnimation component
                </div>
                <BookLoadingAnimation />
            </>
        );
    } catch (error) {
        console.error("Error rendering BookLoadingAnimation:", error);
        return (
            <div className="p-8 bg-red-50 text-red-800 rounded-lg max-w-3xl mx-auto my-12">
                <h1 className="text-2xl font-bold mb-4">Error in Render</h1>
                <p className="mb-4">{error instanceof Error ? error.message : "Unknown error"}</p>
                <pre className="bg-red-100 p-4 rounded overflow-auto">
                    {error instanceof Error ? error.stack : JSON.stringify(error)}
                </pre>
            </div>
        );
    }
} 