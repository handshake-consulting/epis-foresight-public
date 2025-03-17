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
        <div className="flex items-center justify-center py-4 border-t border-[#e8e1d1] bg-[#fcf9f2]">
            <div className="flex items-center space-x-6 font-serif">
                <button
                    onClick={onPrevious}
                    disabled={currentVersion <= 1}
                    className={`flex items-center gap-1 px-3 py-1.5 rounded-md border ${currentVersion <= 1
                        ? 'text-[#d3cbbe] border-[#e8e1d1] cursor-not-allowed'
                        : 'text-[#8a7e66] border-[#e8e1d1] hover:bg-[#f5f1e6]'
                        }`}
                    aria-label="Previous version"
                >
                    <ChevronLeft className="h-4 w-4" />
                    <span className="text-sm">Previous</span>
                </button>

                <div className="text-sm text-[#5d5545] italic">
                    Version {currentVersion} of {totalVersions}
                </div>

                <button
                    onClick={onNext}
                    disabled={currentVersion >= totalVersions}
                    className={`flex items-center gap-1 px-3 py-1.5 rounded-md border ${currentVersion >= totalVersions
                        ? 'text-[#d3cbbe] border-[#e8e1d1] cursor-not-allowed'
                        : 'text-[#8a7e66] border-[#e8e1d1] hover:bg-[#f5f1e6]'
                        }`}
                    aria-label="Next version"
                >
                    <span className="text-sm">Next</span>
                    <ChevronRight className="h-4 w-4" />
                </button>
            </div>
        </div>
    );
}
