"use client";

import { ArrowLeft, RefreshCw, Save, Shield, Trash2 } from "lucide-react";
import { useState } from "react";
import type { AdminRoomOverview } from "@/lib/supabase/room-service";

type SuperAdminRoomsProps = {
  rooms: AdminRoomOverview[];
  onBack: () => void;
  onRefresh: () => void;
  onUpdate: (roomId: string, values: { name: string; inviteCode: string; maxPlayers: number }) => void;
  onDelete: (room: AdminRoomOverview) => void;
};

export function SuperAdminRooms({ rooms, onBack, onRefresh, onUpdate, onDelete }: SuperAdminRoomsProps) {
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
      </header>

      <div className="grid gap-3">
        {rooms.map((room) => (
          <AdminRoomCard key={room.id} room={room} onUpdate={onUpdate} onDelete={onDelete} />
        ))}
        {!rooms.length ? <p className="glass-panel rounded-lg p-5 text-sm text-slate-300">Nessuna stanza trovata.</p> : null}
      </div>
    </section>
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
