-- Demo data uses fixed UUIDs for local Supabase. Create matching auth users first,
-- then run this file in the SQL editor or with `supabase db reset`.

insert into public.users (id, email, username, role) values
  ('00000000-0000-0000-0000-000000000001', 'master@example.com', 'Mastro della Cenere', 'master'),
  ('00000000-0000-0000-0000-000000000002', 'alaric@example.com', 'AlaricPlayer', 'player'),
  ('00000000-0000-0000-0000-000000000003', 'mira@example.com', 'MiraPlayer', 'player')
on conflict (id) do update set username = excluded.username, role = excluded.role;

insert into public.campaigns (id, master_id, title, description, genre, cover_image_url, status) values
  ('10000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', 'Le Candele di Veyr', 'Un mistero gotico tra pioggia, rovine e promesse mai mantenute.', 'Dark fantasy investigativo', 'https://images.unsplash.com/photo-1518709268805-4e9042af2176?auto=format&fit=crop&w=1400&q=80', 'active')
on conflict (id) do nothing;

insert into public.rooms (id, campaign_id, name, invite_code) values
  ('20000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', 'Sessione 03 - La Serra Chiusa', 'VEY-R03')
on conflict (id) do nothing;

insert into public.scenes (id, room_id, title, description, image_url, created_by) values
  ('30000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000001', 'La Serra Chiusa', 'Vetri appannati, piante nere e una porta sigillata da cera rossa.', 'https://images.unsplash.com/photo-1518005020951-eccb494ad742?auto=format&fit=crop&w=1600&q=85', '00000000-0000-0000-0000-000000000001'),
  ('30000000-0000-0000-0000-000000000002', '20000000-0000-0000-0000-000000000001', 'Il Corridoio delle Maschere', 'Ogni maschera sembra girarsi un istante dopo il vostro passaggio.', 'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1600&q=85', '00000000-0000-0000-0000-000000000001')
on conflict (id) do nothing;

insert into public.audio_tracks (id, room_id, title, audio_url, loop) values
  ('40000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000001', 'Pioggia sulla serra', '', true),
  ('40000000-0000-0000-0000-000000000002', '20000000-0000-0000-0000-000000000001', 'Archivi sotto la villa', '', true)
on conflict (id) do nothing;

update public.rooms
set current_scene_id = '30000000-0000-0000-0000-000000000001',
    current_audio_id = '40000000-0000-0000-0000-000000000001'
where id = '20000000-0000-0000-0000-000000000001';

insert into public.player_characters (id, room_id, user_id, character_name, character_surname, portrait_url, color, hp, mental_state, public_background, visible_status) values
  ('50000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000002', 'Alaric', 'Voss', 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=500&q=80', '#f59e0b', 12, 'Teso', 'Ex medico militare, conosce bene le ferite che non smettono di parlare.', 'ferito'),
  ('50000000-0000-0000-0000-000000000002', '20000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000003', 'Mira', 'Hale', 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=500&q=80', '#38bdf8', 15, 'Lucida', 'Archivista del Collegio, memorizza stemmi e menzogne con la stessa cura.', 'stabile')
on conflict (id) do nothing;

insert into public.npcs (id, room_id, name, portrait_url, color, description) values
  ('60000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000001', 'Eldric il Custode', 'https://images.unsplash.com/photo-1504257432389-52343af06ae3?auto=format&fit=crop&w=500&q=80', '#84cc16', 'Custode della villa, pallido e troppo attento alle finestre.')
on conflict (id) do nothing;

insert into public.messages (room_id, sender_user_id, sender_type, sender_display_name, sender_color, npc_id, content, is_private, recipient_user_id) values
  ('20000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', 'master', 'Master', '#c8a35d', null, 'Il vento spegne improvvisamente tutte le candele nella serra.', false, null),
  ('20000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000002', 'player', 'Alaric Voss', '#f59e0b', null, 'Non mi piace questo silenzio...', false, null),
  ('20000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', 'npc', 'Eldric il Custode', '#84cc16', '60000000-0000-0000-0000-000000000001', 'Avete fatto bene a non aprire quella porta.', false, null),
  ('20000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', 'master', 'Sussurro del Master', '#c8a35d', null, 'Solo tu noti una figura immobile dietro la finestra.', true, '00000000-0000-0000-0000-000000000003');

insert into public.inventory_items (character_id, name, description, quantity, is_public, master_notes, player_notes) values
  ('50000000-0000-0000-0000-000000000001', 'Lanterna incrinata', 'La fiamma diventa blu vicino a cera consacrata.', 1, true, 'Reagisce alla stanza sigillata.', 'Da provare accanto alla porta.'),
  ('50000000-0000-0000-0000-000000000001', 'Lettera senza firma', 'Carta ruvida, odore di fumo e una macchia scura sul bordo.', 1, false, 'Indizio sul padre di Selene.', '');

insert into public.player_notes (character_id, title, content) values
  ('50000000-0000-0000-0000-000000000001', 'Sospetti', 'Eldric sa della porta. Madama Veyr evita di guardare la serra.');
