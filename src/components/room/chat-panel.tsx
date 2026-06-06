"use client";

import { Check, Crown, Dice5, MessageCircle, Pencil, Pin, Search, Send, Shield, Trash2, UserRound, VenetianMask, X } from "lucide-react";
import { useMemo, useState } from "react";
import type { Character, ChatFilter, Message, Npc, RoomTyping } from "@/lib/types";
import { cn, shortTime } from "@/lib/utils";

const TECHNICAL_MESSAGE_PREFIXES = ["__gdr_map_sync__:"];

type ChatPanelProps = {
  messages: Message[];
  value: string;
  onChange: (value: string) => void;
  onSend: () => void;
  disabled?: boolean;
  disabledReason?: string;
  onDeleteMessage?: (message: Message) => void;
  onEditMessage?: (message: Message, content: string) => void;
  onTogglePin?: (message: Message) => void;
  onTyping?: () => void;
  onLoadOlder?: () => void;
  hasOlderMessages?: boolean;
  currentUserId?: string;
  isMaster?: boolean;
  typing?: RoomTyping[];
  characters?: Character[];
  npcs?: Npc[];
  showAvatars?: boolean;
};

export function ChatPanel({
  messages,
  value,
  onChange,
  onSend,
  disabled = false,
  disabledReason,
  onDeleteMessage,
  onEditMessage,
  onTogglePin,
  onTyping,
  onLoadOlder,
  hasOlderMessages = false,
  currentUserId,
  isMaster = false,
  typing = [],
  characters = [],
  npcs = [],
  showAvatars = false
}: ChatPanelProps) {
  const [filter, setFilter] = useState<ChatFilter>("all");
  const [search, setSearch] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingText, setEditingText] = useState("");
  const visibleMessages = useMemo(() => messages.filter((message) => !isTechnicalMessage(message)), [messages]);
  const latestOwnMessageId = [...visibleMessages].reverse().find((message) => message.sender_user_id === currentUserId)?.id;
  const filteredMessages = useMemo(() => filterMessages(visibleMessages, filter, search), [visibleMessages, filter, search]);
  const activeTyping = typing.filter((item) => item.user_id !== currentUserId && item.channel === "gdr" && Date.now() - new Date(item.updated_at).getTime() < 6000);

  return (
    <section className="story-chat-panel glass-panel flex min-h-[34rem] flex-col rounded-lg">
      <header className="story-chat-header flex items-center justify-between border-b border-white/10 px-4 py-3">
        <div className="flex items-center gap-2">
          <MessageCircle size={18} className="text-brass" />
          <div>
            <h2 className="font-serif text-base text-white">Chat comune</h2>
            <p className="text-xs text-stone-500">Registro narrativo della sessione</p>
          </div>
        </div>
        <span className="story-status-badge rounded-md border border-emerald-400/20 bg-emerald-500/10 px-2 py-1 text-xs text-emerald-200">
          {disabled ? "chat bloccata" : "realtime ready"}
        </span>
      </header>

      <div className="grid gap-2 border-b border-white/10 px-4 py-3">
        <div className="flex flex-wrap gap-2">
          {[
            ["all", "Tutti"],
            ["master", "Master"],
            ["npc", "NPC"],
            ["player", "Giocatori"],
            ["dice", "Dadi"],
            ["pinned", "Pin"]
          ].map(([id, label]) => (
            <button
              key={id}
              type="button"
              onClick={() => setFilter(id as ChatFilter)}
              className={cn("story-filter-pill", filter === id ? "is-active" : "")}
            >
              {label}
            </button>
          ))}
        </div>
        <label className="flex items-center gap-2 rounded-lg border border-white/10 bg-black/20 px-3 py-2 text-sm text-slate-300">
          <Search size={15} />
          <input className="min-w-0 flex-1 bg-transparent outline-none" placeholder="Cerca nella chat..." value={search} onChange={(event) => setSearch(event.target.value)} />
        </label>
      </div>

      <div className="scrollbar-soft flex-1 space-y-3 overflow-y-auto p-4">
        {hasOlderMessages && onLoadOlder ? (
          <button
            type="button"
            onClick={onLoadOlder}
            className="mx-auto flex rounded-md border border-brass/25 bg-brass/10 px-3 py-2 text-xs font-medium text-brass hover:bg-brass/15"
          >
            Carica messaggi precedenti
          </button>
        ) : null}
        {filteredMessages.map((message) => {
          const avatar = resolveChatAvatar(message, characters, npcs);
          const meta = messageMeta(message);
          const narrative = parseNarrativeContent(message.content);

          return (
            <article
              key={message.id}
              className={cn(
                "story-message",
                `story-message--${message.sender_type}`,
                meta.isDice ? "story-message--dice" : "",
                narrative.kind ? `story-message--narrative-${narrative.kind}` : "",
                message.is_private ? "story-message--private" : "",
                message.is_pinned ? "story-message--pinned" : "",
                showAvatars ? "grid grid-cols-[2.75rem_minmax(0,1fr)] gap-3" : ""
              )}
            >
              {showAvatars ? (
                <div
                  className="chat-message-avatar"
                  style={avatar.url ? { backgroundImage: `url(${avatar.url})`, color: message.sender_color } : { color: message.sender_color }}
                  aria-hidden="true"
                >
                  {avatar.url ? "" : avatar.fallback}
                </div>
              ) : null}
              <div className="min-w-0">
                <div className="story-message-top flex flex-wrap items-baseline justify-between gap-2">
                  <div className="flex min-w-0 items-center gap-2">
                    <span className="story-message-type">{meta.icon}{meta.label}</span>
                    <strong className="truncate text-sm" style={{ color: message.sender_color }}>
                      {message.sender_display_name}
                    </strong>
                  </div>
              <div className="ml-auto flex items-center gap-2">
                {message.is_pinned ? <Pin size={13} className="text-ember-200" /> : null}
                <time className="text-xs text-slate-500">{shortTime(message.created_at)}</time>
                {onTogglePin && isMaster ? (
                  <button type="button" onClick={() => onTogglePin(message)} className="text-ember-200 hover:text-ember-100" title="Fissa messaggio" aria-label="Fissa messaggio">
                    <Pin size={14} />
                  </button>
                ) : null}
                {onEditMessage && message.id === latestOwnMessageId ? (
                  <button
                    type="button"
                    onClick={() => {
                      setEditingId(message.id);
                      setEditingText(message.content);
                    }}
                    className="text-sky-200 hover:text-sky-100"
                    title="Modifica ultimo messaggio"
                    aria-label="Modifica ultimo messaggio"
                  >
                    <Pencil size={14} />
                  </button>
                ) : null}
                {onDeleteMessage && (isMaster || message.id === latestOwnMessageId) ? (
                  <button type="button" onClick={() => onDeleteMessage(message)} className="text-rose-200 hover:text-rose-100" title="Elimina messaggio" aria-label="Elimina messaggio">
                    <Trash2 size={14} />
                  </button>
                ) : null}
              </div>
            </div>
            {editingId === message.id ? (
              <form
                className="mt-2 flex gap-2"
                onSubmit={(event) => {
                  event.preventDefault();
                  onEditMessage?.(message, editingText);
                  setEditingId(null);
                }}
              >
                <input className="field flex-1 px-3 py-2 text-sm" value={editingText} onChange={(event) => setEditingText(event.target.value)} />
                <button className="rounded-md bg-emerald-500 px-2 text-ink-900" title="Salva modifica" aria-label="Salva modifica">
                  <Check size={15} />
                </button>
                <button type="button" onClick={() => setEditingId(null)} className="rounded-md border border-white/10 px-2 text-slate-200" title="Annulla modifica" aria-label="Annulla modifica">
                  <X size={15} />
                </button>
              </form>
            ) : (
              <p className="story-message-content mt-1 whitespace-pre-wrap text-sm leading-6 text-white">
                {!meta.isDice && narrative.label ? <span className="story-narrative-label">{narrative.label}</span> : null}
                {meta.isDice ? message.content : narrative.wrap ? <>“{narrative.content}”</> : narrative.content} {message.edited_at ? <span className="text-xs text-slate-500">(modificato)</span> : null}
              </p>
            )}
              </div>
            </article>
          );
        })}
        {!filteredMessages.length ? (
          <div className="story-empty-state">
            <MessageCircle size={24} />
            <p>Nessun messaggio da mostrare.</p>
            <span>La scena e ancora silenziosa: il primo intervento aprira il registro narrativo.</span>
          </div>
        ) : null}
      </div>
      {activeTyping.length ? (
        <p className="border-t border-white/10 px-4 py-2 text-xs text-slate-400">
          {activeTyping.map((item) => item.display_name).join(", ")} sta scrivendo...
        </p>
      ) : null}

      <form
        className="border-t border-white/10 p-3"
        onSubmit={(event) => {
          event.preventDefault();
          onSend();
        }}
      >
        <div className="mb-2 flex flex-wrap gap-2">
          {narrativeModes.map((mode) => (
            <button
              key={mode.id}
              type="button"
              className="story-compose-mode"
              onClick={() => onChange(applyNarrativePrefix(value, mode.prefix))}
              disabled={disabled}
            >
              {mode.label}
            </button>
          ))}
        </div>
        <div className="flex gap-2">
          <textarea
            className="field min-h-12 flex-1 resize-none px-3 py-3 text-sm"
            placeholder={disabled ? (disabledReason ?? "Chat disattivata dal Master") : "Scrivi in scena... Shift+Invio va a capo"}
            value={value}
            onChange={(event) => {
              onChange(event.target.value);
              if (event.target.value.trim()) onTyping?.();
            }}
            onKeyDown={(event) => {
              if (event.key !== "Enter" || event.shiftKey) return;
              event.preventDefault();
              onSend();
            }}
            disabled={disabled}
          />
          <button
            className="inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-ember-500 text-ink-900 transition hover:bg-ember-400 disabled:cursor-not-allowed disabled:opacity-45"
            type="submit"
            aria-label="Invia messaggio"
            title="Invia messaggio"
            disabled={disabled}
          >
            <Send size={18} />
          </button>
        </div>
      </form>
    </section>
  );
}

