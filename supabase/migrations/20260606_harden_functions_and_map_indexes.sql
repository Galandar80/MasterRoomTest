alter function public.is_superadmin() set search_path = public;
alter function public.set_updated_at() set search_path = public;

revoke execute on function public.handle_new_user() from public;
revoke execute on function public.handle_new_user() from anon;
revoke execute on function public.handle_new_user() from authenticated;

revoke execute on function public.is_room_master(uuid) from public;
revoke execute on function public.is_room_master(uuid) from anon;
grant execute on function public.is_room_master(uuid) to authenticated;

revoke execute on function public.is_room_player(uuid) from public;
revoke execute on function public.is_room_player(uuid) from anon;
grant execute on function public.is_room_player(uuid) to authenticated;

create index if not exists idx_dice_requests_requested_by on public.dice_requests(requested_by);
create index if not exists idx_dice_requests_target_user_id on public.dice_requests(target_user_id);
create index if not exists idx_media_assets_created_by on public.media_assets(created_by);
create index if not exists idx_messages_npc_id on public.messages(npc_id);
create index if not exists idx_messages_recipient_user_id on public.messages(recipient_user_id);
create index if not exists idx_messages_sender_user_id on public.messages(sender_user_id);
create index if not exists idx_room_presence_user_id on public.room_presence(user_id);
create index if not exists idx_room_typing_recipient_user_id on public.room_typing(recipient_user_id);
create index if not exists idx_room_typing_user_id on public.room_typing(user_id);
create index if not exists idx_rooms_current_audio_id on public.rooms(current_audio_id);
create index if not exists idx_rooms_current_scene_id on public.rooms(current_scene_id);
create index if not exists idx_rooms_current_sound_effect_id on public.rooms(current_sound_effect_id);
create index if not exists idx_rooms_spotlight_npc_id on public.rooms(spotlight_npc_id);
create index if not exists idx_scenes_created_by on public.scenes(created_by);
create index if not exists idx_maps_campaign_id on public.maps(campaign_id);
create index if not exists idx_maps_created_by on public.maps(created_by);
create index if not exists idx_map_hotspots_target_map_id on public.map_hotspots(target_map_id);
create index if not exists idx_map_hotspots_target_scene_id on public.map_hotspots(target_scene_id);
create index if not exists idx_map_hotspots_target_audio_id on public.map_hotspots(target_audio_id);
create index if not exists idx_map_npc_markers_npc_id on public.map_npc_markers(npc_id);
create index if not exists idx_map_events_target_scene_id on public.map_events(target_scene_id);
create index if not exists idx_map_events_target_audio_id on public.map_events(target_audio_id);
