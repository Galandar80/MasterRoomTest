"use client";

import {
  BookOpen,
  Crown,
  DoorOpen,
  Dices,
  LogOut,
  Moon,
  Plus,
  Settings,
  Shield,
  Sparkles,
  Users,
  Volume2,
  VolumeX,
  Wand2
} from "lucide-react";
import type { ReactNode } from "react";
import { useEffect, useRef, useState } from "react";

type StartMenuProps = {
  onCreate: () => void;
  onJoin: () => void;
  onSignOut?: () => void;
  isSuperAdmin?: boolean;
  onSuperAdmin?: () => void;
};

export function StartMenu({
  onCreate,
  onJoin,
  onSignOut,
  isSuperAdmin = false,
  onSuperAdmin
}: StartMenuProps) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [ambienceEnabled, setAmbienceEnabled] = useState(true);
  const [ambienceVolume, setAmbienceVolume] = useState(34);
  const [moonMode, setMoonMode] = useState(false);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    audio.volume = ambienceEnabled ? ambienceVolume / 100 : 0;
    audio.muted = !ambienceEnabled;
    if (!ambienceEnabled) {
      audio.pause();
      return;
    }

    audio.play().catch(() => {
      // Browser autoplay may wait for the first user interaction.
    });
  }, [ambienceEnabled, ambienceVolume]);

  useEffect(() => {
    const unlockAudio = () => {
      const audio = audioRef.current;
      if (!audio || !ambienceEnabled) return;
      audio.play().catch(() => {});
    };

    window.addEventListener("pointerdown", unlockAudio, { once: true });
    return () => window.removeEventListener("pointerdown", unlockAudio);
  }, [ambienceEnabled]);

  useEffect(() => {
    const audio = audioRef.current;
    return () => {
      if (!audio) return;
      audio.pause();
      audio.currentTime = 0;
    };
  }, []);

  return (
    <section className={`premium-start-menu relative -m-4 min-h-screen overflow-hidden px-5 py-6 text-white sm:-m-6 sm:px-10 lg:px-16 ${moonMode ? "premium-start-menu--moon" : ""}`}>
      <audio ref={audioRef} src="/assets/audio/master-room-ambience-2.mp3" loop preload="auto" />
      <div className="absolute inset-0 bg-[url('/assets/menu/master-room-hero.png')] bg-cover bg-center" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_74%_24%,rgba(111,46,175,0.28),transparent_28rem),linear-gradient(90deg,rgba(2,3,7,0.58)_0%,rgba(2,3,7,0.2)_48%,rgba(2,3,7,0.74)_100%),linear-gradient(180deg,rgba(0,0,0,0.34)_0%,rgba(0,0,0,0.08)_42%,rgba(0,0,0,0.88)_100%)]" />

      <div className="relative z-10 flex min-h-[calc(100vh-3rem)] flex-col">
        <header className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="premium-logo-mark">
              <Dices size={33} strokeWidth={1.35} />
            </div>
            <div>
              <p className="font-serif text-2xl uppercase tracking-[0.28em] text-brass sm:text-3xl">GDR</p>
              <p className="font-serif text-sm uppercase tracking-[0.36em] text-brass/90 sm:text-base">Master Room</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button type="button" onClick={() => setSettingsOpen((value) => !value)} className="premium-icon-button" aria-label="Impostazioni" aria-expanded={settingsOpen}>
              <Settings size={20} />
            </button>
            <button type="button" onClick={() => setMoonMode((value) => !value)} className="premium-icon-button" aria-label="Tema lunare" aria-pressed={moonMode}>
              <Moon size={20} />
            </button>
            {onSignOut ? (
              <button type="button" onClick={onSignOut} className="premium-icon-button" aria-label="Logout">
                <LogOut size={20} />
              </button>
            ) : null}
          </div>
        </header>

        {settingsOpen ? (
          <div className="premium-settings-popover">
            <h2>Impostazioni menu</h2>
            <label className="premium-setting-row">
              <span>{ambienceEnabled ? <Volume2 size={16} /> : <VolumeX size={16} />} Musica menu</span>
              <input type="checkbox" checked={ambienceEnabled} onChange={(event) => setAmbienceEnabled(event.target.checked)} />
            </label>
            <label className="grid gap-2 text-sm text-stone-300">
              Volume tema
              <input
                type="range"
                min="0"
                max="100"
                value={ambienceVolume}
                onChange={(event) => setAmbienceVolume(Number(event.target.value))}
                disabled={!ambienceEnabled}
              />
            </label>
            <label className="premium-setting-row">
              <span>Modalita lunare</span>
              <input type="checkbox" checked={moonMode} onChange={(event) => setMoonMode(event.target.checked)} />
            </label>
          </div>
        ) : null}

        <div className="grid flex-1 items-center gap-8 py-10 lg:grid-cols-[minmax(0,1fr)_minmax(25rem,32rem)] lg:gap-14">
          <div className="max-w-3xl">
            <div className="premium-rule mb-8 hidden sm:block" />
            <p className="mb-4 text-xs uppercase tracking-[0.34em] text-brass/80 sm:hidden">GDR Master Room</p>
            <h1 className="font-serif text-[clamp(3rem,6.4vw,5.9rem)] leading-[0.98] text-stone-100 drop-shadow-[0_8px_28px_rgba(0,0,0,0.72)]">
              Prepara la sessione,
              <br />
              apri la stanza,
              <br />
              lascia entrare la <span className="text-ember-400">storia.</span>
            </h1>
            <div className="premium-rule my-7 max-w-xl" />
            <p className="max-w-xl text-lg leading-8 text-stone-200/88">
              Un ingresso chiaro per Master e giocatori: crea una partita, genera un codice stanza
              o raggiungi una sessione gia avviata.
            </p>

            <div className="premium-feature-strip mt-12 hidden max-w-3xl grid-cols-3 divide-x divide-brass/10 lg:grid">
              <Feature icon={<Shield size={26} />} title="Narra" text="Crea mondi indimenticabili" />
              <Feature icon={<Dices size={26} />} title="Condividi" text="Vivi la storia insieme ai tuoi giocatori" />
              <Feature icon={<BookOpen size={26} />} title="Ricorda" text="Ogni sessione lascia il segno" />
            </div>
          </div>

          <article className="premium-menu-panel">
            <div className="mx-auto mb-6 grid h-28 w-28 place-items-center rounded-full border border-brass/40 bg-black/28 shadow-[0_0_60px_rgba(147,51,234,0.24)]">
              <div className="relative grid h-20 w-20 place-items-center rounded-full border border-brass/60 bg-black/35 text-brass">
                <Crown className="mb-8 absolute" size={28} strokeWidth={1.3} />
                <Dices size={45} strokeWidth={1.15} />
              </div>
            </div>

            <div className="text-center">
              <h2 className="font-serif text-2xl uppercase tracking-[0.32em] text-brass">Menu partita</h2>
              <div className="premium-divider mx-auto my-5" />
              <p className="mx-auto max-w-sm text-sm leading-7 text-stone-200/82">
                Parti come Master per creare campagna e stanza, oppure entra come giocatore usando il codice invito.
              </p>
            </div>

            <div className="mt-8 grid gap-4">
              <button type="button" onClick={onCreate} className="premium-action premium-action-ember">
                <span className="premium-action-icon">
                  <Plus size={34} />
                </span>
                <span>
                  <span className="block font-serif text-xl uppercase tracking-[0.14em] text-stone-100">Crea partita</span>
                  <span className="mt-1 block text-sm text-stone-200/70">Nuova campagna / nuova stanza</span>
                </span>
              </button>

              <button type="button" onClick={onJoin} className="premium-action premium-action-violet">
                <span className="premium-action-icon">
                  <DoorOpen size={30} />
                </span>
                <span>
                  <span className="block font-serif text-xl uppercase tracking-[0.14em] text-stone-100">Entra con codice stanza</span>
                  <span className="mt-1 block text-sm text-stone-200/70">Unisciti a una sessione esistente</span>
                </span>
              </button>

              {isSuperAdmin ? (
                <button type="button" onClick={onSuperAdmin} className="premium-action premium-action-emerald">
                  <span className="premium-action-icon">
                    <Shield size={29} />
                  </span>
                  <span>
                    <span className="block font-serif text-xl uppercase tracking-[0.14em] text-stone-100">Superadmin</span>
                    <span className="mt-1 block text-sm text-stone-200/70">Controlla stanze, giocatori e sessioni</span>
                  </span>
                </button>
              ) : null}
            </div>

            <div className="mt-8">
              <div className="premium-divider mx-auto mb-4">
                <span>Opzioni rapide</span>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <QuickOption icon={<Users size={25} />} title="Accesso giocatore" text="Entra rapidamente" onClick={onJoin} />
                <QuickOption icon={<Wand2 size={25} />} title="Cabina Master" text="Prepara la scena" onClick={onCreate} />
              </div>
            </div>
          </article>
        </div>

        <footer className="hidden items-center gap-6 pb-2 text-xs uppercase tracking-[0.5em] text-brass/80 sm:flex">
          <span className="text-stone-500">v1.0.0</span>
          <span className="h-px flex-1 bg-gradient-to-r from-transparent via-brass/40 to-transparent" />
          <span className="font-serif">Ogni storia inizia con una scelta.</span>
          <span className="h-px flex-1 bg-gradient-to-r from-transparent via-brass/40 to-transparent" />
          <span className="font-serif tracking-[0.28em] text-stone-400">Dario Germanà</span>
        </footer>
      </div>
    </section>
  );
}

function Feature({ icon, title, text }: { icon: ReactNode; title: string; text: string }) {
  return (
    <div className="flex items-start gap-4 px-7 py-5">
      <span className="mt-1 text-brass">{icon}</span>
      <span>
        <span className="block font-serif text-sm uppercase tracking-[0.24em] text-brass">{title}</span>
        <span className="mt-2 block text-sm leading-5 text-stone-300/72">{text}</span>
      </span>
    </div>
  );
}

function QuickOption({
  icon,
  title,
  text,
  onClick
}: {
  icon: ReactNode;
  title: string;
  text: string;
  onClick: () => void;
}) {
  return (
    <button type="button" onClick={onClick} className="premium-quick-option">
      <span className="text-brass">{icon}</span>
      <span className="font-serif text-sm uppercase tracking-[0.18em] text-brass">{title}</span>
      <span className="text-sm leading-5 text-stone-300/70">{text}</span>
    </button>
  );
}
