"use client";

import { useMemo, useState } from "react";
import type React from "react";
import { ArrowLeft, Backpack, BookOpenText, CircleHelp, Copy, MessageCircle, Plus, ScrollText, UsersRound, X } from "lucide-react";
import type { AudioTrack, Message, RoomState } from "@/lib/types";
import { splitSides } from "@/lib/utils";
import { AudioPlayer } from "@/components/room/audio-player";
import { ChatPanel } from "@/components/room/chat-panel";
import { CharacterRail } from "@/components/room/character-rail";
import { PlayerDrawer } from "@/components/room/player-drawer";
import { SceneStage } from "@/components/room/scene-stage";
import { SoundEffectPlayer } from "@/components/room/sound-effect-player";
import { ExportChatButton, OffChatPanel, PrivateThreadsPanel } from "@/components/room/social-panels";
import { PlayerDicePanel, SpotlightPanel } from "@/components/room/dice-and-spotlight";
import type { DiceRequest } from "@/lib/types";

type PlayerRoomProps = {
  state: RoomState;
  currentAudio: AudioTrack;
  onBack: () => void;
  onSend: (content: string) => void;
  onPrivateSend: (content: string, recipientUserId: string) => void;
  onOffSend: (content: string) => void;
  onTyping: (channel: "gdr" | "off" | "private", recipientUserId?: string | null) => void;
  onEditMessage: (message: Message, content: string) => void;
  onDeleteMessage: (message: Message) => void;
  onRollDice: (request: DiceRequest) => void;
  onCreateNote: (values: { title: string; content: string }) => void;
  onLoadOlderMessages: () => void;
  onExportMessages: () => Promise<Message[]>;
};

type MobileTab = "chat" | "sheet" | "off" | "private";
type UtilityPanel = "notes" | "inventory" | "private" | "help" | null;

