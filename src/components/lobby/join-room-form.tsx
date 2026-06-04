"use client";

import { ArrowLeft, DoorOpen, KeyRound } from "lucide-react";
import { useState } from "react";
import type { Room } from "@/lib/types";

export type JoinMode = "player" | "master";

type JoinRoomFormProps = {
  room: Room;
  onBack: () => void;
  onJoin: (code: string, mode: JoinMode) => boolean | Promise<boolean>;
};

export function JoinRoomForm({ room, onBack, onJoin }: JoinRoomFormProps) {
  const [code, setCode] = useState(room.invite_code);
  const [mode, setMode] = useState<JoinMode>("player");
  const [error, setError] = useState("");
  const [isJoining, setIsJoining] = useState(false);

  return (
    <section className="mx-auto flex min-h-[calc(100vh-2.5rem)] w-full max-w-3xl items-center">
      <form
        className="glass-panel w-full rounded-lg p-5 sm:p-7"
        onSubmit={(event) => {
          event.preventDefault();
          setIsJoining(true);
          Promise.resolve(onJoin(code, mode))
            .then((joined) => setError(joined ? "" : "Codice stanza non trovato."))
            .finally(() => setIsJoining(false));
        }}
      >
        <button
          type="button"
          onClick={onBack}
          className="mb-6 inline-flex items-center gap-2 rounded-lg border border-white/10 bg-white/[0.04] px-3 py-2 text-sm text-white hover:bg-white/[0.08]"
        >
          <ArrowLeft size={16} /> Menu
        </button>
        <div className="flex h-12 w-12 items-center justify-center rounded-lg border border-brass/25 bg-brass/10 text-brass">
          <KeyRound size={22} />
        </div>
        <h1 className="mt-4 text-3xl font-semibold text-white">Entra in una stanza</h1>
        <p className="mt-3 text-sm leading-6 text-slate-300">
          Inserisci il codice stanza. Se hai creato tu la partita puoi rientrare come Master, altrimenti entra come giocatore.
        </p>

        <div className="mt-6 grid grid-cols-2 gap-2 rounded-lg border border-white/10 bg-black/20 p-1">
          <button
            type="button"
            onClick={() => setMode("player")}
            className={`rounded-md px-3 py-2 text-sm font-medium ${mode === "player" ? "bg-ember-500 text-ink-900" : "text-slate-300"}`}
          >
            Giocatore
          </button>
          <button
            type="button"
            onClick={() => setMode("master")}
            className={`rounded-md px-3 py-2 text-sm font-medium ${mode === "master" ? "bg-ember-500 text-ink-900" : "text-slate-300"}`}
          >
            Master
          </button>
        </div>

        <label className="mt-4 grid gap-2 text-sm text-slate-200">
          Codice stanza
          <input
            className="field px-4 py-4 font-mono text-xl uppercase"
            value={code}
            onChange={(event) => setCode(event.target.value.toUpperCase())}
            placeholder="VEY-R03"
          />
        </label>

        {error ? <p className="mt-3 rounded-lg border border-rose-400/20 bg-rose-500/10 px-3 py-2 text-sm text-rose-100">{error}</p> : null}

        <button className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-ember-500 px-4 py-3 font-semibold text-ink-900 hover:bg-ember-400">
          <DoorOpen size={18} /> {isJoining ? "Controllo codice..." : mode === "master" ? "Rientra come Master" : "Entra come giocatore"}
        </button>
      </form>
    </section>
  );
}
