"use client";

import { useEffect, useState } from "react";

interface ProgressBarProps {
    isLoading?: boolean;
    value?: number;
    max?: number;
    className?: string;
    label?: string;
}

export function ProgressBar({
    isLoading = false,
    value = 0,
    max = 100,
    className = '',
    label
}: ProgressBarProps) {
    const [progress, setProgress] = useState(0);

    // For indeterminate progress (when isLoading is true)
    useEffect(() => {
        if (!isLoading) {
            // For determinate progress, just set the actual value
            setProgress((value / max) * 100);
            return;
        }

        // For loading state, create an animated progress effect
        let animationFrameId: number;
        let start = Date.now();
        const duration = 2000; // 2 seconds for one cycle

        function animate() {
            const now = Date.now();
            const elapsed = now - start;

            // Create a fluid, oscillating effect
            // Progress moves from 15% to 90% and back
            if (elapsed > duration) {
                start = now;
            }

            const phase = (elapsed % duration) / duration;
            const easedPhase = easeInOutQuad(phase);

            // Calculate position: moves from 15% to 90% and back
            let position;
            if (phase < 0.5) {
                // First half: 15% to 90%
                position = 15 + easedPhase * 2 * 75;
            } else {
                // Second half: 90% to 15%
                position = 90 - (easedPhase - 0.5) * 2 * 75;
            }

            setProgress(position);
            animationFrameId = requestAnimationFrame(animate);
        }

        animationFrameId = requestAnimationFrame(animate);

        return () => {
            cancelAnimationFrame(animationFrameId);
        };
    }, [isLoading, value, max]);

    // Easing function for smoother animation
    function easeInOutQuad(t: number): number {
        return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
    }

    return (
        <div className={`relative w-full ${className}`}>
            <div className="h-2 w-full bg-secondary/20 rounded-full overflow-hidden">
                <div
                    className="h-full bg-[#5d5545] transition-all duration-300 ease-out rounded-full"
                    style={{ width: `${progress}%` }}
                />
            </div>
            {label && (
                <div className="text-xs text-muted-foreground mt-1">
                    {label}
                </div>
            )}
        </div>
    );
} 