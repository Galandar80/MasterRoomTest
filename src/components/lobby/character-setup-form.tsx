"use client";

import { ArrowLeft, ImageUp, UserRoundPlus } from "lucide-react";
import { useState } from "react";

export type CharacterSetupValues = {
  characterName: string;
  characterSurname: string;
  color: string;
  portraitUrl: string;
  portraitFile?: File;
  hp: number;
  mentalState: string;
  visibleStatus: string;
  publicBackground: string;
};

type CharacterSetupFormProps = {
  defaultName: string;
  onBack: () => void;
  onCreate: (values: CharacterSetupValues) => void | Promise<void>;
};

export function CharacterSetupForm({ defaultName, onBack, onCreate }: CharacterSetupFormProps) {
  const [values, setValues] = useState<CharacterSetupValues>({
    characterName: defaultName || "",
    characterSurname: "",
    color: "#f59e0b",
    portraitUrl: "",
    hp: 10,
    mentalState: "Stabile",
    visibleStatus: "stabile",
    publicBackground: ""
  });
  const [isSaving, setIsSaving] = useState(false);

  function update<K extends keyof CharacterSetupValues>(field: K, value: CharacterSetupValues[K]) {
    setValues((current) => ({ ...current, [field]: value }));
  }

  return (
    <section className="mx-auto grid w-full max-w-5xl gap-4 lg:grid-cols-[0.8fr_1.2fr]">
      <aside className="glass-panel rounded-lg p-5">
        <button
          type="button"
          onClick={onBack}
          className="mb-5 inline-flex items-center gap-2 rounded-lg border border-white/10 bg-white/[0.04] px-3 py-2 text-sm text-white hover:bg-white/[0.08]"
        >
          <ArrowLeft size={16} /> Codice stanza
        </button>
        <div className="flex h-12 w-12 items-center justify-center rounded-lg border border-brass/25 bg-brass/10 text-brass">
          <UserRoundPlus size={22} />
        </div>
        <h1 className="mt-4 text-3xl font-semibold text-white">Crea personaggio</h1>
        <p className="mt-3 text-sm leading-6 text-slate-300">
          Prima di entrare nella stanza compila la scheda pubblica. Il portrait consigliato e quadrato, formato Instagram 1080 x
          1080 px.
        </p>
        {values.portraitUrl ? (
          <div className="mt-5 aspect-square rounded-lg border border-brass/20 bg-cover bg-center" style={{ backgroundImage: `url(${values.portraitUrl})` }} />
        ) : null}
      </aside>

      <form
        className="glass-panel grid gap-4 rounded-lg p-5"
        onSubmit={(event) => {
          event.preventDefault();
          setIsSaving(true);
          Promise.resolve(onCreate(values)).finally(() => setIsSaving(false));
        }}
      >
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Nome" value={values.characterName} onChange={(value) => update("characterName", value)} />
          <Field label="Cognome / epiteto" value={values.characterSurname} onChange={(value) => update("characterSurname", value)} />
        </div>

        <div className="grid gap-3 sm:grid-cols-[1fr_8rem]">
          <Field label="URL portrait" value={values.portraitUrl} onChange={(value) => update("portraitUrl", value)} />
          <label className="grid gap-2 text-sm text-slate-200">
            Colore
            <input className="field h-10 px-2 py-1" type="color" value={values.color} onChange={(event) => update("color", event.target.value)} />
          </label>
        </div>

        <label className="block rounded-lg border border-dashed border-brass/30 bg-brass/5 px-3 py-3 text-center text-xs text-brass">
          <ImageUp className="mx-auto mb-2" size={18} />
          Carica portrait quadrato 1080 x 1080 px
          <input
            className="sr-only"
            type="file"
            accept="image/*"
            onChange={(event) => update("portraitFile", event.target.files?.[0])}
          />
        </label>

        <div className="grid gap-3 sm:grid-cols-3">
          <label className="grid gap-2 text-sm text-slate-200">
            Punti ferita
            <input
              className="field px-3 py-2"
              type="number"
              value={values.hp}
              onChange={(event) => update("hp", Number(event.target.value))}
            />
          </label>
          <Field label="Situazione mentale" value={values.mentalState} onChange={(value) => update("mentalState", value)} />
          <Field label="Stato visibile" value={values.visibleStatus} onChange={(value) => update("visibleStatus", value)} />
        </div>

        <Field label="Background pubblico" value={values.publicBackground} onChange={(value) => update("publicBackground", value)} textarea />

        <button className="inline-flex items-center justify-center gap-2 rounded-lg bg-ember-500 px-4 py-3 font-semibold text-ink-900 hover:bg-ember-400">
          <UserRoundPlus size={18} /> {isSaving ? "Creazione..." : "Crea personaggio ed entra"}
        </button>
      </form>
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
