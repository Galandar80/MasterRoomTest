"use client";

import { Dice5, Eye, Send, UserRound } from "lucide-react";
import { useMemo, useState } from "react";
import type { Character, DiceRequest, Npc, Room } from "@/lib/types";
import { getDiceCount, stripDiceCountMarker } from "@/lib/game-random";

export function DiceRequestPanel({
  characters,
  onCreate
}: {
  characters: Character[];
  onCreate: (values: { diceCount: number; diceSides: number; reason: string; targetUserId?: string | null; visibility: "public" | "private" }) => void;
}) {
  const [diceCount, setDiceCount] = useState(1);
  const [diceSides, setDiceSides] = useState(20);
  const [reason, setReason] = useState("");
  const [targetUserId, setTargetUserId] = useState("");
  const [visibility, setVisibility] = useState<"public" | "private">("public");

  return (
    <section className="glass-panel rounded-lg p-4">
      <h2 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.18em] text-brass">
        <Dice5 size={16} /> Richiedi tiro
      </h2>
      <form
        className="mt-4 grid gap-2"
        onSubmit={(event) => {
          event.preventDefault();
          onCreate({ diceCount, diceSides, reason: reason.trim(), targetUserId: targetUserId || null, visibility });
          setReason("");
        }}
      >
        <div className="grid gap-2 sm:grid-cols-[7rem_1fr_1fr_1fr]">
          <input
            className="field px-3 py-2 text-sm"
            aria-label="Numero dadi"
            type="number"
            min="1"
            max="20"
            value={diceCount}
            onChange={(event) => setDiceCount(Math.max(1, Number(event.target.value)))}
          />
          <select className="field px-3 py-2 text-sm" value={diceSides} onChange={(event) => setDiceSides(Number(event.target.value))}>
            {[4, 6, 8, 10, 12, 20, 100].map((sides) => (
              <option key={sides} value={sides}>d{sides}</option>
            ))}
          </select>
          <select className="field px-3 py-2 text-sm" value={targetUserId} onChange={(event) => setTargetUserId(event.target.value)}>
            <option value="">Tutti</option>
            {characters.map((character) => (
              <option key={character.id} value={character.user_id}>{character.character_name} {character.character_surname}</option>
            ))}
          </select>
          <select className="field px-3 py-2 text-sm" value={visibility} onChange={(event) => setVisibility(event.target.value as "public" | "private")}>
            <option value="public">Pubblico</option>
            <option value="private">Privato</option>
          </select>
        </div>
        <input className="field px-3 py-2 text-sm" placeholder="Motivo tiro, es. Percezione" value={reason} onChange={(event) => setReason(event.target.value)} />
        <button className="inline-flex items-center justify-center gap-2 rounded-lg border border-ember-400/25 bg-ember-500/10 px-3 py-2 text-sm font-medium text-ember-100 hover:bg-ember-500/20">
          <Send size={16} /> Invia richiesta
        </button>
      </form>
    </section>
  );
}

export function PlayerDicePanel({ requests, onRoll }: { requests: DiceRequest[]; onRoll: (request: DiceRequest) => void }) {
  const pending = requests.filter((request) => request.status === "pending");
  if (!pending.length) return null;

  return (
    <section className="glass-panel rounded-lg p-4">
      <h2 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.18em] text-brass">
        <Dice5 size={16} /> Tiri richiesti
      </h2>
      <div className="mt-4 grid gap-2">
        {pending.map((request) => (
          <article key={request.id} className="flex items-center justify-between gap-3 rounded-lg border border-white/10 bg-white/[0.04] p-3">
            <div>
              <p className="text-sm font-semibold text-white">Tira {getDiceCount(request)}d{request.dice_sides}</p>
              <p className="text-xs text-slate-400">{stripDiceCountMarker(request.reason) || "Tiro richiesto dal Master"}</p>
            </div>
            <button type="button" onClick={() => onRoll(request)} className="rounded-lg bg-ember-500 px-3 py-2 text-sm font-semibold text-ink-900 hover:bg-ember-400">
              Tira
            </button>
          </article>
        ))}
      </div>
    </section>
  );
}

export function SpotlightPanel({ room, npcs, currentUserId }: { room: Room; npcs: Npc[]; currentUserId: string }) {
  const npc = useMemo(() => npcs.find((item) => item.id === room.spotlight_npc_id), [npcs, room.spotlight_npc_id]);
  const visible =
    npc &&
    room.spotlight_visibility !== "off" &&
    (room.spotlight_visibility === "public" || room.spotlight_user_ids?.includes(currentUserId));

  if (!visible) return null;

  return (
    <section className="glass-panel rounded-lg p-4">
      <h2 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.18em] text-brass">
        <UserRound size={16} /> In conversazione
      </h2>
      <div className="mt-3 flex gap-3">
        {npc.portrait_url ? <div className="h-20 w-20 shrink-0 rounded-lg bg-cover bg-center" style={{ backgroundImage: `url(${npc.portrait_url})` }} /> : null}
        <div>
          <p className="font-semibold" style={{ color: npc.color }}>{npc.name}</p>
          <p className="mt-1 text-sm leading-6 text-slate-300">{npc.description}</p>
        </div>
      </div>
    </section>
  );
}

export function SpotlightManager({
  room,
  npcs,
  characters,
  onSave
}: {
  room: Room;
  npcs: Npc[];
  characters: Character[];
  onSave: (values: { npcId: string | null; visibility: "off" | "public" | "private"; userIds: string[] }) => void;
}) {
  const [npcId, setNpcId] = useState(room.spotlight_npc_id ?? "");
  const [visibility, setVisibility] = useState<"off" | "public" | "private">(room.spotlight_visibility ?? "off");
  const [userIds, setUserIds] = useState<string[]>(room.spotlight_user_ids ?? []);

  return (
    <section className="glass-panel rounded-lg p-4">
      <h2 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.18em] text-brass">
        <Eye size={16} /> Personaggio in conversazione
      </h2>
      <div className="mt-4 grid gap-2">
        <select className="field px-3 py-2 text-sm" value={npcId} onChange={(event) => setNpcId(event.target.value)}>
          <option value="">Nessuno</option>
          {npcs.map((npc) => <option key={npc.id} value={npc.id}>{npc.name}</option>)}
        </select>
        <select className="field px-3 py-2 text-sm" value={visibility} onChange={(event) => setVisibility(event.target.value as "off" | "public" | "private")}>
          <option value="off">Nascosto</option>
          <option value="public">Pubblico</option>
          <option value="private">Solo selezionati</option>
        </select>
        {visibility === "private" ? (
          <div className="grid gap-2">
            {characters.map((character) => (
              <label key={character.id} className="flex items-center justify-between rounded-lg border border-white/10 bg-white/[0.04] px-3 py-2 text-sm text-slate-200">
                {character.character_name} {character.character_surname}
                <input
                  type="checkbox"
                  checked={userIds.includes(character.user_id)}
                  onChange={() => setUserIds((ids) => (ids.includes(character.user_id) ? ids.filter((id) => id !== character.user_id) : [...ids, character.user_id]))}
                />
              </label>
            ))}
          </div>
        ) : null}
        <button type="button" onClick={() => onSave({ npcId: npcId || null, visibility, userIds })} className="rounded-lg border border-emerald-400/25 bg-emerald-500/10 px-3 py-2 text-sm font-medium text-emerald-100 hover:bg-emerald-500/20">
          Salva focus
        </button>
      </div>
    </section>
  );
}
