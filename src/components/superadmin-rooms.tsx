"use client";

import { ArrowLeft, AudioLines, Film, ImageIcon, RefreshCw, Save, Shield, Trash2 } from "lucide-react";
import { useState } from "react";
import type { AdminMediaOverview, AdminRoomOverview } from "@/lib/supabase/room-service";

type SuperAdminRoomsProps = {
  rooms: AdminRoomOverview[];
  media: AdminMediaOverview[];
  onBack: () => void;
  onRefresh: () => void;
  onUpdate: (roomId: string, values: { name: string; inviteCode: string; maxPlayers: number }) => void;
  onDelete: (room: AdminRoomOverview) => void;
  onDeleteMedia: (media: AdminMediaOverview) => void;
};

export function SuperAdminRooms({ rooms, media, onBack, onRefresh, onUpdate, onDelete, onDeleteMedia }: SuperAdminRoomsProps) {
  const [view, setView] = useState<"rooms" | "media">("rooms");
  const [mediaQuery, setMediaQuery] = useState("");
  const visibleMedia = media.filter((item) => `${item.title} ${item.asset_type} ${item.room_name ?? ""} ${item.campaign_title ?? ""}`.toLowerCase().includes(mediaQuery.toLowerCase()));

  return (
    <section className="mx-auto grid w-full max-w-6xl gap-4">
      <header className="glass-panel rounded-lg p-5">
        <button
          type="button"
          onClick={onBack}
          className="mb-5 inline-flex items-center gap-2 rounded-lg border border-white/10 bg-white/[0.04] px-3 py-2 text-sm text-white hover:bg-white/[0.08]"
        >
          <ArrowLeft size={16} /> Menu
        </button>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="flex items-center gap-2 text-xs uppercase tracking-[0.18em] text-brass">
              <Shield size={15} /> Superadmin
            </p>
            <h1 className="mt-2 text-3xl font-semibold text-white">Stanze esistenti</h1>
            <p className="mt-2 text-sm text-slate-300">Controllo globale delle stanze: informazioni, modifica rapida e cancellazione.</p>
          </div>
          <button type="button" onClick={onRefresh} className="inline-flex items-center gap-2 rounded-lg border border-white/10 bg-white/[0.04] px-3 py-2 text-sm text-white hover:bg-white/[0.08]">
            <RefreshCw size={16} /> Aggiorna
          </button>
        </div>
        <div className="mt-5 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setView("rooms")}
            className={`rounded-lg border px-3 py-2 text-sm ${view === "rooms" ? "border-brass/40 bg-brass/15 text-brass" : "border-white/10 bg-white/[0.04] text-slate-200"}`}
          >
            Stanze ({rooms.length})
          </button>
          <button
            type="button"
            onClick={() => setView("media")}
            className={`rounded-lg border px-3 py-2 text-sm ${view === "media" ? "border-brass/40 bg-brass/15 text-brass" : "border-white/10 bg-white/[0.04] text-slate-200"}`}
          >
            Media caricati ({media.length})
          </button>
        </div>
      </header>

      {view === "rooms" ? (
        <div className="grid gap-3">
          {rooms.map((room) => (
            <AdminRoomCard key={room.id} room={room} onUpdate={onUpdate} onDelete={onDelete} />
          ))}
          {!rooms.length ? <p className="glass-panel rounded-lg p-5 text-sm text-slate-300">Nessuna stanza trovata.</p> : null}
        </div>
      ) : (
        <section className="glass-panel rounded-lg p-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-xl font-semibold text-white">Contenuti multimediali caricati</h2>
              <p className="mt-1 text-sm text-slate-400">Immagini, video, audio, soundbar e asset salvati dagli utenti.</p>
            </div>
            <input className="field w-full max-w-xs px-3 py-2 text-sm" placeholder="Cerca media..." value={mediaQuery} onChange={(event) => setMediaQuery(event.target.value)} />
          </div>
          <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {visibleMedia.map((item) => (
              <AdminMediaCard key={`${item.source}-${item.id}`} item={item} onDelete={onDeleteMedia} />
            ))}
          </div>
          {!visibleMedia.length ? <p className="mt-4 rounded-lg border border-white/10 bg-white/[0.04] p-4 text-sm text-slate-300">Nessun media trovato.</p> : null}
        </section>
      )}
    </section>
  );
}

