"use client";

import { Download, MessageCircle, MessageSquareLock, Send, Trash2 } from "lucide-react";
import { useMemo, useState } from "react";
import type { Character, Message, Profile } from "@/lib/types";
import { shortTime } from "@/lib/utils";

type OffChatPanelProps = {
  messages: Message[];
  value: string;
  onChange: (value: string) => void;
  onSend: () => void;
  onDeleteMessage?: (message: Message) => void;
};

export function OffChatPanel({ messages, value, onChange, onSend, onDeleteMessage }: OffChatPanelProps) {
  return (
    <section className="off-chat-panel glass-panel flex min-h-[22rem] flex-col rounded-lg">
      <header className="flex items-center justify-between border-b border-white/10 px-4 py-3">
        <div>
          <p className="social-panel-kicker">Fuori narrazione</p>
          <h2 className="flex items-center gap-2 font-serif text-lg text-white">
            <MessageCircle size={18} className="text-sky-200" /> OFF GDR
          </h2>
        </div>
        <span className="social-panel-badge social-panel-badge--off">fuori gioco</span>
      </header>
      <div className="scrollbar-soft flex-1 space-y-3 overflow-y-auto p-4">
        {messages.map((message) => (
          <article key={message.id} className="off-message-card">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <strong className="text-sm" style={{ color: message.sender_color }}>
                {message.sender_display_name}
              </strong>
              <time className="text-xs text-slate-500">{shortTime(message.created_at)}</time>
              {onDeleteMessage ? (
                <button type="button" onClick={() => onDeleteMessage(message)} className="text-rose-200 hover:text-rose-100" title="Elimina messaggio" aria-label="Elimina messaggio">
                  <Trash2 size={14} />
                </button>
              ) : null}
            </div>
            <p className="mt-1 whitespace-pre-wrap text-sm leading-6 text-white">{message.content}</p>
          </article>
        ))}
        {!messages.length ? <SocialEmptyState title="Nessun messaggio OFF" text="Qui potete coordinarvi senza interrompere la scena." /> : null}
      </div>
      <form
        className="border-t border-white/10 p-3"
        onSubmit={(event) => {
          event.preventDefault();
          onSend();
        }}
      >
        <div className="flex gap-2">
          <textarea
            className="field min-h-12 flex-1 resize-none px-3 py-3 text-sm"
            placeholder="Scrivi fuori gioco..."
            value={value}
            onChange={(event) => onChange(event.target.value)}
            onKeyDown={(event) => {
              if (event.key !== "Enter" || event.shiftKey) return;
              event.preventDefault();
              onSend();
            }}
          />
          <button className="social-send-button social-send-button--off" type="submit" aria-label="Invia OFF GDR" title="Invia OFF GDR">
            <Send size={18} />
          </button>
        </div>
      </form>
    </section>
  );
}

type PrivateThreadsPanelProps = {
  profile: Profile;
  characters: Character[];
  messages: Message[];
  masterId: string;
  isMaster: boolean;
  onSend: (content: string, recipientUserId: string) => void;
  onDeleteMessage?: (message: Message) => void;
};

