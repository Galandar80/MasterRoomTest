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
  const outgoingAudioRef = useRef<HTMLAudioElement>(null);
  const fadeTimerRef = useRef<number | null>(null);
  const [volume, setVolume] = useState(55);
  const [muted, setMuted] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [activeTrack, setActiveTrack] = useState(track);
  const [outgoingTrack, setOutgoingTrack] = useState<AudioTrack | null>(null);

  useEffect(() => {
    if (track.id === activeTrack.id) return;
    setOutgoingTrack(activeTrack.audio_url ? activeTrack : null);
    setActiveTrack(track);
  }, [activeTrack, track]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    audio.volume = muted ? 0 : volume / 100;
    audio.muted = muted;
    if (outgoingAudioRef.current) {
      outgoingAudioRef.current.muted = muted;
    }
  }, [muted, volume]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    audio.load();
    setPlaying(false);

    if (fadeTimerRef.current) {
      window.clearInterval(fadeTimerRef.current);
      fadeTimerRef.current = null;
    }

    const outgoingAudio = outgoingAudioRef.current;
    const targetVolume = muted ? 0 : volume / 100;
    audio.volume = 0;
    audio.muted = muted;

    if (autoStart && activeTrack.audio_url) {
      audio.play().then(() => {
        setPlaying(true);
        const startedAt = Date.now();
        const duration = outgoingAudio ? 1200 : 450;
        fadeTimerRef.current = window.setInterval(() => {
          const progress = Math.min(1, (Date.now() - startedAt) / duration);
          audio.volume = targetVolume * progress;

          if (outgoingAudio) {
            outgoingAudio.volume = targetVolume * (1 - progress);
            if (progress >= 1) {
              outgoingAudio.pause();
              setOutgoingTrack(null);
            }
          }

          if (progress >= 1 && fadeTimerRef.current) {
            window.clearInterval(fadeTimerRef.current);
            fadeTimerRef.current = null;
          }
        }, 40);
      }).catch(() => setPlaying(false));
    } else {
      audio.pause();
      if (outgoingAudio) {
        outgoingAudio.pause();
        setOutgoingTrack(null);
      }
    }
  }, [activeTrack, autoStart, muted, volume]);

  useEffect(() => {
    const outgoingAudio = outgoingAudioRef.current;
    if (!outgoingAudio || !outgoingTrack?.audio_url) return;
    outgoingAudio.volume = muted ? 0 : volume / 100;
    outgoingAudio.muted = muted;
    outgoingAudio.play().catch(() => undefined);
  }, [muted, outgoingTrack, volume]);

  useEffect(() => {
    return () => {
      if (fadeTimerRef.current) window.clearInterval(fadeTimerRef.current);
    };
  }, []);

  async function togglePlayback() {
    const audio = audioRef.current;
    if (!audio || !activeTrack.audio_url) return;

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
      {activeTrack.audio_url ? <audio ref={audioRef} src={activeTrack.audio_url} loop={activeTrack.loop} preload="auto" /> : null}
      {outgoingTrack?.audio_url ? <audio ref={outgoingAudioRef} src={outgoingTrack.audio_url} loop={outgoingTrack.loop} preload="auto" /> : null}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="flex min-w-0 flex-1 items-center gap-3">
          <div className="player-audio-icon flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-brass/25 bg-brass/10 text-brass">
            <Music2 size={18} />
          </div>
          <div className="min-w-0">
            <p className="player-audio-kicker">Atmosfera locale</p>
            <p className="truncate text-sm font-semibold text-white">{activeTrack.title}</p>
            <p className="text-xs text-slate-400">{activeTrack.loop ? "Loop attivo" : "Loop disattivato"} · volume locale{outgoingTrack ? " · crossfade" : ""}</p>
          </div>
        </div>

        <div className="player-audio-controls flex items-center gap-2">
          <button
            type="button"
            title={playing ? "Pausa locale" : "Riproduci locale"}
            aria-label={playing ? "Pausa locale" : "Riproduci locale"}
            onClick={togglePlayback}
            disabled={!activeTrack.audio_url}
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
