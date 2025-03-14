"use client"

import { ChevronLeft, ChevronRight } from "lucide-react";

interface VersionNavigationProps {
    currentVersion: number;
    totalVersions: number;
    onPrevious: () => void;
    onNext: () => void;
}

export function VersionNavigation({
    currentVersion,
    totalVersions,
    onPrevious,
    onNext
}: VersionNavigationProps) {
    // Don't render if there's only one version
    if (totalVersions <= 1) {
        return null;
    }

    return (
        <div className="flex items-center justify-center py-3 border-t border-[#e8e1d1] bg-[#fcf9f2]">
            <div className="flex items-center space-x-4">
                <button
                    onClick={onPrevious}
                    disabled={currentVersion <= 1}
                    className={`p-1 rounded-full ${currentVersion <= 1
                        ? 'text-[#d3cbbe] cursor-not-allowed'
                        : 'text-[#8a7e66] hover:bg-[#f5f1e6]'
                        }`}
                    aria-label="Previous version"
                >
                    <ChevronLeft className="h-5 w-5" />
                </button>

                <div className="text-sm font-serif text-[#5d5545]">
                    Version {currentVersion} of {totalVersions}
                </div>

                <button
                    onClick={onNext}
                    disabled={currentVersion >= totalVersions}
                    className={`p-1 rounded-full ${currentVersion >= totalVersions
                        ? 'text-[#d3cbbe] cursor-not-allowed'
                        : 'text-[#8a7e66] hover:bg-[#f5f1e6]'
                        }`}
                    aria-label="Next version"
                >
                    <ChevronRight className="h-5 w-5" />
                </button>
            </div>
        </div>
    );
}