function messageMeta(message: Message) {
  const lowered = message.content.toLowerCase();
  const isDice = lowered.includes("tira d") || lowered.includes("risultato:");
  if (isDice) return { label: "Tiro", icon: <Dice5 size={13} />, isDice };
  if (message.is_private) return { label: "Sussurro", icon: <Shield size={13} />, isDice };
  if (message.sender_type === "master") return { label: "Narratore", icon: <Crown size={13} />, isDice };
  if (message.sender_type === "npc") return { label: "NPC", icon: <VenetianMask size={13} />, isDice };
  if (message.sender_type === "system") return { label: "Sistema", icon: <Shield size={13} />, isDice };
  return { label: "Giocatore", icon: <UserRound size={13} />, isDice };
}

const narrativeModes = [
  { id: "dialogue", label: "Dialogo", prefix: "" },
  { id: "action", label: "Azione", prefix: "[azione] " },
  { id: "thought", label: "Pensiero", prefix: "[pensiero] " },
  { id: "event", label: "Evento", prefix: "[evento] " }
];

function applyNarrativePrefix(value: string, prefix: string) {
  const stripped = value.replace(/^\[(azione|pensiero|evento|capitolo|sussurro)\]\s*/i, "");
  return `${prefix}${stripped}`.trimStart();
}

