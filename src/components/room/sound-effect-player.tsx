"use client";

import { useEffect, useRef, useState } from "react";
import { Volume2 } from "lucide-react";
import type { Room, SoundEffect } from "@/lib/types";

type SoundEffectPlayerProps = {
  room: Room;
  soundEffects: SoundEffect[];
};

export function SoundEffectPlayer({ room, soundEffects }: SoundEffectPlayerProps) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [blocked, setBlocked] = useState(false);
  const currentEffect = soundEffects.find((effect) => effect.id === room.current_sound_effect_id);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    setBlocked(false);

    if (!currentEffect?.audio_url) {
      audio.pause();
      audio.removeAttribute("src");
      audio.load();
      return;
    }

    audio.src = currentEffect.audio_url;
    audio.loop = currentEffect.loop;
    audio.currentTime = 0;

    const playAttempt = audio.play();
    if (playAttempt) {
      playAttempt.catch(() => setBlocked(true));
    }
  }, [currentEffect?.audio_url, currentEffect?.loop, room.sound_effect_started_at]);

  if (!currentEffect) {
    return <audio ref={audioRef} />;
  }

  return (
    <div className="rounded-lg border border-white/10 bg-black/25 px-3 py-2 text-xs text-slate-300">
      <audio ref={audioRef} />
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="inline-flex items-center gap-2">
          <Volume2 size={14} className="text-brass" />
          Rumore ambiente: <strong className="text-white">{currentEffect.title}</strong>
        </span>
        {blocked ? (
          <button
            type="button"
            onClick={() => audioRef.current?.play().then(() => setBlocked(false)).catch(() => setBlocked(true))}
            className="rounded-md border border-ember-400/25 bg-ember-500/10 px-2 py-1 text-ember-100 hover:bg-ember-500/20"
          >
            Attiva audio
          </button>
        ) : null}
      </div>
    </div>
  );
}
