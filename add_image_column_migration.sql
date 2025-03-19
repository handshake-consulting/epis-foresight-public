-- Migration to add image column to chat_messages table
ALTER TABLE public.chat_messages ADD COLUMN IF NOT EXISTS image TEXT;