function parseNarrativeContent(content: string) {
  const match = content.match(/^\[(azione|pensiero|evento|capitolo|sussurro)\]\s*(.*)$/i);
  if (!match) {
    return { kind: "", label: "", content, wrap: true };
  }

  const kind = match[1].toLowerCase();
  return {
    kind,
    label: narrativeLabel(kind),
    content: match[2],
    wrap: kind === "sussurro"
  };
}

function narrativeLabel(kind: string) {
  if (kind === "azione") return "Azione";
  if (kind === "pensiero") return "Pensiero";
  if (kind === "evento") return "Evento";
  if (kind === "capitolo") return "Capitolo";
  if (kind === "sussurro") return "Sussurro";
  return "";
}

function resolveChatAvatar(message: Message, characters: Character[], npcs: Npc[]) {
  if (message.sender_type === "npc" && message.npc_id) {
    const npc = npcs.find((item) => item.id === message.npc_id);
    return { url: npc?.portrait_url ?? "", fallback: npc?.name.slice(0, 1).toUpperCase() ?? "N" };
  }

  if (message.sender_type === "player" && message.sender_user_id) {
    const character = characters.find((item) => item.user_id === message.sender_user_id);
    return {
      url: character?.portrait_url ?? "",
      fallback: (character?.character_name ?? message.sender_display_name).slice(0, 1).toUpperCase()
    };
  }

  return { url: "", fallback: "M" };
}

function isTechnicalMessage(message: Message) {
  return TECHNICAL_MESSAGE_PREFIXES.some((prefix) => message.content.startsWith(prefix));
}

function filterMessages(messages: Message[], filter: ChatFilter, search: string) {
  const normalized = search.trim().toLowerCase();

  return messages.filter((message) => {
    if (filter === "master" && message.sender_type !== "master") return false;
    if (filter === "npc" && message.sender_type !== "npc") return false;
    if (filter === "player" && message.sender_type !== "player") return false;
    if (filter === "dice" && !message.content.toLowerCase().includes("tira d")) return false;
    if (filter === "pinned" && !message.is_pinned) return false;
    if (normalized && !`${message.sender_display_name} ${message.content}`.toLowerCase().includes(normalized)) return false;
    return true;
  });
}
