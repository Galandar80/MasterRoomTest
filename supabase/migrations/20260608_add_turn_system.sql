-- Add turn system columns to rooms table
ALTER TABLE public.rooms ADD COLUMN IF NOT EXISTS turn_enabled boolean NOT NULL DEFAULT false;
ALTER TABLE public.rooms ADD COLUMN IF NOT EXISTS turn_order uuid[] NOT NULL DEFAULT '{}';
ALTER TABLE public.rooms ADD COLUMN IF NOT EXISTS current_turn_index integer NOT NULL DEFAULT 0;