export function PlayerRoom({ state, currentAudio, onBack, onSend, onPrivateSend, onOffSend, onTyping, onEditMessage, onDeleteMessage, onRollDice, onCreateNote, onLoadOlderMessages, onExportMessages }: PlayerRoomProps) {
  const [playerText, setPlayerText] = useState("");
  const [offText, setOffText] = useState("");
  const [mobileTab, setMobileTab] = useState<MobileTab>("chat");
  const [utilityPanel, setUtilityPanel] = useState<UtilityPanel>(null);
  const [leftCharacters, rightCharacters] = useMemo(() => splitSides(state.characters), [state.characters]);
  const currentCharacter = state.characters.find((character) => character.user_id === state.profile.id) ?? state.characters[0];
  const visibleDiceRequests = state.diceRequests.filter((request) => !request.target_user_id || request.target_user_id === state.profile.id);
  const spotlightVisible = state.room.spotlight_visibility !== "off" && Boolean(state.room.spotlight_npc_id);
  const soundEffectVisible = Boolean(state.room.current_sound_effect_id);
  const chatDisabledForPlayer = state.room.chat_enabled === false || Boolean(state.room.muted_user_ids?.includes(state.profile.id));
  const disabledReason =
    state.room.chat_enabled === false ? "Chat comune disattivata dal Master" : "Il Master ha disattivato la tua chat";

  return (
    <section className="player-room-shell relative -m-4 min-h-screen overflow-hidden px-3 py-3 sm:-m-6 sm:px-4 sm:py-4">
      <div className="pointer-events-none absolute inset-0 bg-[url('/assets/master/director-room-bg.png')] bg-cover bg-center opacity-45" />
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(90deg,rgba(2,3,7,0.92),rgba(3,5,9,0.68)_50%,rgba(2,3,7,0.92)),linear-gradient(180deg,rgba(0,0,0,0.16),rgba(0,0,0,0.82))]" />
      <div className="relative z-10 grid gap-3">
        <PlayerHeader
          state={state}
          onBack={onBack}
          privateCount={state.privateMessages.length}
          currentCharacter={currentCharacter}
          onOpenUtility={setUtilityPanel}
        />
        <MobileCharacterStrip characters={state.characters} currentUserId={state.profile.id} />
        <div className="grid gap-3 xl:grid-cols-[17rem_minmax(0,1fr)_17rem]">
      <CharacterRail side="left" characters={leftCharacters} inventory={state.inventory} presence={state.presence} />

      <div className="grid min-w-0 gap-3">
        {spotlightVisible ? <SpotlightPanel room={state.room} npcs={state.npcs} currentUserId={state.profile.id} /> : null}
        {soundEffectVisible ? <SoundEffectPlayer room={state.room} soundEffects={state.soundEffects} /> : null}
        <SceneStage scene={state.scene} compact />
        {visibleDiceRequests.length > 0 ? <PlayerDicePanel requests={visibleDiceRequests} onRoll={onRollDice} /> : null}
        <MobilePlayerTabs active={mobileTab} onChange={setMobileTab} />
        <div className={mobileTab === "chat" ? "block" : "hidden lg:block"}>
          <ChatPanel
            messages={state.messages}
            value={playerText}
            onChange={setPlayerText}
            onSend={() => {
              if (chatDisabledForPlayer) return;
              if (!playerText.trim()) return;
              onSend(playerText.trim());
              setPlayerText("");
            }}
            disabled={chatDisabledForPlayer}
            disabledReason={disabledReason}
            onTyping={() => onTyping("gdr")}
            onEditMessage={onEditMessage}
            onDeleteMessage={onDeleteMessage}
            onLoadOlder={onLoadOlderMessages}
            hasOlderMessages={state.hasOlderMessages}
            currentUserId={state.profile.id}
            characters={state.characters}
            npcs={state.npcs}
            showAvatars
            typing={state.typing}
          />
        </div>
        <div className={mobileTab === "sheet" ? "block" : "hidden lg:block"}>
          <ExportChatButton messages={[...state.messages, ...state.offMessages, ...state.privateMessages]} onLoadAll={onExportMessages} />
          <div className="mt-4">
            <PlayerDrawer
              character={currentCharacter}
              inventory={state.inventory}
              notes={state.notes}
              privateMessages={state.privateMessages}
              onCreateNote={onCreateNote}
            />
          </div>
        </div>
        <div className={mobileTab === "private" ? "block" : "hidden lg:block"}>
          <details className="glass-panel rounded-lg p-4" open>
            <summary className="cursor-pointer text-sm font-semibold text-white">Privati con il Master</summary>
            <div className="mt-4">
              <PrivateThreadsPanel
                profile={state.profile}
                characters={state.characters}
                messages={state.privateMessages}
                masterId={state.campaigns[0].master_id}
                isMaster={false}
                onSend={onPrivateSend}
                onDeleteMessage={onDeleteMessage}
              />
            </div>
          </details>
        </div>
        <div className={mobileTab === "off" ? "block" : "hidden lg:block"}>
          <OffChatPanel
            messages={state.offMessages}
            value={offText}
            onChange={(value) => {
              setOffText(value);
              if (value.trim()) onTyping("off");
            }}
            onSend={() => {
              if (!offText.trim()) return;
              onOffSend(offText.trim());
              setOffText("");
            }}
            onDeleteMessage={onDeleteMessage}
          />
        </div>
        <AudioPlayer track={currentAudio} />
      </div>

      <CharacterRail side="right" characters={rightCharacters} inventory={state.inventory} presence={state.presence} />
        </div>
      </div>
      {currentCharacter ? (
        <PlayerUtilityModal
          panel={utilityPanel}
          state={state}
          character={currentCharacter}
          onClose={() => setUtilityPanel(null)}
          onCreateNote={onCreateNote}
          onPrivateSend={onPrivateSend}
          onDeleteMessage={onDeleteMessage}
        />
      ) : null}
    </section>
  );
}

