"use client"

import { CardHeader, CardTitle } from "@/components/ui/card";
import { Menu } from "lucide-react";

interface ArticleHeaderProps {
    title: string;
    topic?: string;
    collapsed?: boolean;
    onToggleCollapse?: () => void;
}

export function ArticleHeader({
    title,
    topic,
    collapsed = false,
    onToggleCollapse
}: ArticleHeaderProps) {
    return (
        <CardHeader className="flex flex-col py-3 px-4 border-b">
            <div className="flex items-center justify-between">
                {/* Collapse/Expand button */}
                {onToggleCollapse && (
                    <button
                        onClick={onToggleCollapse}
                        className="mr-3 text-gray-500 hover:text-gray-700 p-2 rounded-md hover:bg-gray-100 block"
                        aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
                    >
                        <Menu className="h-5 w-5" />
                    </button>
                )}
                <CardTitle className="text-lg truncate max-w-[200px] sm:max-w-sm md:max-w-md">
                    {title}
                </CardTitle>
            </div>

            {/* Display topic as a subtitle if available */}
            {topic && (
                <div className="mt-2 text-xl font-semibold text-gray-800">
                    {topic}
                </div>
            )}
        </CardHeader>
    );
}
