drop policy if exists "room members read scenes" on public.scenes;
drop policy if exists "masters manage scenes" on public.scenes;
create policy "room members read scenes" on public.scenes for select to authenticated using (
  public.is_superadmin()
  or public.is_room_master(room_id)
  or (
    public.is_room_player(room_id)
    and (
      visibility = 'public'
      or auth.uid() = any(visible_user_ids)
    )
  )
);
create policy "masters manage scenes" on public.scenes for all to authenticated
  using (public.is_room_master(room_id) or public.is_superadmin())
  with check (public.is_room_master(room_id) or public.is_superadmin());

drop policy if exists "room members read audio" on public.audio_tracks;
drop policy if exists "masters manage audio" on public.audio_tracks;
create policy "room members read audio" on public.audio_tracks for select to authenticated using (
  public.is_room_master(room_id) or public.is_room_player(room_id) or public.is_superadmin()
);
create policy "masters manage audio" on public.audio_tracks for all to authenticated
  using (public.is_room_master(room_id) or public.is_superadmin())
  with check (public.is_room_master(room_id) or public.is_superadmin());

drop policy if exists "room members read sound effects" on public.sound_effects;
drop policy if exists "masters manage sound effects" on public.sound_effects;
create policy "room members read sound effects" on public.sound_effects for select to authenticated using (
  public.is_room_master(room_id) or public.is_room_player(room_id) or public.is_superadmin()
);
create policy "masters manage sound effects" on public.sound_effects for all to authenticated
  using (public.is_room_master(room_id) or public.is_superadmin())
  with check (public.is_room_master(room_id) or public.is_superadmin());

drop policy if exists "room members read media assets" on public.media_assets;
drop policy if exists "masters manage media assets" on public.media_assets;
create policy "room members read media assets" on public.media_assets for select to authenticated using (
  public.is_room_master(room_id) or public.is_room_player(room_id) or public.is_superadmin()
);
create policy "masters manage media assets" on public.media_assets for all to authenticated
  using (public.is_room_master(room_id) or public.is_superadmin())
  with check (public.is_room_master(room_id) or public.is_superadmin());
