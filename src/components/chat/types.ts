export interface ChatSession {
    id: string;
    title: string;
    created_at: string;
    updated_at: string;
}

export interface BaseMessage {
    id: string;
    sender: "user" | "assistant" | "system" | "error";
    timestamp: Date;
}

export interface TextMessage extends BaseMessage {
    text: string;
}

export interface ImageMessage extends BaseMessage {
    imageId: string;
    storageType: string;
}

export type ChatMessage = TextMessage | ImageMessage;

// For backward compatibility with existing code
export interface LegacyChatMessage {
    role: "user" | "assistant";
    content: string;
}
