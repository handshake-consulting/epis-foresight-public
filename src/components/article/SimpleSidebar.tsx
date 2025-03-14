"use client"

import { Button } from "@/components/ui/button";
import { BookOpen } from "lucide-react";
import { useEffect, useState } from "react";
import { ChatSession } from "../chat/types";

interface SimpleSidebarProps {
    sessions: ChatSession[];
    currentSession: ChatSession | null;
    onNewChat: () => void;
    onSwitchSession: (session: ChatSession) => void;
    onDeleteSession: (sessionId: string, e: React.MouseEvent) => void;
    collapsed?: boolean;
    onToggleCollapse?: () => void;
}

export function SimpleSidebar({
    sessions,
    currentSession,
    onNewChat,
    onSwitchSession,
    onDeleteSession,
    collapsed = false,
    onToggleCollapse
}: SimpleSidebarProps) {
    // State to track screen size
    const [isMobile, setIsMobile] = useState(false);

    // Effect to handle window resize and set mobile state
    useEffect(() => {
        const checkMobile = () => {
            setIsMobile(window.innerWidth < 768);
        };

        // Initial check
        checkMobile();

        // Add resize listener
        window.addEventListener('resize', checkMobile);

        // Cleanup
        return () => window.removeEventListener('resize', checkMobile);
    }, []);

    // Group sessions by date
    const today = new Date().toDateString();
    const yesterday = new Date(Date.now() - 86400000).toDateString();

    const groupedSessions = sessions.reduce((acc, session) => {
        const sessionDate = new Date(session.updated_at || Date.now()).toDateString();

        if (sessionDate === today) {
            acc.today.push(session);
        } else if (sessionDate === yesterday) {
            acc.yesterday.push(session);
        } else {
            acc.older.push(session);
        }

        return acc;
    }, { today: [] as ChatSession[], yesterday: [] as ChatSession[], older: [] as ChatSession[] });

    // Use the collapsed prop directly without auto-collapsing on mobile
    const isCollapsed = collapsed;

    return (
        <div className={`${isCollapsed ? 'w-16' : 'w-64 md:w-72'} flex flex-col h-full bg-[#f5f1e6] border-r border-[#e8e1d1] transition-all duration-300 ${isMobile ? 'fixed top-0 bottom-0 left-0' : 'relative'}`}>
            <div className="p-3">
                {isCollapsed ? (
                    <Button
                        onClick={onNewChat}
                        className="w-10 h-10 flex items-center justify-center bg-[#fcf9f2] text-[#8a7e66] hover:bg-white rounded-full border border-[#e8e1d1]"
                        variant="outline"
                        size="icon"
                    >
                        <BookOpen className="h-4 w-4" />
                    </Button>
                ) : (
                    <Button
                        onClick={onNewChat}
                        className="w-full flex items-center gap-2 bg-[#fcf9f2] text-[#8a7e66] hover:bg-white rounded-full border border-[#e8e1d1] font-serif"
                        variant="outline"
                    >
                        <BookOpen className="h-4 w-4" />
                        <span>New article</span>
                    </Button>
                )}
            </div>

            {!isCollapsed && (
                <div className="flex-1 overflow-y-auto px-3">
                    {/* Today's sessions */}
                    {groupedSessions.today.length > 0 && (
                        <div className="mb-4">
                            <h3 className="text-xs font-medium font-serif text-[#8a7e66] mb-2">Today</h3>
                            <div className="space-y-1">
                                {groupedSessions.today.map((session) => (
                                    <div
                                        key={session.id}
                                        className={`flex items-center p-2 rounded-md cursor-pointer font-serif ${currentSession?.id === session.id ? 'bg-[#fcf9f2] border border-[#e8e1d1]' : 'hover:bg-[#fcf9f2]'}`}
                                        onClick={() => onSwitchSession(session)}
                                    >
                                        <div className="flex-1 truncate text-[#5d5545]">{session.title}</div>
                                        {currentSession?.id === session.id && (
                                            <button
                                                className="text-[#8a7e66] hover:text-[#5d5545]"
                                                onClick={(e) => onDeleteSession(session.id, e)}
                                            >
                                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                                    <path d="M12 12L17 17M7 7L12 12L7 7ZM12 12L7 17L12 12ZM12 12L17 7L12 12Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                                </svg>
                                            </button>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Yesterday's sessions */}
                    {groupedSessions.yesterday.length > 0 && (
                        <div className="mb-4">
                            <h3 className="text-xs font-medium font-serif text-[#8a7e66] mb-2">Yesterday</h3>
                            <div className="space-y-1">
                                {groupedSessions.yesterday.map((session) => (
                                    <div
                                        key={session.id}
                                        className={`flex items-center p-2 rounded-md cursor-pointer font-serif ${currentSession?.id === session.id ? 'bg-[#fcf9f2] border border-[#e8e1d1]' : 'hover:bg-[#fcf9f2]'}`}
                                        onClick={() => onSwitchSession(session)}
                                    >
                                        <div className="flex-1 truncate text-[#5d5545]">{session.title}</div>
                                        {currentSession?.id === session.id && (
                                            <button
                                                className="text-[#8a7e66] hover:text-[#5d5545]"
                                                onClick={(e) => onDeleteSession(session.id, e)}
                                            >
                                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                                    <path d="M12 12L17 17M7 7L12 12L7 7ZM12 12L7 17L12 12ZM12 12L17 7L12 12Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                                </svg>
                                            </button>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Older sessions */}
                    {groupedSessions.older.length > 0 && (
                        <div>
                            <h3 className="text-xs font-medium font-serif text-[#8a7e66] mb-2">Older</h3>
                            <div className="space-y-1">
                                {groupedSessions.older.map((session) => (
                                    <div
                                        key={session.id}
                                        className={`flex items-center p-2 rounded-md cursor-pointer font-serif ${currentSession?.id === session.id ? 'bg-[#fcf9f2] border border-[#e8e1d1]' : 'hover:bg-[#fcf9f2]'}`}
                                        onClick={() => onSwitchSession(session)}
                                    >
                                        <div className="flex-1 truncate text-[#5d5545]">{session.title}</div>
                                        {currentSession?.id === session.id && (
                                            <button
                                                className="text-[#8a7e66] hover:text-[#5d5545]"
                                                onClick={(e) => onDeleteSession(session.id, e)}
                                            >
                                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                                    <path d="M12 12L17 17M7 7L12 12L7 7ZM12 12L7 17L12 12ZM12 12L17 7L12 12Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                                </svg>
                                            </button>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            )}

            {isCollapsed && (
                <div className="flex-1 overflow-y-auto px-2 py-3">
                    {/* Show just icons for sessions when collapsed */}
                    <div className="flex flex-col items-center space-y-3">
                        {sessions.slice(0, 5).map((session) => (
                            <button
                                key={session.id}
                                className={`w-10 h-10 rounded-full flex items-center justify-center ${currentSession?.id === session.id ? 'bg-[#fcf9f2] border border-[#e8e1d1]' : 'hover:bg-[#fcf9f2]'}`}
                                onClick={() => onSwitchSession(session)}
                                title={session.title}
                            >
                                <BookOpen className="h-4 w-4 text-[#8a7e66]" />
                            </button>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
