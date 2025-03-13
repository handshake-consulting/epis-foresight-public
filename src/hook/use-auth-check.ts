"use client"

import { getCurrentAuthState } from '@/utils/firebase/client'
import { useRouter } from 'next/navigation'
import { useCallback, useEffect } from 'react'

interface UseAuthCheckOptions {
    redirectTo?: string
    refreshInterval?: number | null
}

/**
 * Hook to check if the auth-token cookie exists and redirect to login if it doesn't
 * 
 * @param options Configuration options
 * @returns Object containing auth state and utility functions
 */
export function useAuthCheck(options: UseAuthCheckOptions = {}) {
    const {
        redirectTo = '/login',
        refreshInterval = null
    } = options

    const router = useRouter()

    /**
     * Check if the auth-token cookie exists
     */
    const checkAuthCookie = (): boolean => {
        const cookies = document.cookie.split(';')
        return cookies.some(cookie => cookie.trim().startsWith('auth-token='))
    }

    /**
     * Verify authentication state with Firebase and redirect if not authenticated
     */
    const verifyAuth = useCallback(async () => {
        // First check if the cookie exists at all
        if (!checkAuthCookie()) {
            console.log('Auth token cookie not found, redirecting to login')
            router.push(redirectTo)
            return false
        }

        // Then verify with Firebase if needed
        try {
            const { user, token } = await getCurrentAuthState()

            if (!user || !token) {
                console.log('Firebase auth state invalid, redirecting to login')
                // Clear the invalid cookie
                document.cookie = 'auth-token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT'
                router.push(redirectTo)
                return false
            }

            return true
        } catch (error) {
            console.error('Error verifying auth state:', error)
            router.push(redirectTo)
            return false
        }
    }, [router, redirectTo])

    // Run verification on mount
    useEffect(() => {
        verifyAuth()

        // Set up interval for periodic checks if specified
        if (refreshInterval) {
            const intervalId = setInterval(verifyAuth, refreshInterval)
            return () => clearInterval(intervalId)
        }
    }, [verifyAuth, refreshInterval])

    return {
        checkAuthCookie,
        verifyAuth
    }
}
