-- Create users table
CREATE TABLE IF NOT EXISTS public.users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    firebase_uid TEXT UNIQUE NOT NULL,
    email TEXT,
    name TEXT,
    last_login TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Set up Row Level Security (RLS)
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Enable read access for all users" ON public.users
    FOR SELECT
    TO PUBLIC
    USING (true);

CREATE POLICY "Enable insert for all users" ON public.users
    FOR INSERT
    TO PUBLIC
    WITH CHECK (true);

CREATE POLICY "Enable update for all users" ON public.users
    FOR UPDATE
    TO PUBLIC
    USING (true);
