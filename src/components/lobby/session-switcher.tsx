"use client";

import { ArrowLeft, Clipboard, Crown, DoorOpen, Loader2, RefreshCw, Shield, UserRound } from "lucide-react";
import type React from "react";
import { useMemo, useState } from "react";
import type { UserSessionSummary } from "@/lib/supabase/room-service";
import { playUiClick, playUiHover } from "@/lib/sound-generator";

type SessionSwitcherProps = {
  sessions: UserSessionSummary[];
  isLoading?: boolean;
  onBack: () => void;
  onRefresh: () => void;
  onOpenSession: (session: UserSessionSummary) => void;
};

type SessionTab = "master" | "player";

export function SessionSwitcher({ sessions, isLoading = false, onBack, onRefresh, onOpenSession }: SessionSwitcherProps) {
  const [tab, setTab] = useState<SessionTab>("master");
  const masterSessions = useMemo(() => sessions.filter((session) => session.role === "master"), [sessions]);
  const playerSessions = useMemo(() => sessions.filter((session) => session.role === "player"), [sessions]);
  const activeSessions = tab === "master" ? masterSessions : playerSessions;

  return (
    <section className="mx-auto grid min-h-[calc(100vh-2.5rem)] w-full max-w-6xl content-center gap-5 p-4 text-white">
      <header className="ui-panel-window rounded-xl p-5 shadow-2xl">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <button
            type="button"
            onMouseEnter={playUiHover}
            onClick={() => {
              playUiClick();
              onBack();
            }}
            className="inline-flex items-center gap-2 rounded-lg border border-white/10 bg-white/[0.04] px-3 py-2 text-sm text-stone-300 transition hover:bg-white/[0.08] hover:text-white"
          >
            <ArrowLeft size={16} /> Menu
          </button>

          <div className="text-center">
            <p className="font-serif text-xs uppercase tracking-[0.3em] text-brass/80">Continuita di gioco</p>
            <h1 className="mt-1 font-serif text-2xl font-bold uppercase tracking-[0.18em] text-brass">Le tue sessioni</h1>
          </div>

          <button
            type="button"
            onMouseEnter={playUiHover}
            onClick={() => {
              playUiClick();
              onRefresh();
            }}
            className="inline-flex items-center gap-2 rounded-lg border border-brass/30 bg-brass/10 px-3 py-2 text-sm text-brass transition hover:bg-brass/15"
            disabled={isLoading}
          >
            {isLoading ? <Loader2 className="animate-spin" size={15} /> : <RefreshCw size={15} />}
            Aggiorna
          </button>
        </div>

        <p className="mx-auto mt-4 max-w-2xl text-center text-sm leading-6 text-stone-300/78">
          Scegli una stanza senza affidarti al rientro automatico: regia per le campagne che hai creato, tavolo per i personaggi con cui partecipi.
        </p>
      </header>

      <main className="ui-panel-window rounded-xl p-5 shadow-2xl">
        <div className="grid gap-2 rounded-lg border border-white/5 bg-black/45 p-1 sm:grid-cols-2" role="tablist" aria-label="Filtra sessioni">
          <TabButton
            active={tab === "master"}
            icon={<Crown size={16} />}
            label="Come Master"
            count={masterSessions.length}
            onClick={() => setTab("master")}
          />
          <TabButton
            active={tab === "player"}
            icon={<UserRound size={16} />}
            label="Come Giocatore"
            count={playerSessions.length}
            onClick={() => setTab("player")}
          />
        </div>

        {isLoading ? (
          <div className="grid min-h-72 place-items-center text-center text-stone-300">
            <div>
              <Loader2 className="mx-auto mb-3 animate-spin text-brass" size={26} />
              <p className="font-serif text-sm uppercase tracking-[0.2em] text-brass">Caricamento sessioni</p>
            </div>
          </div>
        ) : activeSessions.length ? (
          <div className="mt-5 grid gap-3 lg:grid-cols-2">
            {activeSessions.map((session) => (
              <SessionCard key={session.id} session={session} onOpen={() => onOpenSession(session)} />
            ))}
          </div>
        ) : (
          <EmptySessionsState role={tab} />
        )}
      </main>
    </section>
  );
}

function TabButton({
  active,
  icon,
  label,
  count,
  onClick
}: {
  active: boolean;
  icon: React.ReactNode;
  label: string;
  count: number;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onMouseEnter={playUiHover}
      onClick={() => {
        playUiClick();
        onClick();
      }}
      role="tab"
      aria-selected={active}
      className={`rounded px-3 py-3 text-left transition duration-150 ${
        active ? "border border-brass/45 bg-brass/25 text-brass" : "border border-transparent bg-transparent text-stone-400 hover:text-white"
      }`}
    >
      <span className="flex items-center justify-between gap-3">
        <span className="flex items-center gap-2 font-serif text-xs font-bold uppercase tracking-wider">
          {icon} {label}
        </span>
        <span className="rounded-full border border-current/25 px-2 py-0.5 text-[10px]">{count}</span>
      </span>
    </button>
  );
}

