do $$
begin
  if exists (
    select 1
    from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'room_presence'
  ) then
    alter publication supabase_realtime drop table public.room_presence;
  end if;

  if exists (
    select 1
    from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'room_typing'
  ) then
    alter publication supabase_realtime drop table public.room_typing;
  end if;
end $$;
