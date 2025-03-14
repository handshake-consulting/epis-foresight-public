"use client"

import { CardHeader } from "@/components/ui/card";

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
        <CardHeader className="flex flex-col py-6 px-8 border-b border-[#e8e1d1] bg-[#fcf9f2]">
            {/* Display topic as a main title if available */}
            {topic ? (
                <>
                    <h1 className="text-2xl md:text-3xl font-serif font-bold text-[#5d5545] text-center mb-2">
                        {topic}
                    </h1>
                    <div className="w-24 h-1 bg-[#e8e1d1] mx-auto mb-2"></div>
                    <p className="text-sm text-center font-serif text-[#8a7e66] italic">
                        {title}
                    </p>
                </>
            ) : (
                <h1 className="text-2xl md:text-3xl font-serif font-bold text-[#5d5545] text-center">
                    {title}
                </h1>
            )}
        </CardHeader>
    );
}
