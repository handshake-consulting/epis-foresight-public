"use client"

import { Button } from "@/components/ui/button";
import { MessageSquare, User } from "lucide-react";
import { useEffect, useState } from "react";
import { ChatSession } from "./types";

interface SessionSidebarProps {
    sessions: ChatSession[];
    currentSession: ChatSession | null;
    onNewChat: () => void;
    onSwitchSession: (session: ChatSession) => void;
    onDeleteSession: (sessionId: string, e: React.MouseEvent) => void;
    collapsed?: boolean;
    onToggleCollapse?: () => void;
    userEmail?: string | null;
    userImage?: string | null;
}

export function SessionSidebar({
    sessions,
    currentSession,
    onNewChat,
    onSwitchSession,
    onDeleteSession,
    collapsed = false,
    onToggleCollapse,
    userEmail,
    userImage
}: SessionSidebarProps) {
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
        <div className={`${isCollapsed ? 'w-16' : 'w-64 md:w-72'} flex flex-col h-full bg-gray-50 border-r transition-all duration-300 ${isMobile ? 'fixed top-0 bottom-0 left-0' : 'relative'}`}>
            <div className="p-3">
                {isCollapsed ? (
                    <Button
                        onClick={onNewChat}
                        className="w-10 h-10 flex items-center justify-center bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-full"
                        variant="outline"
                        size="icon"
                    >
                        <MessageSquare className="h-4 w-4" />
                    </Button>
                ) : (
                    <Button
                        onClick={onNewChat}
                        className="w-full flex items-center gap-2 bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-full"
                        variant="outline"
                    >
                        <MessageSquare className="h-4 w-4" />
                        <span>New chat</span>
                    </Button>
                )}
            </div>

            {!isCollapsed && (
                <div className="flex-1 overflow-y-auto px-3">
                    {/* Today's sessions */}
                    {groupedSessions.today.length > 0 && (
                        <div className="mb-4">
                            <h3 className="text-xs font-medium text-gray-500 mb-2">Today</h3>
                            <div className="space-y-1">
                                {groupedSessions.today.map((session) => (
                                    <div
                                        key={session.id}
                                        className={`flex items-center p-2 rounded-md cursor-pointer ${currentSession?.id === session.id ? 'bg-gray-200' : 'hover:bg-gray-100'}`}
                                        onClick={() => onSwitchSession(session)}
                                    >
                                        <div className="flex-1 truncate">{session.title}</div>
                                        {currentSession?.id === session.id && (
                                            <button
                                                className="text-gray-400 hover:text-gray-600"
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
                            <h3 className="text-xs font-medium text-gray-500 mb-2">Yesterday</h3>
                            <div className="space-y-1">
                                {groupedSessions.yesterday.map((session) => (
                                    <div
                                        key={session.id}
                                        className={`flex items-center p-2 rounded-md cursor-pointer ${currentSession?.id === session.id ? 'bg-gray-200' : 'hover:bg-gray-100'}`}
                                        onClick={() => onSwitchSession(session)}
                                    >
                                        <div className="flex-1 truncate">{session.title}</div>
                                        {currentSession?.id === session.id && (
                                            <button
                                                className="text-gray-400 hover:text-gray-600"
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
                            <h3 className="text-xs font-medium text-gray-500 mb-2">Older</h3>
                            <div className="space-y-1">
                                {groupedSessions.older.map((session) => (
                                    <div
                                        key={session.id}
                                        className={`flex items-center p-2 rounded-md cursor-pointer ${currentSession?.id === session.id ? 'bg-gray-200' : 'hover:bg-gray-100'}`}
                                        onClick={() => onSwitchSession(session)}
                                    >
                                        <div className="flex-1 truncate">{session.title}</div>
                                        {currentSession?.id === session.id && (
                                            <button
                                                className="text-gray-400 hover:text-gray-600"
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
                                className={`w-10 h-10 rounded-full flex items-center justify-center ${currentSession?.id === session.id ? 'bg-gray-200' : 'hover:bg-gray-100'}`}
                                onClick={() => onSwitchSession(session)}
                                title={session.title}
                            >
                                <MessageSquare className="h-4 w-4 text-gray-600" />
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {/* Bottom section with User Profile and Logout */}
            <div className="mt-auto border-t p-3 space-y-2">
                {isCollapsed ? (
                    <>
                        {/* User profile in collapsed mode with link to profile */}
                        <a href="/profile" className="block" title="My Profile">
                            <div className="flex justify-center">
                                <div className="w-8 h-8 rounded-full bg-gray-300 flex items-center justify-center overflow-hidden hover:ring-2 hover:ring-blue-300 transition-all">
                                    {userImage ? (
                                        <img src={userImage} alt="Profile" className="w-full h-full object-cover" />
                                    ) : (
                                        <User className="h-4 w-4 text-gray-600" />
                                    )}
                                </div>
                            </div>
                        </a>

                        {/* Logout button in collapsed mode */}
                        <form action="/auth/signout" method="post" className="flex justify-center">
                            <button
                                type="submit"
                                className="w-8 h-8 rounded-full flex items-center justify-center text-red-500 hover:bg-red-50"
                                title="Sign Out"
                            >
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                    <path d="M16 17l5-5-5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                    <path d="M21 12H9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                </svg>
                            </button>
                        </form>
                    </>
                ) : (
                    <>
                        {/* User profile in expanded mode with link to profile page */}
                        <div className="block hover:bg-gray-100 rounded-md transition-colors">
                            <div className="flex items-center gap-3 p-2">
                                <div className="w-8 h-8 rounded-full bg-gray-300 flex items-center justify-center overflow-hidden">
                                    {userImage ? (
                                        <img src={userImage} alt="Profile" className="w-full h-full object-cover" />
                                    ) : (
                                        <User className="h-4 w-4 text-gray-600" />
                                    )}
                                </div>
                                <div className="flex-1 overflow-hidden">
                                    <div className="text-sm font-medium truncate">My Profile</div>
                                    {userEmail && (
                                        <div className="text-xs text-gray-500 truncate">{userEmail}</div>
                                    )}
                                </div>
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-400">
                                    <path d="M9 18l6-6-6-6"></path>
                                </svg>
                            </div>
                        </div>

                        {/* Logout button in expanded mode */}
                        <form action="/auth/signout" method="post">
                            <button
                                type="submit"
                                className="w-full flex items-center gap-2 p-2 rounded-md text-red-600 hover:bg-red-50"
                            >
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                    <path d="M16 17l5-5-5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                    <path d="M21 12H9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                </svg>
                                <span>Sign Out</span>
                            </button>
                        </form>
                    </>
                )}
            </div>
        </div>
    );
}
