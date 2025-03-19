-- Drop existing tables if they exist
DROP TABLE IF EXISTS public.chat_messages;
DROP TABLE IF EXISTS public.chat_sessions;

-- Create chat sessions table
CREATE TABLE IF NOT EXISTS public.chat_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id TEXT NOT NULL,
    title TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    is_active BOOLEAN DEFAULT TRUE,
    
    -- Foreign key to users table
    CONSTRAINT fk_user FOREIGN KEY (user_id) 
        REFERENCES public.users(firebase_uid) ON DELETE CASCADE
);

-- Set up Row Level Security for sessions
ALTER TABLE public.chat_sessions ENABLE ROW LEVEL SECURITY;

-- Create policies for sessions
CREATE POLICY "Enable read access for users" ON public.chat_sessions
    FOR SELECT
    USING (true);

CREATE POLICY "Enable insert for users" ON public.chat_sessions
    FOR INSERT
    WITH CHECK (true);

CREATE POLICY "Enable update for users" ON public.chat_sessions
    FOR UPDATE
    USING (true);

CREATE POLICY "Enable delete for own sessions" ON public.chat_sessions
    FOR DELETE
    USING (true);

-- Create indexes for sessions
CREATE INDEX idx_chat_sessions_user_id ON public.chat_sessions(user_id);
CREATE INDEX idx_chat_sessions_created_at ON public.chat_sessions(created_at);

-- Create chat messages table
CREATE TABLE IF NOT EXISTS public.chat_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID NOT NULL,
    user_id TEXT NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
    content TEXT NOT NULL,
    image TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Foreign keys with cascade delete
    CONSTRAINT fk_session FOREIGN KEY (session_id) 
        REFERENCES public.chat_sessions(id) ON DELETE CASCADE,
    CONSTRAINT fk_user FOREIGN KEY (user_id) 
        REFERENCES public.users(firebase_uid) ON DELETE CASCADE
);

-- Create indexes for messages
CREATE INDEX idx_chat_messages_session_id ON public.chat_messages(session_id);
CREATE INDEX idx_chat_messages_user_id ON public.chat_messages(user_id);
CREATE INDEX idx_chat_messages_created_at ON public.chat_messages(created_at);

-- Set up Row Level Security for messages
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;

-- Create policies for messages
CREATE POLICY "Enable read access for users" ON public.chat_messages
    FOR SELECT
    USING (true);

CREATE POLICY "Enable insert for users" ON public.chat_messages
    FOR INSERT
    WITH CHECK (true);

CREATE POLICY "Enable update for users" ON public.chat_messages
    FOR UPDATE
    USING (true);

CREATE POLICY "Enable delete for own messages" ON public.chat_messages
    FOR DELETE
    USING (true);

-- Function to update session updated_at timestamp
CREATE OR REPLACE FUNCTION update_session_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE public.chat_sessions
    SET updated_at = NOW()
    WHERE id = NEW.session_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update session timestamp when message is added
CREATE TRIGGER update_session_timestamp
    AFTER INSERT ON public.chat_messages
    FOR EACH ROW
    EXECUTE FUNCTION update_session_timestamp();
