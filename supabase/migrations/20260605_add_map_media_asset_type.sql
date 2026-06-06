do $$
begin
  alter table public.media_assets drop constraint if exists media_assets_asset_type_check;
  alter table public.media_assets
    add constraint media_assets_asset_type_check
    check (asset_type in ('image', 'video', 'audio', 'sound', 'portrait', 'object', 'map'));
end $$;
