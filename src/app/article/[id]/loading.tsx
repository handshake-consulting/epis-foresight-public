import { ProgressBar } from "@/components/ui/progress-bar";
import { Book, Loader2 } from "lucide-react";

export default function Loading() {
    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-800 dark:text-gray-100">
            {/* Header Skeleton */}
            <header className="fixed top-0 left-0 right-0 z-10 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 shadow-sm">
                <div className="container mx-auto px-4 py-3 flex justify-between items-center">
                    {/* Left section */}
                    <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 rounded-md bg-gray-200 dark:bg-gray-700 animate-pulse"></div>
                        <div className="w-20 h-5 rounded-md bg-gray-200 dark:bg-gray-700 animate-pulse hidden sm:block"></div>
                    </div>

                    {/* Center section - Title */}
                    <div className="text-center flex-1 px-4">
                        <div className="w-48 h-6 rounded-md bg-gray-200 dark:bg-gray-700 animate-pulse mx-auto"></div>
                    </div>

                    {/* Right section - Actions */}
                    <div className="flex items-center space-x-2">
                        <div className="w-8 h-8 rounded-md bg-gray-200 dark:bg-gray-700 animate-pulse"></div>
                        <div className="w-8 h-8 rounded-md bg-gray-200 dark:bg-gray-700 animate-pulse"></div>
                    </div>
                </div>
            </header>

            {/* Main content area */}
            <div className="flex flex-col h-full pt-16 pb-12">
                <div className="flex-1 overflow-y-auto px-4 py-6">
                    <div className="max-w-3xl mx-auto">
                        {/* Loading indicator */}
                        <div className="w-full max-w-4xl mx-auto px-4 py-8">
                            <div className="flex flex-col items-center justify-center mb-4 gap-2">
                                <div className="flex items-center gap-2 mb-1">
                                    <Loader2 className="h-5 w-5 animate-spin text-gray-600 dark:text-gray-300" />
                                    <div className="text-center font-medium text-gray-700 dark:text-gray-200">
                                        Loading article
                                    </div>
                                    <div className="loading-dots flex text-gray-700 dark:text-gray-200">
                                        <span className="dot">.</span>
                                        <span className="dot">.</span>
                                        <span className="dot">.</span>
                                    </div>
                                </div>
                                <div className="text-xs text-gray-500 dark:text-gray-400">
                                    Preparing your reading experience
                                </div>
                            </div>
                            <ProgressBar isLoading={true} className="mb-8" />
                        </div>

                        {/* Version indicator skeleton */}
                        <div className="mb-4 text-sm flex items-center justify-between">
                            <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400 italic">
                                <Book className="h-4 w-4" />
                                <div className="w-32 h-4 rounded-md bg-gray-200 dark:bg-gray-700 animate-pulse"></div>
                            </div>
                            <div className="flex items-center space-x-2">
                                <div className="w-24 h-6 rounded-full bg-gray-200 dark:bg-gray-700 animate-pulse"></div>
                            </div>
                        </div>

                        {/* Book-like container skeleton */}
                        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg p-8 mb-8 relative">
                            {/* Decorative book elements */}
                            <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-b from-gray-200 to-transparent opacity-10"></div>
                            <div className="absolute bottom-0 left-0 w-full h-2 bg-gradient-to-t from-gray-200 to-transparent opacity-10"></div>

                            {/* Content skeleton */}
                            <div className="space-y-4">
                                {/* Title skeleton */}
                                <div className="w-3/4 h-8 rounded-md bg-gray-200 dark:bg-gray-700 animate-pulse"></div>

                                {/* Paragraph skeletons */}
                                <div className="w-full h-4 rounded-md bg-gray-200 dark:bg-gray-700 animate-pulse"></div>
                                <div className="w-full h-4 rounded-md bg-gray-200 dark:bg-gray-700 animate-pulse"></div>
                                <div className="w-5/6 h-4 rounded-md bg-gray-200 dark:bg-gray-700 animate-pulse"></div>
                                <div className="w-full h-4 rounded-md bg-gray-200 dark:bg-gray-700 animate-pulse"></div>
                                <div className="w-4/5 h-4 rounded-md bg-gray-200 dark:bg-gray-700 animate-pulse"></div>

                                {/* Subheading skeleton */}
                                <div className="w-1/2 h-6 rounded-md bg-gray-200 dark:bg-gray-700 animate-pulse mt-8"></div>

                                {/* More paragraph skeletons */}
                                <div className="w-full h-4 rounded-md bg-gray-200 dark:bg-gray-700 animate-pulse"></div>
                                <div className="w-full h-4 rounded-md bg-gray-200 dark:bg-gray-700 animate-pulse"></div>
                                <div className="w-3/4 h-4 rounded-md bg-gray-200 dark:bg-gray-700 animate-pulse"></div>

                                {/* Image placeholder skeleton */}
                                <div className="w-full h-48 rounded-md bg-gray-200 dark:bg-gray-700 animate-pulse mt-4"></div>

                                {/* More paragraph skeletons */}
                                <div className="w-full h-4 rounded-md bg-gray-200 dark:bg-gray-700 animate-pulse mt-4"></div>
                                <div className="w-full h-4 rounded-md bg-gray-200 dark:bg-gray-700 animate-pulse"></div>
                                <div className="w-5/6 h-4 rounded-md bg-gray-200 dark:bg-gray-700 animate-pulse"></div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Footer skeleton */}
                <div className="fixed bottom-0 left-0 right-0 h-12 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 flex items-center justify-center">
                    <div className="w-48 h-6 rounded-md bg-gray-200 dark:bg-gray-700 animate-pulse"></div>
                </div>

                {/* Reading progress indicator */}
                <div className="fixed bottom-0 left-0 right-0 h-1">
                    <div className="h-full bg-blue-500 dark:bg-blue-600 w-1/3 animate-pulse"></div>
                </div>
            </div>
        </div>
    );
}