function AdminMediaCard({ item, onDelete }: { item: AdminMediaOverview; onDelete: (media: AdminMediaOverview) => void }) {
  const isVisual = item.asset_type === "image" || item.asset_type === "portrait" || item.asset_type === "object";

  return (
    <article className="rounded-lg border border-white/10 bg-black/25 p-3">
      <div className="aspect-video overflow-hidden rounded-md bg-black/50">
        {isVisual ? (
          <div className="h-full bg-cover bg-center" style={{ backgroundImage: `url(${item.url})` }} />
        ) : item.asset_type === "video" ? (
          <video className="h-full w-full object-cover" src={item.url} muted playsInline loop />
        ) : (
          <div className="flex h-full items-center justify-center text-brass">
            <AudioLines size={30} />
          </div>
        )}
      </div>
      <div className="mt-3 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate font-semibold text-white">{item.title}</p>
          <p className="mt-1 flex items-center gap-2 text-xs uppercase tracking-[0.14em] text-slate-500">
            {item.asset_type === "video" ? <Film size={13} /> : item.asset_type === "image" ? <ImageIcon size={13} /> : <AudioLines size={13} />}
            {item.asset_type} · {item.source}
          </p>
        </div>
        <button
          type="button"
          onClick={() => onDelete(item)}
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-rose-400/25 bg-rose-500/10 text-rose-100 hover:bg-rose-500/20"
          title="Elimina media"
          aria-label="Elimina media"
        >
          <Trash2 size={15} />
        </button>
      </div>
      <p className="mt-2 truncate text-xs text-slate-400">{item.campaign_title ?? "Campagna"} · {item.room_name ?? item.room_id}</p>
      <p className="mt-1 truncate text-xs text-slate-600">{item.url}</p>
    </article>
  );
}

function AdminRoomCard({
  room,
  onUpdate,
  onDelete
}: {
  room: AdminRoomOverview;
  onUpdate: (roomId: string, values: { name: string; inviteCode: string; maxPlayers: number }) => void;
  onDelete: (room: AdminRoomOverview) => void;
}) {
  const [name, setName] = useState(room.name);
  const [inviteCode, setInviteCode] = useState(room.invite_code);
  const [maxPlayers, setMaxPlayers] = useState(room.max_players ?? 4);

  return (
    <article className="glass-panel rounded-lg p-4">
      <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_10rem_8rem_9rem_7rem] lg:items-end">
        <label className="grid gap-2 text-sm text-slate-200">
          Nome stanza
          <input className="field px-3 py-2" value={name} onChange={(event) => setName(event.target.value)} />
        </label>
        <label className="grid gap-2 text-sm text-slate-200">
          Codice
          <input className="field px-3 py-2 font-mono" value={inviteCode} onChange={(event) => setInviteCode(event.target.value.toUpperCase())} />
        </label>
        <label className="grid gap-2 text-sm text-slate-200">
          Posti
          <input className="field px-3 py-2" type="number" min={1} max={12} value={maxPlayers} onChange={(event) => setMaxPlayers(Number(event.target.value))} />
        </label>
        <div className="text-sm text-slate-300">
          <p className="truncate text-white">{room.campaign_title ?? "Campagna"}</p>
          <p className="text-xs text-slate-500">{room.player_count ?? 0}/{maxPlayers} giocatori</p>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => onUpdate(room.id, { name: name.trim(), inviteCode: inviteCode.trim().toUpperCase(), maxPlayers })}
            className="flex h-10 w-10 items-center justify-center rounded-lg border border-emerald-400/25 bg-emerald-500/10 text-emerald-100 hover:bg-emerald-500/20"
            title="Salva modifiche"
            aria-label="Salva modifiche"
          >
            <Save size={16} />
          </button>
          <button
            type="button"
            onClick={() => onDelete(room)}
            className="flex h-10 w-10 items-center justify-center rounded-lg border border-rose-400/25 bg-rose-500/10 text-rose-100 hover:bg-rose-500/20"
            title="Elimina stanza"
            aria-label="Elimina stanza"
          >
            <Trash2 size={16} />
          </button>
        </div>
      </div>
      <p className="mt-3 text-xs text-slate-500">ID stanza: {room.id}</p>
    </article>
  );
}
