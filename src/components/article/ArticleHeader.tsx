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
        <CardHeader className="flex flex-col py-4 px-6 border-b border-[#e8e1d1] bg-[#fcf9f2]">
            <div className="flex items-center justify-between">
                {/* Collapse/Expand button */}
                {onToggleCollapse && (
                    <button
                        onClick={onToggleCollapse}
                        className="mr-3 text-[#8a7e66] hover:text-[#5d5545] p-2 rounded-md hover:bg-[#f5f1e6] block"
                        aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
                    >
                        <Menu className="h-5 w-5" />
                    </button>
                )}
                <CardTitle className="text-lg font-serif truncate max-w-[200px] sm:max-w-sm md:max-w-md text-[#5d5545]">
                    {title}
                </CardTitle>
            </div>

            {/* Display topic as a subtitle if available */}
            {topic && (
                <div className="mt-3 text-2xl font-serif font-semibold text-[#2d2d2d] border-b border-[#e8e1d1] pb-2">
                    {topic}
                </div>
            )}
        </CardHeader>
    );
}
