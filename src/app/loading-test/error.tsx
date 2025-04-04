'use client'

import { useEffect } from 'react'

export default function ErrorBoundary({
    error,
    reset,
}: {
    error: Error & { digest?: string }
    reset: () => void
}) {
    useEffect(() => {
        // Log the error to console
        console.error('Loading test error:', error)
    }, [error])

    return (
        <div className="p-8 bg-red-50 text-red-800 rounded-lg max-w-3xl mx-auto my-12">
            <h2 className="text-2xl font-bold mb-4">Something went wrong with the animation!</h2>
            <div className="mb-4">
                <p className="font-bold">Error message:</p>
                <pre className="bg-red-100 p-4 rounded overflow-auto">{error.message}</pre>
            </div>
            {error.stack && (
                <div className="mb-4">
                    <p className="font-bold">Stack trace:</p>
                    <pre className="bg-red-100 p-4 rounded overflow-auto text-xs">{error.stack}</pre>
                </div>
            )}
            <button
                className="px-4 py-2 bg-red-700 text-white rounded hover:bg-red-800"
                onClick={reset}
            >
                Try again
            </button>
        </div>
    )
} 