"use client"

import type React from "react"

import { ChatHeader, ChatInput, ChatMessage, ChatMessages, ChatSession, SessionSidebar } from "@/components/chat"
import { Card, CardContent, CardFooter } from "@/components/ui/card"
import { useAuthCheck } from "@/hook/use-auth-check"
import { useChatStream } from "@/hook/use-chat"
import { getCurrentAuthState } from "@/utils/firebase/client"
import { UserProfile } from "@/utils/profile"
import { createClient } from "@/utils/supabase/clients"
import { useCallback, useEffect, useRef, useState } from "react"

export default function ChatPage({ profile }: { profile: UserProfile }) {
    const [sessions, setSessions] = useState<ChatSession[]>([]);
    const [currentSession, setCurrentSession] = useState<ChatSession | null>(null);
    const [userId, setUserId] = useState<string | null>(null);
    const [userEmail, setUserEmail] = useState<string | null>(null);
    const [userImage, setUserImage] = useState<string | null>(null);
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
    const inputRef = useRef<HTMLTextAreaElement | any>(null);

    // Use the auth check hook to verify authentication on the client side
    // Check every 2 minutes (120000ms) to ensure the token is still valid
    useAuthCheck({ refreshInterval: 120000 });

    // Initialize sidebar state from localStorage on component mount
    useEffect(() => {
        const storedState = localStorage.getItem('sidebarCollapsed');
        if (storedState !== null) {
            setSidebarCollapsed(storedState === 'true');
        }
    }, []);

    const toggleSidebar = () => {
        const newState = !sidebarCollapsed;
        setSidebarCollapsed(newState);
        // Store the new state in localStorage
        localStorage.setItem('sidebarCollapsed', String(newState));
    };

    const {
        messages,
        chatMessages,
        setChatMessages,
        isStreaming,
        error,
        sendMessage,
        stop,
        reset,
        addStoredMessage,
        currentSession: hookCurrentSession,
        setCurrentSession: hookSetCurrentSession
    } = useChatStream({
        callbacks: {
            onData: (data) => {
                // console.log("Stream data:", data)
                if (data.status === "error") {
                    console.error("Stream error:", data.error)
                }
            },
            onError: (error) => console.error("Hook error:", error),
            onFinish: () => {
                console.log("Stream finished");
            },
        }
    });

    // Load user sessions and user info
    useEffect(() => {
        const loadUserAndSessions = async () => {
            const { user } = await getCurrentAuthState();
            if (user) {
                setUserId(user.uid);
                setUserEmail(user.email || null);
                setUserImage(user.photoURL || null);

                const supabase = createClient();
                const { data } = await supabase
                    .from('chat_sessions')
                    .select('*')
                    .eq('user_id', user.uid)
                    .order('updated_at', { ascending: false });

                if (data && data.length > 0) {
                    setSessions(data);
                    setCurrentSession(data[0]); // Set most recent session as current
                    hookSetCurrentSession(data[0]); // Also set in the hook
                } else {
                    // Create initial session if none exists
                    const { data: newSession } = await supabase
                        .from('chat_sessions')
                        .insert({
                            user_id: user.uid,
                            title: 'New Chat',
                            is_active: true
                        })
                        .select()
                        .single();

                    if (newSession) {
                        setSessions([newSession]);
                        setCurrentSession(newSession);
                        hookSetCurrentSession(newSession); // Also set in the hook
                    }
                }
            }
        };
        loadUserAndSessions();
    }, [hookSetCurrentSession]);

    // Load initial messages for the current session
    const loadInitialMessages = async () => {
        if (!currentSession?.id) return [];

        const supabase = createClient();
        const { data } = await supabase
            .from('chat_messages')
            .select('*')
            .eq('session_id', currentSession.id)
            .order('created_at', { ascending: true });

        return data || [];
    };

    // Load messages when session changes
    useEffect(() => {
        const initSession = async () => {
            const initialMessages = await loadInitialMessages();
            reset();

            if (initialMessages.length > 0) {
                initialMessages.forEach(msg => {
                    // Check if the content looks like JSON (starts with { and ends with })
                    const isLikelyJSON = msg.content.trim().startsWith('{') && msg.content.trim().endsWith('}');

                    if (isLikelyJSON) {
                        try {
                            // Try to parse the content as JSON
                            const contentData = JSON.parse(msg.content);

                            // Check if it's a special message type (image or file)
                            if (contentData.message_type === 'image') {
                                // It's an image message
                                if (contentData.imageId) {
                                    // Add as image message
                                    setChatMessages((prev: ChatMessage[]) => [
                                        ...prev,
                                        {
                                            id: msg.id || crypto.randomUUID(),
                                            sender: msg.role,
                                            imageId: contentData.imageId,
                                            storageType: contentData.storageType || 'bucket',
                                            timestamp: new Date(msg.created_at)
                                        }
                                    ]);
                                }
                                // File messages are not supported in this version
                            } else {
                                // JSON but not a special message type
                                addStoredMessage(msg.role, msg.content);
                            }
                        } catch (e) {
                            // If parsing fails, treat as regular text message
                            addStoredMessage(msg.role, msg.content);
                            console.error('Error parsing message content:', e);
                        }
                    } else {
                        // Not JSON, treat as regular text message
                        addStoredMessage(msg.role, msg.content);
                    }
                });
            }
        };

        if (currentSession?.id && userId) {
            initSession();
        }
    }, [currentSession?.id, userId, reset, addStoredMessage, setChatMessages]);


    // Function to refresh the sessions list
    const refreshSessions = useCallback(async () => {
        if (!userId) return;

        const supabase = createClient();
        const { data } = await supabase
            .from('chat_sessions')
            .select('*')
            .eq('user_id', userId)
            .order('updated_at', { ascending: false });

        if (data) {
            setSessions(data);
        }
    }, [userId]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!userId || !currentSession) return;

        const message = inputRef.current?.value;
        if (!message) return;

        // Ensure session ID is a valid UUID
        const sessionId = currentSession.id.toString();
        await sendMessage(message, sessionId, userId, refreshSessions);
        inputRef.current.value = "";
    };

    const startNewChat = async () => {
        if (!userId) return;

        stop();
        const supabase = createClient();
        const { data: newSession } = await supabase
            .from('chat_sessions')
            .insert({
                user_id: userId,
                title: 'New Chat',
                is_active: true
            })
            .select()
            .single();

        if (newSession) {
            setCurrentSession(newSession);
            hookSetCurrentSession(newSession); // Also update in the hook
            setSessions([newSession, ...sessions]);
        }
    };

    const switchSession = (session: ChatSession) => {
        setCurrentSession(session);
        hookSetCurrentSession(session); // Also update in the hook
        stop();
    };

    const deleteSession = async (sessionId: string, e: React.MouseEvent) => {
        e.stopPropagation(); // Prevent triggering session switch
        if (!userId) return;

        try {
            const supabase = createClient();

            // Delete the session
            const { error } = await supabase
                .from('chat_sessions')
                .delete()
                .eq('id', sessionId)
                .eq('user_id', userId);

            if (error) {
                console.error('Error deleting session:', error);
                return;
            }

            // Get updated list of sessions
            const { data: updatedSessions } = await supabase
                .from('chat_sessions')
                .select('*')
                .eq('user_id', userId)
                .order('updated_at', { ascending: false });

            if (updatedSessions && updatedSessions.length > 0) {
                setSessions(updatedSessions);
                // If we deleted current session, switch to the most recent one
                if (currentSession?.id === sessionId) {
                    setCurrentSession(updatedSessions[0]);
                    hookSetCurrentSession(updatedSessions[0]); // Also update in the hook
                }
            } else {
                // Create a new session if we deleted the last one
                const { data: newSession } = await supabase
                    .from('chat_sessions')
                    .insert({
                        user_id: userId,
                        title: 'New Chat',
                        is_active: true
                    })
                    .select()
                    .single();

                if (newSession) {
                    setSessions([newSession]);
                    setCurrentSession(newSession);
                    hookSetCurrentSession(newSession); // Also update in the hook
                }
            }

            // Clear messages if we deleted current session
            if (currentSession?.id === sessionId) {
                reset();
            }
        } catch (error) {
            console.error('Error in deleteSession:', error);
        }
    };

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

    return (
        <div className="flex h-screen relative overflow-hidden">
            {/* Background overlay when sidebar is open on mobile */}
            {isMobile && !sidebarCollapsed && (
                <div className="fixed inset-0 bg-black/30 z-10" onClick={toggleSidebar}></div>
            )}

            {/* Sessions sidebar */}
            <div className={`h-full ${sidebarCollapsed ? 'w-16' : 'w-64 md:w-72'} block transition-all duration-300 z-20`}>
                <SessionSidebar
                    sessions={sessions}
                    currentSession={currentSession}
                    onNewChat={startNewChat}
                    onSwitchSession={switchSession}
                    onDeleteSession={deleteSession}
                    collapsed={sidebarCollapsed}
                    onToggleCollapse={toggleSidebar}
                    userEmail={userEmail}
                    userImage={profile.photo_url || userImage}
                />
            </div>

            {/* Chat area */}
            <Card className="flex-1 flex flex-col h-full rounded-none border-l relative">
                <ChatHeader
                    title={hookCurrentSession?.title || currentSession?.title || 'New Chat'}
                    collapsed={sidebarCollapsed}
                    onToggleCollapse={toggleSidebar}
                />

                {messages.length === 0 ? (
                    <>
                        {/* Empty state with centered welcome message and input */}
                        <div className="flex-1 flex flex-col items-center justify-center p-4">
                            <div className="text-center space-y-4 mb-8 max-w-md">
                                <div className="inline-block bg-blue-100 p-3 sm:p-4 rounded-full">
                                    <svg width="36" height="36" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
                                        <path d="M20 36.6667C29.2048 36.6667 36.6667 29.2048 36.6667 20C36.6667 10.7953 29.2048 3.33334 20 3.33334C10.7953 3.33334 3.33337 10.7953 3.33337 20C3.33337 29.2048 10.7953 36.6667 20 36.6667Z" fill="#E6F0FF" />
                                        <path d="M20 36.6667C29.2048 36.6667 36.6667 29.2048 36.6667 20C36.6667 10.7953 29.2048 3.33334 20 3.33334C10.7953 3.33334 3.33337 10.7953 3.33337 20C3.33337 29.2048 10.7953 36.6667 20 36.6667Z" stroke="#4F46E5" strokeWidth="2" />
                                        <path d="M13.3334 23.3333C13.3334 23.3333 15.8334 26.6667 20 26.6667C24.1667 26.6667 26.6667 23.3333 26.6667 23.3333" stroke="#4F46E5" strokeWidth="2" strokeLinecap="round" />
                                        <circle cx="15" cy="15" r="1.66667" fill="#4F46E5" />
                                        <circle cx="25" cy="15" r="1.66667" fill="#4F46E5" />
                                    </svg>
                                </div>
                                <h2 className="text-lg sm:text-xl font-semibold">{`Hi, I'm ForesightCoach.`}</h2>
                                <p className="text-sm sm:text-base text-gray-600">{`Expand your foresight about the future of faith. Ask questions and pose ideas in dynamic conversation grounded in custom research by IFTF and McKinsey for EDOT, along with books by Bob Johansen on foresight and the future.`}</p>
                            </div>

                            {/* Input in the center when no messages */}
                            <div className="w-full max-w-2xl px-2 sm:px-4">
                                <ChatInput
                                    inputRef={inputRef}
                                    isStreaming={isStreaming}
                                    onSubmit={handleSubmit}
                                    onStop={stop}
                                    onNewChat={startNewChat}
                                    messages={messages}
                                />
                            </div>
                        </div>
                    </>
                ) : (
                    <>
                        {/* Messages display when there are messages */}
                        <CardContent className="flex-1 overflow-y-auto px-1 sm:px-4">
                            <ChatMessages
                                messages={chatMessages}
                                error={error}
                                userId={userId}
                                sessionId={currentSession?.id}
                                isStreaming={isStreaming}
                            />
                        </CardContent>

                        {/* Input at the bottom when there are messages */}
                        <CardFooter className="mt-auto px-0 sm:px-4">
                            <ChatInput
                                inputRef={inputRef}
                                isStreaming={isStreaming}
                                onSubmit={handleSubmit}
                                onStop={stop}
                                onNewChat={startNewChat}
                                messages={messages}
                            />
                        </CardFooter>
                    </>
                )}
            </Card>
        </div>
    )
}
