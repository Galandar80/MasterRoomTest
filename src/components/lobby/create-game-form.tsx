"use client";

import { ArrowLeft, Clapperboard, Copy, ImageIcon, Sparkles } from "lucide-react";
import type React from "react";
import { useState } from "react";
import type { RoomState } from "@/lib/types";

export type CreateGameValues = {
  campaignTitle: string;
  genre: string;
  description: string;
  coverImageUrl: string;
  coverImageFile?: File;
  roomName: string;
  inviteCode: string;
  maxPlayers: number;
  sceneTitle: string;
  sceneDescription: string;
  sceneImageUrl: string;
  sceneImageFile?: File;
};

type CreateGameFormProps = {
  state: RoomState;
  onBack: () => void;
  onCreate: (values: CreateGameValues) => void;
};

export function CreateGameForm({ state, onBack, onCreate }: CreateGameFormProps) {
  const [values, setValues] = useState<CreateGameValues>({
    campaignTitle: state.campaigns[0].title,
    genre: state.campaigns[0].genre,
    description: state.campaigns[0].description,
    coverImageUrl: state.campaigns[0].cover_image_url,
    roomName: state.room.name,
    inviteCode: state.room.invite_code,
    maxPlayers: state.room.max_players ?? 4,
    sceneTitle: state.scene.title,
    sceneDescription: state.scene.description,
    sceneImageUrl: state.scene.image_url
  });

  function update(field: keyof CreateGameValues, value: string | number | File | undefined) {
    setValues((current) => ({ ...current, [field]: value }));
  }

  return (
    <section className="mx-auto grid w-full max-w-6xl gap-4 lg:grid-cols-[0.9fr_1.1fr]">
      <aside className="glass-panel rounded-lg p-5">
        <button
          type="button"
          onClick={onBack}
          className="mb-5 inline-flex items-center gap-2 rounded-lg border border-white/10 bg-white/[0.04] px-3 py-2 text-sm text-white hover:bg-white/[0.08]"
        >
          <ArrowLeft size={16} /> Menu
        </button>
        <div className="flex h-12 w-12 items-center justify-center rounded-lg border border-brass/25 bg-brass/10 text-brass">
          <Clapperboard size={22} />
        </div>
        <h1 className="mt-4 text-3xl font-semibold text-white">Crea partita</h1>
        <p className="mt-3 text-sm leading-6 text-slate-300">
          Questo flusso prepara campagna, stanza e scena iniziale. Alla conferma entrerai direttamente nella cabina di regia.
        </p>
        <div className="mt-6 rounded-lg border border-ember-400/20 bg-ember-500/10 p-4">
          <div className="flex items-center gap-2 text-sm font-semibold text-ember-100">
            <Copy size={16} /> Codice stanza
          </div>
          <p className="mt-2 font-mono text-2xl font-semibold text-white">{values.inviteCode || "AUTO"}</p>
          <p className="mt-2 text-xs leading-5 text-ember-100/80">I giocatori useranno questo codice per entrare nella sessione.</p>
        </div>
      </aside>

      <form
        className="glass-panel grid gap-5 rounded-lg p-5"
        onSubmit={(event) => {
          event.preventDefault();
          onCreate(values);
        }}
      >
        <FormSection icon={<Sparkles size={17} />} title="Campagna">
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Titolo campagna" value={values.campaignTitle} onChange={(value) => update("campaignTitle", value)} />
            <Field label="Genere" value={values.genre} onChange={(value) => update("genre", value)} />
          </div>
          <Field label="Descrizione" value={values.description} onChange={(value) => update("description", value)} textarea />
          <Field label="URL copertina" value={values.coverImageUrl} onChange={(value) => update("coverImageUrl", value)} />
          <FileField
            label="Carica copertina dal PC"
            hint="Consigliato 16:9 o verticale soft, JPG/PNG/WebP."
            accept="image/*"
            file={values.coverImageFile}
            onChange={(file) => update("coverImageFile", file)}
          />
        </FormSection>

        <FormSection icon={<Copy size={17} />} title="Stanza">
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Nome stanza" value={values.roomName} onChange={(value) => update("roomName", value)} />
            <Field label="Codice invito" value={values.inviteCode} onChange={(value) => update("inviteCode", value.toUpperCase())} />
          </div>
          <label className="grid gap-2 text-sm text-slate-200">
            Numero giocatori disponibili
            <input
              className="field px-3 py-2"
              type="number"
              min={1}
              max={12}
              value={values.maxPlayers}
              onChange={(event) => update("maxPlayers", Math.max(1, Math.min(12, Number(event.target.value))))}
            />
          </label>
        </FormSection>

        <FormSection icon={<ImageIcon size={17} />} title="Scena iniziale">
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Titolo scena" value={values.sceneTitle} onChange={(value) => update("sceneTitle", value)} />
            <Field label="URL immagine scena" value={values.sceneImageUrl} onChange={(value) => update("sceneImageUrl", value)} />
          </div>
          <FileField
            label="Carica immagine scena dal PC"
            hint="Formato standard 16:9, ideale 1920x1080."
            accept="image/*"
            file={values.sceneImageFile}
            onChange={(file) => update("sceneImageFile", file)}
          />
          <Field label="Descrizione scena" value={values.sceneDescription} onChange={(value) => update("sceneDescription", value)} textarea />
        </FormSection>

        <button className="inline-flex items-center justify-center gap-2 rounded-lg bg-ember-500 px-4 py-3 font-semibold text-ink-900 hover:bg-ember-400">
          <Clapperboard size={18} /> Crea e apri cabina di regia
        </button>
      </form>
    </section>
  );
}

function FileField({
  label,
  hint,
  accept,
  file,
  onChange
}: {
  label: string;
  hint: string;
  accept: string;
  file?: File;
  onChange: (file?: File) => void;
}) {
  return (
    <label className="grid gap-2 text-sm text-slate-200">
      {label}
      <span className="rounded-lg border border-dashed border-brass/30 bg-brass/5 px-3 py-3 text-center text-xs text-brass">
        {file ? file.name : hint}
        <input className="sr-only" type="file" accept={accept} onChange={(event) => onChange(event.target.files?.[0])} />
      </span>
    </label>
  );
}

function FormSection({ icon, title, children }: { icon: React.ReactNode; title: string; children: React.ReactNode }) {
  return (
    <section className="grid gap-3">
      <h2 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.18em] text-brass">
        {icon} {title}
      </h2>
      {children}
    </section>
  );
}

function Field({
  label,
  value,
  onChange,
  textarea = false
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  textarea?: boolean;
}) {
  return (
    <label className="grid gap-2 text-sm text-slate-200">
      {label}
      {textarea ? (
        <textarea className="field min-h-24 resize-none px-3 py-2" value={value} onChange={(event) => onChange(event.target.value)} />
      ) : (
        <input className="field px-3 py-2" value={value} onChange={(event) => onChange(event.target.value)} />
      )}
    </label>
  );
}