function SessionCard({ session, onOpen }: { session: UserSessionSummary; onOpen: () => void }) {
  const [copied, setCopied] = useState(false);

  async function copyCode() {
    try {
      await navigator.clipboard.writeText(session.inviteCode);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1400);
    } catch {
      setCopied(false);
    }
  }

  return (
    <article className="rounded-xl border border-brass/20 bg-black/40 p-4 shadow-[0_0_28px_rgba(0,0,0,0.18)]">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="flex items-center gap-2 font-serif text-xs uppercase tracking-[0.22em] text-brass/80">
            {session.role === "master" ? <Crown size={14} /> : <UserRound size={14} />}
            {session.role === "master" ? "Regia Master" : "Tavolo Giocatore"}
          </p>
          <h2 className="mt-2 truncate font-serif text-xl uppercase tracking-[0.1em] text-stone-100">{session.campaignTitle}</h2>
          <p className="mt-1 truncate text-sm text-stone-300/75">{session.roomName}</p>
        </div>
        <span className="shrink-0 rounded-full border border-emerald-300/25 bg-emerald-500/10 px-2.5 py-1 text-[10px] uppercase tracking-[0.16em] text-emerald-200">
          {session.campaignStatus ?? "active"}
        </span>
      </div>

      <div className="mt-4 grid gap-2 rounded-lg border border-white/10 bg-white/[0.03] p-3 text-xs text-stone-300/80 sm:grid-cols-2">
        <span>
          Codice <strong className="font-mono text-brass">{session.inviteCode}</strong>
        </span>
        <span>
          Giocatori {session.playerCount}/{session.maxPlayers}
        </span>
        <span className="sm:col-span-2">
          {session.role === "player"
            ? `Personaggio: ${session.characterName || "Da completare"}`
            : `Creata il ${formatDate(session.createdAt)}`}
        </span>
      </div>

      <div className="mt-4 grid gap-2 sm:grid-cols-[1fr_auto]">
        <button
          type="button"
          onMouseEnter={playUiHover}
          onClick={() => {
            playUiClick();
            onOpen();
          }}
          className="inline-flex items-center justify-center gap-2 rounded-lg border border-brass/35 bg-brass/15 px-4 py-2.5 font-serif text-sm uppercase tracking-[0.14em] text-brass transition hover:bg-brass/20"
        >
          {session.role === "master" ? <Shield size={16} /> : <DoorOpen size={16} />}
          {session.role === "master" ? "Apri regia" : session.isSetupComplete ? "Rientra" : "Completa eroe"}
        </button>
        <button
          type="button"
          onMouseEnter={playUiHover}
          onClick={() => {
            playUiClick();
            copyCode();
          }}
          className="inline-flex items-center justify-center gap-2 rounded-lg border border-white/10 bg-white/[0.04] px-4 py-2.5 text-sm text-stone-300 transition hover:bg-white/[0.08] hover:text-white"
        >
          <Clipboard size={15} />
          {copied ? "Copiato" : "Copia codice"}
        </button>
      </div>
    </article>
  );
}

function EmptySessionsState({ role }: { role: SessionTab }) {
  return (
    <div className="mt-5 grid min-h-72 place-items-center rounded-xl border border-dashed border-white/10 bg-black/25 p-8 text-center">
      <div className="max-w-md">
        <div className="mx-auto mb-4 grid h-12 w-12 place-items-center rounded-full border border-brass/25 bg-brass/10 text-brass">
          {role === "master" ? <Crown size={22} /> : <UserRound size={22} />}
        </div>
        <h2 className="font-serif text-lg uppercase tracking-[0.18em] text-brass">
          {role === "master" ? "Nessuna regia attiva" : "Nessun tavolo giocatore"}
        </h2>
        <p className="mt-3 text-sm leading-6 text-stone-400">
          {role === "master"
            ? "Crea una partita dal menu per vederla qui e rientrare senza codice."
            : "Entra con un codice stanza: il tuo personaggio comparira qui ai prossimi accessi."}
        </p>
      </div>
    </div>
  );
}

function formatDate(value: string) {
  if (!value) return "n/d";
  return new Date(value).toLocaleDateString("it-IT", { day: "2-digit", month: "2-digit", year: "2-digit" });
}
