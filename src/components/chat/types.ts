export interface ChatSession {
    id: string;
    title: string;
    created_at: string;
    updated_at: string;
    type?: "chat" | "article";
    topic?: string;
}

export interface BaseMessage {
    id: string;
    sender: "user" | "assistant" | "system" | "error";
    timestamp: Date;
    version?: number;
    isTopic?: boolean;
    isEdit?: boolean;
}

export interface TextMessage extends BaseMessage {
    text: string;
}

export interface ImageMessage extends BaseMessage {
    imageId: string;
    storageType: string;
    imageUrl?: string;
}

export type ChatMessage = TextMessage | ImageMessage;

// Article-specific types
export interface ArticleVersion {
    versionNumber: number;
    content: string;
    editPrompt?: string;
    timestamp: Date;
    images?: ImageMessage[];
}

export interface Article {
    id: string;
    title: string;
    topic: string;
    currentVersion: number;
    versions: ArticleVersion[];
    created_at: string;
    updated_at: string;
    image?: string;
}

// For backward compatibility with existing code
export interface LegacyChatMessage {
    role: "user" | "assistant";
    content: string;
}
