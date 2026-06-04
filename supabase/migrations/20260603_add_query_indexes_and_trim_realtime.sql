create index if not exists idx_campaigns_master_created on public.campaigns(master_id, created_at desc);
create index if not exists idx_rooms_campaign_created on public.rooms(campaign_id, created_at desc);
create index if not exists idx_rooms_invite_code on public.rooms(invite_code);
create index if not exists idx_scenes_room_created on public.scenes(room_id, created_at desc);
create index if not exists idx_player_characters_room_created on public.player_characters(room_id, created_at asc);
create index if not exists idx_player_characters_user_room on public.player_characters(user_id, room_id);
create index if not exists idx_messages_room_created on public.messages(room_id, created_at desc);
create index if not exists idx_messages_room_private_recipient_created on public.messages(room_id, is_private, recipient_user_id, created_at desc);
create index if not exists idx_audio_tracks_room_created on public.audio_tracks(room_id, created_at asc);
create index if not exists idx_sound_effects_room_created on public.sound_effects(room_id, created_at asc);
create index if not exists idx_npcs_room_created on public.npcs(room_id, created_at asc);
create index if not exists idx_inventory_items_character_created on public.inventory_items(character_id, created_at asc);
create index if not exists idx_player_notes_character_updated on public.player_notes(character_id, updated_at desc);
create index if not exists idx_dice_requests_room_created on public.dice_requests(room_id, created_at desc);
create index if not exists idx_media_assets_room_created on public.media_assets(room_id, created_at desc);
create index if not exists idx_room_presence_room_seen on public.room_presence(room_id, last_seen_at desc);

do $$
begin
  if exists (
    select 1
    from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'inventory_items'
  ) then
    alter publication supabase_realtime drop table public.inventory_items;
  end if;
end $$;
