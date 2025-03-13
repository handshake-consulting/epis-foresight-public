"use client"

import { CardHeader, CardTitle } from "@/components/ui/card";
import { Menu } from "lucide-react";

interface ChatHeaderProps {
    title: string;
    collapsed?: boolean;
    onToggleCollapse?: () => void;
}

export function ChatHeader({ title, collapsed = false, onToggleCollapse }: ChatHeaderProps) {
    return (
        <CardHeader className="flex flex-row items-center justify-between py-3 px-4">
            <div className="flex items-center">
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
        </CardHeader>
    );
}
