-- Enable Realtime for live chat messages.
-- Safe to re-run.

alter publication supabase_realtime add table public.messages;
