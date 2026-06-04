"use client";

import { Music2, Pause, Play, Volume2, VolumeX } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import type { AudioTrack } from "@/lib/types";

type AudioPlayerProps = {
  track: AudioTrack;
  autoStart?: boolean;
};

export function AudioPlayer({ track, autoStart = true }: AudioPlayerProps) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [volume, setVolume] = useState(55);
  const [muted, setMuted] = useState(false);
  const [playing, setPlaying] = useState(false);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    audio.volume = muted ? 0 : volume / 100;
    audio.muted = muted;
  }, [muted, volume]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    audio.pause();
    audio.load();
    setPlaying(false);

    if (autoStart && track.audio_url) {
      audio.play().then(() => setPlaying(true)).catch(() => setPlaying(false));
    }
  }, [autoStart, track.audio_url]);

  async function togglePlayback() {
    const audio = audioRef.current;
    if (!audio || !track.audio_url) return;

    if (playing) {
      audio.pause();
      setPlaying(false);
      return;
    }

    try {
      await audio.play();
      setPlaying(true);
    } catch {
      setPlaying(false);
    }
  }

  return (
    <section className="player-audio-dock glass-panel sticky bottom-3 z-20 rounded-lg p-3">
      {track.audio_url ? <audio ref={audioRef} src={track.audio_url} loop={track.loop} preload="auto" /> : null}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="flex min-w-0 flex-1 items-center gap-3">
          <div className="player-audio-icon flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-brass/25 bg-brass/10 text-brass">
            <Music2 size={18} />
          </div>
          <div className="min-w-0">
            <p className="player-audio-kicker">Atmosfera locale</p>
            <p className="truncate text-sm font-semibold text-white">{track.title}</p>
            <p className="text-xs text-slate-400">{track.loop ? "Loop attivo" : "Loop disattivato"} · volume locale</p>
          </div>
        </div>

        <div className="player-audio-controls flex items-center gap-2">
          <button
            type="button"
            title={playing ? "Pausa locale" : "Riproduci locale"}
            aria-label={playing ? "Pausa locale" : "Riproduci locale"}
            onClick={togglePlayback}
            disabled={!track.audio_url}
            className="flex h-10 w-10 items-center justify-center rounded-lg border border-white/10 bg-white/[0.04] text-white hover:bg-white/[0.08] disabled:cursor-not-allowed disabled:opacity-45"
          >
            {playing ? <Pause size={17} /> : <Play size={17} />}
          </button>
          <button
            type="button"
            title={muted ? "Riattiva audio" : "Disattiva audio"}
            aria-label={muted ? "Riattiva audio" : "Disattiva audio"}
            onClick={() => setMuted((value) => !value)}
            className="flex h-10 w-10 items-center justify-center rounded-lg border border-white/10 bg-white/[0.04] text-white hover:bg-white/[0.08]"
          >
            {muted ? <VolumeX size={17} /> : <Volume2 size={17} />}
          </button>
          <input
            aria-label="Volume locale"
            className="w-32 accent-ember-500"
            type="range"
            min="0"
            max="100"
            value={muted ? 0 : volume}
            onChange={(event) => {
              setMuted(false);
              setVolume(Number(event.target.value));
            }}
          />
        </div>
      </div>
    </section>
  );
}
