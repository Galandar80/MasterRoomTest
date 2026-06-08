-- Create an RPC function that updates a scene bypassing PostgREST schema cache issues
-- This function handles all scene fields including linked_audio_id

CREATE OR REPLACE FUNCTION public.update_scene_full(
  p_scene_id uuid,
  p_title text,
  p_description text,
  p_image_url text,
  p_media_type text DEFAULT 'image',
  p_video_url text DEFAULT NULL,
  p_loop_video boolean DEFAULT true,
  p_visibility text DEFAULT 'public',
  p_visible_user_ids uuid[] DEFAULT '{}',
  p_linked_audio_id uuid DEFAULT NULL
)
RETURNS SETOF public.scenes
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
BEGIN
  -- RLS check: only the room master can call this
  IF NOT public.is_room_master((SELECT room_id FROM public.scenes WHERE id = p_scene_id)) THEN
    RAISE EXCEPTION 'Unauthorized: only the room master can update scenes';
  END IF;

  RETURN QUERY
    UPDATE public.scenes
    SET
      title = p_title,
      description = p_description,
      image_url = p_image_url,
      media_type = p_media_type,
      video_url = p_video_url,
      loop_video = p_loop_video,
      visibility = p_visibility,
      visible_user_ids = p_visible_user_ids,
      linked_audio_id = p_linked_audio_id
    WHERE id = p_scene_id
    RETURNING *;
END;
$$;

-- Grant execute to authenticated users (RLS check inside function handles authorization)
REVOKE EXECUTE ON FUNCTION public.update_scene_full FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.update_scene_full FROM anon;
GRANT EXECUTE ON FUNCTION public.update_scene_full TO authenticated;

-- Also ensure the linked_audio_id column exists
ALTER TABLE public.scenes ADD COLUMN IF NOT EXISTS linked_audio_id uuid;

-- And reload PostgREST schema cache
NOTIFY pgrst, 'reload schema';
