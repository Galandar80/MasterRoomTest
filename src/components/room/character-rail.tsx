import { Brain, Circle, HeartPulse, ShieldAlert } from "lucide-react";
import type React from "react";
import type { Character, InventoryItem, RoomPresence } from "@/lib/types";

type CharacterRailProps = {
  characters: Character[];
  inventory?: InventoryItem[];
  presence?: RoomPresence[];
  side: "left" | "right";
};

export function CharacterRail({ characters, inventory = [], presence = [], side }: CharacterRailProps) {
  return (
    <aside className="player-character-rail hidden xl:block">
      <div className="sticky top-4 flex flex-col gap-3">
        {characters.map((character) => (
          <article key={character.id} className="player-character-card overflow-hidden rounded-xl">
            <header className="flex items-center justify-between gap-3 px-3 py-3">
              <h3 className="truncate text-lg font-semibold" style={{ color: character.color }}>
                {character.character_name}
              </h3>
              <PresenceDot online={isOnline(presence, character.user_id)} />
            </header>
            <div className="mx-3 aspect-[4/5] rounded-lg border border-white/10 bg-cover bg-center" style={{ backgroundImage: `url(${character.portrait_url})` }} />
            <div className="space-y-3 p-3">
              <div>
                <h4 className="font-serif text-xl uppercase tracking-wide" style={{ color: character.color }}>
                  {character.character_name} {character.character_surname}
                </h4>
                <p className="mt-1 line-clamp-3 text-xs leading-5 text-slate-300">{character.public_background}</p>
              </div>
              <div className="grid gap-2 text-xs text-slate-200">
                <StatRow icon={<HeartPulse size={14} />} label="PF" value={`${character.hp} / 10`} tone="rose" progress={Math.min(100, Math.max(0, character.hp * 10))} />
                <StatRow icon={<Brain size={14} />} label="Mente" value={character.mental_state} tone="sky" progress={character.mental_state.toLowerCase().includes("stabile") ? 86 : 55} />
                <span className="inline-flex items-center gap-2 rounded-md border border-white/10 bg-white/[0.04] px-2 py-1.5">
                  <ShieldAlert size={14} className="text-amber-300" /> {character.visible_status}
                </span>
              </div>
              <p className="font-serif text-xs uppercase tracking-[0.18em] text-brass">Condizioni</p>
              <ConditionBadges conditions={character.conditions?.length ? character.conditions : [character.visible_status]} />
              <div className="player-public-inventory grid gap-1 text-xs text-slate-300">
                <p>Oggetti visibili</p>
                {inventory.filter((item) => item.character_id === character.id && item.is_public).map((item) => (
                  <span key={item.id} className="rounded-md bg-emerald-500/10 px-2 py-1 text-emerald-100">
                    {item.name} x{item.quantity}
                  </span>
                ))}
                {!inventory.some((item) => item.character_id === character.id && item.is_public) ? <span className="text-slate-500">Nessun oggetto pubblico.</span> : null}
              </div>
            </div>
          </article>
        ))}
        {characters.length === 0 ? (
          <div className="player-rail-empty glass-panel rounded-lg p-4 text-sm text-slate-400">
            <p>Nessun personaggio</p>
            <span>Il lato {side === "left" ? "sinistro" : "destro"} della stanza e ancora libero.</span>
          </div>
        ) : null}
      </div>
    </aside>
  );
}

function StatRow({ icon, label, value, tone, progress }: { icon: React.ReactNode; label: string; value: string; tone: "rose" | "sky"; progress: number }) {
  return (
    <div className="grid gap-1 rounded-md border border-white/10 bg-white/[0.04] px-2 py-1.5">
      <div className="flex items-center justify-between gap-2">
        <span className={`inline-flex items-center gap-2 uppercase ${tone === "rose" ? "text-rose-200" : "text-sky-200"}`}>
          {icon} {label}
        </span>
        <strong className="text-slate-100">{value}</strong>
      </div>
      <span className="h-1.5 overflow-hidden rounded-full bg-white/10">
        <span className={`block h-full ${tone === "rose" ? "bg-rose-400" : "bg-sky-400"}`} style={{ width: `${progress}%` }} />
      </span>
    </div>
  );
}

function isOnline(presence: RoomPresence[], userId: string) {
  const item = presence.find((entry) => entry.user_id === userId);
  if (!item) return false;
  return Date.now() - new Date(item.last_seen_at).getTime() < 45000;
}

function PresenceDot({ online }: { online: boolean }) {
  return (
    <span className={`inline-flex items-center gap-1 rounded-md border px-2 py-1 text-[0.65rem] ${online ? "border-emerald-400/25 bg-emerald-500/10 text-emerald-200" : "border-slate-500/20 bg-slate-500/10 text-slate-400"}`}>
      <Circle size={8} fill="currentColor" /> {online ? "online" : "offline"}
    </span>
  );
}

function ConditionBadges({ conditions }: { conditions: string[] }) {
  return (
    <div className="flex flex-wrap gap-1">
      {conditions.filter(Boolean).map((condition) => (
        <span key={condition} className="rounded-md border border-white/10 bg-white/[0.04] px-2 py-1 text-xs text-slate-200">
          {conditionIcon(condition)} {condition}
        </span>
      ))}
    </div>
  );
}

function conditionIcon(condition: string) {
  const normalized = condition.toLowerCase();
  if (normalized.includes("ferit")) return "✚";
  if (normalized.includes("paur") || normalized.includes("spavent")) return "!";
  if (normalized.includes("shock")) return "◇";
  if (normalized.includes("velen")) return "☠";
  if (normalized.includes("confus")) return "?";
  if (normalized.includes("esaust")) return "…";
  if (normalized.includes("pericolo")) return "△";
  return "•";
}
