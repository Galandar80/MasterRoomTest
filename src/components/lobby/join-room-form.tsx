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

  function submitJoin() {
    if (isJoining) return;
    setIsJoining(true);
    Promise.resolve(onJoin(code, mode))
      .then((joined) => setError(joined ? "" : "Codice stanza non trovato."))
      .finally(() => setIsJoining(false));
  }

  return (
    <section className="mx-auto flex min-h-[calc(100vh-2.5rem)] w-full max-w-xl items-center p-4">
      <form
        className="ui-panel-window w-full rounded-xl p-8 relative flex flex-col gap-4 text-white shadow-2xl"
        onSubmit={(event) => {
          event.preventDefault();
          submitJoin();
        }}
      >
        <button
          type="button"
          onClick={onBack}
          className="self-start inline-flex items-center gap-2 rounded-lg border border-white/10 bg-white/[0.04] px-3 py-2 text-sm text-stone-300 hover:bg-white/[0.08] hover:text-white transition"
        >
          <ArrowLeft size={16} /> Menu
        </button>

        <h1 className="mt-2 text-2xl font-serif font-bold uppercase tracking-wider text-brass">
          Entra in stanza
        </h1>
        <p className="text-xs leading-relaxed text-slate-400">
          Inserisci il codice stanza fornito dal Master. Puoi rientrare come Master della sessione o unirti come eroe della campagna.
        </p>

        <div className="mt-2 grid grid-cols-2 gap-2 rounded-lg border border-white/5 bg-black/45 p-1">
          <button
            type="button"
            onClick={() => setMode("player")}
            className={`rounded px-3 py-2 text-xs font-serif font-bold uppercase tracking-wider transition duration-150 ${
              mode === "player"
                ? "bg-brass/25 text-brass border border-brass/45"
                : "bg-transparent text-stone-400 border border-transparent hover:text-white"
            }`}
          >
            Giocatore
          </button>
          <button
            type="button"
            onClick={() => setMode("master")}
            className={`rounded px-3 py-2 text-xs font-serif font-bold uppercase tracking-wider transition duration-150 ${
              mode === "master"
                ? "bg-brass/25 text-brass border border-brass/45"
                : "bg-transparent text-stone-400 border border-transparent hover:text-white"
            }`}
          >
            Master
          </button>
        </div>

        <label className="mt-2 grid gap-2 text-xs font-serif font-bold uppercase tracking-wider text-slate-300">
          Codice invito stanza
          <input
            className="field px-4 py-3.5 font-mono text-xl uppercase text-center"
            value={code}
            onChange={(event) => setCode(event.target.value.toUpperCase())}
            placeholder="VEY-R03"
            autoComplete="one-time-code"
            required
          />
        </label>

        {error ? (
          <p className="mt-2 rounded-lg border border-rose-450/20 bg-rose-500/10 px-3 py-2 text-xs text-rose-200">
            {error}
          </p>
        ) : null}

        <button
          type="submit"
          className="mt-4 w-full flex items-center justify-center gap-2 ui-btn-fantasy py-3"
          disabled={isJoining || !code.trim()}
        >
          <DoorOpen size={16} />{" "}
          {isJoining
            ? "Verifica codice..."
            : mode === "master"
              ? "Rientra come Master"
              : "Entra come eroe"}
        </button>
      </form>
    </section>
  );
}
