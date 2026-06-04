alter table public.scenes add column if not exists linked_audio_id uuid;

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'scenes_linked_audio_id_fkey') then
    alter table public.scenes
      add constraint scenes_linked_audio_id_fkey foreign key (linked_audio_id) references public.audio_tracks(id) on delete set null;
  end if;
end $$;

create index if not exists idx_scenes_linked_audio on public.scenes(linked_audio_id);
