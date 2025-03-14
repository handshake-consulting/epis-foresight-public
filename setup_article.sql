-- Add new fields to chat_sessions table to support article functionality
ALTER TABLE public.chat_sessions 
ADD COLUMN IF NOT EXISTS type TEXT NOT NULL DEFAULT 'chat',
ADD COLUMN IF NOT EXISTS topic TEXT;

-- Add new fields to chat_messages table to support article versioning
ALTER TABLE public.chat_messages
ADD COLUMN IF NOT EXISTS version INTEGER DEFAULT 1,
ADD COLUMN IF NOT EXISTS is_topic BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS is_edit BOOLEAN DEFAULT false;

-- Create index for faster version queries
CREATE INDEX IF NOT EXISTS idx_chat_messages_version ON public.chat_messages(session_id, version);

-- Update RLS policies to ensure they work with the new fields
-- (No changes needed as existing policies are already permissive)

-- Add comment to explain the purpose of these changes
COMMENT ON TABLE public.chat_sessions IS 'Stores chat sessions and article pages';
COMMENT ON COLUMN public.chat_sessions.type IS 'Type of session: "chat" or "article"';
COMMENT ON COLUMN public.chat_sessions.topic IS 'The main topic for article pages';

COMMENT ON TABLE public.chat_messages IS 'Stores chat messages and article content';
COMMENT ON COLUMN public.chat_messages.version IS 'Version number for article content';
COMMENT ON COLUMN public.chat_messages.is_topic IS 'Indicates if this message is the article topic';
COMMENT ON COLUMN public.chat_messages.is_edit IS 'Indicates if this message is an edit prompt';