function PlayerHeader({
  state,
  onBack,
  privateCount,
  currentCharacter,
  onOpenUtility
}: {
  state: RoomState;
  onBack: () => void;
  privateCount: number;
  currentCharacter?: RoomState["characters"][number];
  onOpenUtility: (panel: Exclude<UtilityPanel, null>) => void;
}) {
  return (
    <header className="player-room-header rounded-xl p-4">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
        <div className="flex min-w-0 items-center gap-4">
          <button type="button" onClick={onBack} className="player-logo-mark" title="Torna al menu" aria-label="Torna al menu">
            <span />
          </button>
          <button type="button" onClick={onBack} className="player-menu-button">
            <ArrowLeft size={16} /> Menu
          </button>
          <div className="min-w-0">
            <p className="player-session-kicker">Stanza narrativa</p>
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="truncate font-serif text-2xl text-stone-100 sm:text-3xl">{state.campaigns[0].title}</h1>
              <span className="rounded-md border border-emerald-400/25 bg-emerald-500/10 px-2 py-1 text-xs font-bold uppercase tracking-[0.14em] text-emerald-200">In corso</span>
            </div>
            <p className="mt-1 text-sm text-stone-300">{state.room.name} · {state.scene.title}</p>
            <p className="mt-1 line-clamp-1 text-sm text-stone-400">{state.campaigns[0].description}</p>
          </div>
        </div>
        <div className="grid gap-2 xl:min-w-[36rem]">
          {currentCharacter ? (
            <div className="player-current-strip">
              <span className="h-12 w-12 shrink-0 rounded-lg bg-cover bg-center" style={{ backgroundImage: `url(${currentCharacter.portrait_url})` }} />
              <span className="min-w-0">
                <small>Stai interpretando</small>
                <strong style={{ color: currentCharacter.color }}>{currentCharacter.character_name} {currentCharacter.character_surname}</strong>
              </span>
              <span className="player-current-stat">PF {currentCharacter.hp}</span>
            </div>
          ) : null}
          <div className="grid gap-2 sm:grid-cols-4">
            <HeaderAction icon={<ScrollText size={16} />} label="Note" onClick={() => onOpenUtility("notes")} />
            <HeaderAction icon={<Backpack size={16} />} label="Inventario" onClick={() => onOpenUtility("inventory")} />
            <HeaderAction icon={<BookOpenText size={16} />} label="Sussurri" badge={privateCount} onClick={() => onOpenUtility("private")} />
            <HeaderAction icon={<CircleHelp size={16} />} label="" onClick={() => onOpenUtility("help")} />
            <InfoTile label="Stanza" value={state.scene.title} />
            <InfoTile label="Codice invito" value={state.room.invite_code} copy />
          </div>
        </div>
      </div>
    </header>
  );
}

function HeaderAction({ icon, label, badge, onClick }: { icon: React.ReactNode; label: string; badge?: number; onClick: () => void }) {
  return (
    <button type="button" className="player-header-action" onClick={onClick}>
      {icon}
      {label ? <span>{label}</span> : null}
      {badge ? <strong>{badge}</strong> : null}
    </button>
  );
}

function MobileCharacterStrip({ characters, currentUserId }: { characters: RoomState["characters"]; currentUserId: string }) {
  return (
    <section className="mobile-character-strip xl:hidden">
      {characters.map((character) => (
        <article key={character.id} className={character.user_id === currentUserId ? "is-current" : ""}>
          <span className="h-10 w-10 shrink-0 rounded-lg bg-cover bg-center" style={{ backgroundImage: `url(${character.portrait_url})` }} />
          <span className="min-w-0">
            <strong style={{ color: character.color }}>{character.character_name}</strong>
            <small>PF {character.hp} · {character.visible_status}</small>
          </span>
        </article>
      ))}
    </section>
  );
}