export function PrivateThreadsPanel({ profile, characters, messages, masterId, isMaster, onSend, onDeleteMessage }: PrivateThreadsPanelProps) {
  const visibleCharacters = useMemo(
    () => (isMaster ? characters : characters.filter((character) => character.user_id === profile.id)),
    [characters, isMaster, profile.id]
  );
  const [selectedUserId, setSelectedUserId] = useState(visibleCharacters[0]?.user_id ?? profile.id);
  const [text, setText] = useState("");
  const selectedCharacter = visibleCharacters.find((character) => character.user_id === selectedUserId) ?? visibleCharacters[0];
  const threadUserId = isMaster ? selectedCharacter?.user_id : profile.id;
  const threadMessages = messages.filter((message) =>
    isMaster
      ? message.sender_user_id === threadUserId || message.recipient_user_id === threadUserId
      : message.sender_user_id === profile.id || message.recipient_user_id === profile.id
  );
  const recipientUserId = isMaster ? threadUserId : masterId;

  return (
    <section className="private-thread-panel glass-panel flex min-h-[22rem] flex-col rounded-lg">
      <header className="flex items-center justify-between gap-3 border-b border-white/10 px-4 py-3">
        <div>
          <p className="social-panel-kicker">Canale riservato</p>
          <h2 className="flex items-center gap-2 font-serif text-lg text-white">
            <MessageSquareLock size={18} className="text-brass" /> Sussurri
          </h2>
        </div>
        {isMaster ? (
          <select className="field max-w-56 px-3 py-2 text-sm" value={selectedCharacter?.user_id ?? ""} onChange={(event) => setSelectedUserId(event.target.value)}>
            {visibleCharacters.map((character) => (
              <option key={character.id} value={character.user_id}>
                {character.character_name} {character.character_surname}
              </option>
            ))}
          </select>
        ) : null}
      </header>
      <div className="scrollbar-soft flex-1 space-y-3 overflow-y-auto p-4">
        {threadMessages.map((message) => (
          <article key={message.id} className="private-message-card">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <strong className="text-sm" style={{ color: message.sender_color }}>
                {message.sender_display_name}
              </strong>
              <time className="text-xs text-slate-500">{shortTime(message.created_at)}</time>
              {onDeleteMessage ? (
                <button type="button" onClick={() => onDeleteMessage(message)} className="text-rose-200 hover:text-rose-100" title="Elimina messaggio" aria-label="Elimina messaggio">
                  <Trash2 size={14} />
                </button>
              ) : null}
            </div>
            <p className="mt-1 whitespace-pre-wrap text-sm leading-6 text-white">{message.content}</p>
          </article>
        ))}
        {!threadMessages.length ? <SocialEmptyState title="Nessun sussurro" text={isMaster ? "Seleziona un personaggio e invia un indizio riservato." : "I messaggi privati del Master appariranno qui."} /> : null}
      </div>
      <form
        className="border-t border-white/10 p-3"
        onSubmit={(event) => {
          event.preventDefault();
          if (!text.trim() || !recipientUserId) return;
          onSend(text.trim(), recipientUserId);
          setText("");
        }}
      >
        <div className="flex gap-2">
          <textarea
            className="field min-h-12 flex-1 resize-none px-3 py-3 text-sm"
            placeholder={isMaster ? "Scrivi al giocatore selezionato..." : "Rispondi privatamente al Master..."}
            value={text}
            onChange={(event) => setText(event.target.value)}
            onKeyDown={(event) => {
              if (event.key !== "Enter" || event.shiftKey) return;
              event.preventDefault();
              if (!text.trim() || !recipientUserId) return;
              onSend(text.trim(), recipientUserId);
              setText("");
            }}
          />
          <button className="social-send-button social-send-button--private" type="submit" aria-label="Invia privato" title="Invia privato">
            <Send size={18} />
          </button>
        </div>
      </form>
    </section>
  );
}

function SocialEmptyState({ title, text }: { title: string; text: string }) {
  return (
    <div className="social-empty-state">
      <p>{title}</p>
      <span>{text}</span>
    </div>
  );
}

export function ExportChatButton({ messages, onLoadAll }: { messages: Message[]; onLoadAll?: () => Promise<Message[]> }) {
  const [isExporting, setIsExporting] = useState(false);

  async function exportChat() {
    setIsExporting(true);
    try {
      const exportMessages = onLoadAll ? await onLoadAll() : messages;
      const lines = exportMessages
      .slice()
      .sort((a, b) => a.created_at.localeCompare(b.created_at))
      .map((message) => `[${new Date(message.created_at).toLocaleString()}] ${message.sender_display_name}: ${message.content}`);
      const blob = new Blob([lines.join("\n")], { type: "text/plain;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = "chat-sessione-gdr.txt";
      anchor.click();
      URL.revokeObjectURL(url);
    } finally {
      setIsExporting(false);
    }
  }

  return (
    <button type="button" onClick={exportChat} disabled={isExporting} className="inline-flex items-center gap-2 rounded-lg border border-white/10 bg-white/[0.04] px-3 py-2 text-sm text-white hover:bg-white/[0.08] disabled:opacity-60">
      <Download size={16} /> {isExporting ? "Esporto..." : "Esporta chat"}
    </button>
  );
}
