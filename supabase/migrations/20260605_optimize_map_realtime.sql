do $$
begin
  if exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'maps') then
    alter publication supabase_realtime drop table public.maps;
  end if;
  if exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'map_character_positions') then
    alter publication supabase_realtime drop table public.map_character_positions;
  end if;

  if exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'map_hotspots') then
    alter publication supabase_realtime drop table public.map_hotspots;
  end if;
  if exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'map_npc_markers') then
    alter publication supabase_realtime drop table public.map_npc_markers;
  end if;
  if exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'map_custom_markers') then
    alter publication supabase_realtime drop table public.map_custom_markers;
  end if;
end $$;