function PlayerUtilityModal({
  panel,
  state,
  character,
  onClose,
  onCreateNote,
  onPrivateSend,
  onDeleteMessage
}: {
  panel: UtilityPanel;
  state: RoomState;
  character: NonNullable<RoomState["characters"][number]>;
  onClose: () => void;
  onCreateNote: (values: { title: string; content: string }) => void;
  onPrivateSend: (content: string, recipientUserId: string) => void;
  onDeleteMessage: (message: Message) => void;
}) {
  const [noteTitle, setNoteTitle] = useState("");
  const [noteContent, setNoteContent] = useState("");
  if (!panel) return null;

  const characterItems = state.inventory.filter((item) => item.character_id === character.id);
  const characterNotes = state.notes.filter((note) => note.character_id === character.id);
  const titles = {
    notes: "Note personali",
    inventory: "Inventario",
    private: "Sussurri",
    help: "Guida rapida"
  };

  return (
    <div className="player-utility-backdrop" role="dialog" aria-modal="true">
      <section className="player-utility-modal">
        <header>
          <div>
            <p className="player-modal-kicker">Strumento giocatore</p>
            <h2>{titles[panel]}</h2>
          </div>
          <button type="button" onClick={onClose} aria-label="Chiudi">
            <X size={18} />
          </button>
        </header>

        {panel === "notes" ? (
          <div className="grid gap-4">
            <form
              className="player-modal-compose grid gap-2"
              onSubmit={(event) => {
                event.preventDefault();
                if (!noteTitle.trim() && !noteContent.trim()) return;
                onCreateNote({ title: noteTitle.trim() || "Nota", content: noteContent.trim() });
                setNoteTitle("");
                setNoteContent("");
              }}
            >
              <input className="field px-3 py-2 text-sm" placeholder="Titolo nota" value={noteTitle} onChange={(event) => setNoteTitle(event.target.value)} />
              <textarea className="field min-h-28 resize-none px-3 py-2 text-sm" placeholder="Scrivi una nota privata del tuo personaggio..." value={noteContent} onChange={(event) => setNoteContent(event.target.value)} />
              <button className="player-modal-primary">
                <Plus size={16} /> Salva nota
              </button>
            </form>
            <div className="player-modal-list grid gap-2">
              {characterNotes.length ? characterNotes.map((note) => (
                <article key={note.id} className="player-note-card">
                  <p>{note.title}</p>
                  <p className="mt-1 text-sm leading-6 text-stone-300">{note.content}</p>
                </article>
              )) : <PlayerModalEmpty title="Nessuna nota salvata" text="Annota sospetti, indizi o obiettivi del tuo personaggio." />}
            </div>
          </div>
        ) : null}

        {panel === "inventory" ? (
          <div className="player-modal-list grid gap-2">
            {characterItems.length ? characterItems.map((item) => (
              <article key={item.id} className="player-item-card">
                <div className="flex items-center justify-between gap-3">
                  <p>{item.name} <span>x{item.quantity}</span></p>
                  <span>{item.is_public ? "Pubblico" : "Privato"}</span>
                </div>
                <p className="mt-2 text-sm leading-6 text-stone-300">{item.description || "Nessuna descrizione."}</p>
                {item.player_notes ? <p className="mt-2 rounded-md bg-black/25 p-2 text-xs text-stone-400">{item.player_notes}</p> : null}
              </article>
            )) : <PlayerModalEmpty title="Inventario vuoto" text="Gli oggetti assegnati dal Master appariranno qui." />}
          </div>
        ) : null}

        {panel === "private" ? (
          <PrivateThreadsPanel
            profile={state.profile}
            characters={state.characters}
            messages={state.privateMessages}
            masterId={state.campaigns[0].master_id}
            isMaster={false}
            onSend={onPrivateSend}
            onDeleteMessage={onDeleteMessage}
          />
        ) : null}

        {panel === "help" ? (
          <div className="player-help-grid">
            <article>
              <strong>Chat comune</strong>
              <p>Usala per giocare in scena. Invio pubblica, Shift+Invio va a capo.</p>
            </article>
            <article>
              <strong>Sussurri</strong>
              <p>Restano privati tra te e il Master, perfetti per indizi e visioni.</p>
            </article>
            <article>
              <strong>Audio locale</strong>
              <p>Volume e mute modificano solo il tuo ascolto, non quello degli altri.</p>
            </article>
          </div>
        ) : null}
      </section>
    </div>
  );
}

function PlayerModalEmpty({ title, text }: { title: string; text: string }) {
  return (
    <div className="player-modal-empty">
      <p>{title}</p>
      <span>{text}</span>
    </div>
  );
}

function InfoTile({ label, value, copy = false }: { label: string; value: string; copy?: boolean }) {
  return (
    <div className="player-info-tile sm:col-span-2">
      <p>{label}</p>
      <strong>{value}</strong>
      {copy ? <Copy size={14} /> : null}
    </div>
  );
}

function MobilePlayerTabs({ active, onChange }: { active: MobileTab; onChange: (tab: MobileTab) => void }) {
  const items: Array<{ id: MobileTab; label: string; icon: React.ReactNode }> = [
    { id: "chat", label: "Chat", icon: <MessageCircle size={15} /> },
    { id: "sheet", label: "Scheda", icon: <Backpack size={15} /> },
    { id: "private", label: "Privati", icon: <BookOpenText size={15} /> },
    { id: "off", label: "OFF", icon: <UsersRound size={15} /> }
  ];

  return (
    <nav className="mobile-player-tabs glass-panel sticky top-2 z-20 grid grid-cols-4 gap-1 rounded-lg p-1 lg:hidden">
      {items.map((item) => (
        <button
          key={item.id}
          type="button"
          onClick={() => onChange(item.id)}
          className={`inline-flex items-center justify-center gap-1 rounded-md px-2 py-2 text-xs ${active === item.id ? "bg-ember-500 text-ink-900" : "text-slate-300"}`}
        >
          {item.icon}
          {item.label}
        </button>
      ))}
    </nav>
  );
}
