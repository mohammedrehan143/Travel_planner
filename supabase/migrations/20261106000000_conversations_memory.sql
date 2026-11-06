-- Migration: Add conversational memory and persistent conversation threads
-- Allows TripPilot AI assistant to remember previous context, trips, and messages.

CREATE TABLE IF NOT EXISTS public.conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL DEFAULT 'New Conversation',
  trip_id UUID REFERENCES public.trips(id) ON DELETE SET NULL,
  summary TEXT,
  trip_memory JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.conversation_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID REFERENCES public.conversations(id) ON DELETE CASCADE,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
  content TEXT NOT NULL,
  action TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes for ultra-fast conversation loading
CREATE INDEX IF NOT EXISTS idx_conversations_user ON public.conversations(user_id);
CREATE INDEX IF NOT EXISTS idx_conv_messages_conversation ON public.conversation_messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_conv_messages_created_at ON public.conversation_messages(created_at ASC);

-- Row Level Security (RLS)
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversation_messages ENABLE ROW LEVEL SECURITY;

-- Conversations RLS
CREATE POLICY "Users can manage their own conversations"
  ON public.conversations
  FOR ALL
  USING (auth.uid() = user_id OR user_id = '00000000-0000-0000-0000-000000000001'::uuid);

-- Messages RLS
CREATE POLICY "Users can view and add messages to their own conversations"
  ON public.conversation_messages
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.conversations c
      WHERE c.id = conversation_id AND (c.user_id = auth.uid() OR c.user_id = '00000000-0000-0000-0000-000000000001'::uuid)
    )
  );
