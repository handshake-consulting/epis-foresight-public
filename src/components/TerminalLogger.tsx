'use client';

import { useEffect } from 'react';

console.log('[TerminalLogger] Module loaded');

export function TerminalLogger() {
    console.log('[TerminalLogger] Component rendering');

    useEffect(() => {
        console.log('[TerminalLogger] Setup effect running');

        if (process.env.NODE_ENV === 'development') {
            console.log('[TerminalLogger] Development environment detected, initializing termlog');

            import('termlog').then((termlog) => {
                console.log('[TerminalLogger] Termlog module loaded');
                termlog.default();
                console.log('[TerminalLogger] Termlog initialized successfully');
            }).catch(error => {
                console.error('[TerminalLogger] Error loading termlog:', error);
            });
        } else {
            console.log('[TerminalLogger] Production environment detected, skipping termlog');
        }

        return () => {
            console.log('[TerminalLogger] Component unmounting');
        };
    }, []);

    return null;
} 