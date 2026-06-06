"use client";

import { Activity, ArrowLeft, AudioLines, Bell, Eye, Film, ImageUp, Library, MapPinned, MessageSquareText, Plus, Radio, Save, ScrollText, Send, Shield, Sparkles, Square, Trash2, UsersRound, Volume2, X } from "lucide-react";
import type React from "react";
import { useMemo, useState } from "react";
import type { AudioTrack, InventoryItem, MapCharacterPosition, MediaAsset, Message, NarrativeMap, Npc, RoomState, Scene, SceneMediaType, SceneVisibility, SoundEffect } from "@/lib/types";
import { AudioPlayer } from "@/components/room/audio-player";
import { ChatPanel } from "@/components/room/chat-panel";
import { SceneStage } from "@/components/room/scene-stage";
import { SoundEffectPlayer } from "@/components/room/sound-effect-player";
import { ExportChatButton, OffChatPanel, PrivateThreadsPanel } from "@/components/room/social-panels";
import { DiceRequestPanel, SpotlightManager, SpotlightPanel } from "@/components/room/dice-and-spotlight";
import { MapToolPanel } from "@/components/room/map-tool-panel";
import type { CardDeckType } from "@/lib/game-random";
import { shortTime } from "@/lib/utils";

type MasterControlRoomProps = {
  state: RoomState;
  identityId: string;
  currentAudio: AudioTrack;
  onBack: () => void;
  onOpenPlayerView: () => void;
  onIdentityChange: (id: string) => void;
  onPublicMessage: (content: string) => void;
  onOffMessage: (content: string) => void;
  onPrivateMessage: (content: string, userId: string) => void;
  onTyping: (channel: "gdr" | "off" | "private", recipientUserId?: string | null) => void;
  onDeleteMessage: (message: Message) => void;
  onEditMessage: (message: Message, content: string) => void;
  onToggleMessagePin: (message: Message) => void;
  onSceneChange: (scene: Scene) => void;
  onAudioChange: (track: AudioTrack) => void;
  onCreateScene: (values: {
    title: string;
    description: string;
    imageUrl: string;
    imageFile?: File;
    mediaType?: SceneMediaType;
    videoUrl?: string;
    videoFile?: File;
    loopVideo?: boolean;
    visibility?: SceneVisibility;
    visibleUserIds?: string[];
    linkedAudioId?: string | null;
  }) => void | Promise<void>;
  onDeleteScene: (scene: Scene) => void | Promise<void>;
  onCreateAudio: (values: { title: string; audioUrl: string; loop: boolean; audioFile?: File }) => void | Promise<void>;
  onDeleteAudio: (track: AudioTrack) => void | Promise<void>;
  onCreateSoundEffect: (values: { title: string; audioUrl: string; loop: boolean; audioFile?: File }) => void | Promise<void>;
  onDeleteSoundEffect: (effect: SoundEffect) => void | Promise<void>;
  onTriggerSoundEffect: (effect: SoundEffect) => void | Promise<void>;
  onStopSoundEffect: () => void | Promise<void>;
  onCreateNpc: (values: { name: string; color: string; description: string; portraitUrl: string }) => void | Promise<void>;
  onDeleteNpc: (npc: Npc) => void | Promise<void>;
  onCreateInventoryItem: (characterId: string, values: { name: string; description: string; quantity: number; imageUrl: string; isPublic: boolean; masterNotes: string }) => void | Promise<void>;
  onDeleteInventoryItem: (item: InventoryItem) => void | Promise<void>;
  onUpdateChatPermissions: (values: { chatEnabled: boolean; mutedUserIds: string[] }) => void | Promise<void>;
  onCreateDiceRequest: (values: { diceCount?: number; diceSides: number; reason: string; targetUserId?: string | null; visibility: "public" | "private" }) => void | Promise<void>;
  onDrawCard: (values: { deck: CardDeckType; targetUserId?: string | null; visibility: "public" | "private"; reason: string }) => void | Promise<void>;
  onUpdateSpotlight: (values: { npcId: string | null; visibility: "off" | "public" | "private"; userIds: string[] }) => void | Promise<void>;
  onUpdateCharacter: (
    characterId: string,
    values: { characterName: string; characterSurname: string; portraitUrl: string; portraitFile?: File; color: string; hp: number; mentalState: string; visibleStatus: string; publicBackground: string; conditions: string }
  ) => void | Promise<void>;
  onCreateMediaAsset: (values: { title: string; assetType: MediaAsset["asset_type"]; url: string; tags: string[]; file?: File }) => void | Promise<void>;
  onDeleteMediaAsset: (asset: MediaAsset) => void | Promise<void>;
  onCreateMap: (values: { title: string; description: string; imageUrl: string; imageFile?: File; parentMapId?: string | null; levelType: NarrativeMap["level_type"]; isVisibleToPlayers: boolean }) => void | Promise<void>;
  onSetActiveMap: (map: NarrativeMap) => void | Promise<void>;
  onDeleteMap: (map: NarrativeMap) => void | Promise<void>;
  onDuplicateMap: (map: NarrativeMap) => void | Promise<void>;
  onUpdateMapCharacterPosition: (position: MapCharacterPosition, values: { x: number; y: number; narrativeLocation: string; isVisibleToPlayers: boolean; isLocked: boolean }) => void | Promise<void>;
  onLoadOlderMessages: () => void;
  onExportMessages: () => Promise<Message[]>;
  actionLog: { id: string; label: string; detail?: string; created_at: string }[];
  onSaveRoom: () => void;
  onDeleteRoom: () => void;
};

type ControlTool = "preview" | "scenes" | "map" | "chat" | "players" | "audio" | "media" | "inventory";

export function MasterControlRoom({
  state,
  identityId,
  currentAudio,
  onBack,
  onOpenPlayerView,
  onIdentityChange,
  onPublicMessage,
  onOffMessage,
  onPrivateMessage,
  onTyping,
  onDeleteMessage,
  onEditMessage,
  onToggleMessagePin,
  onSceneChange,
  onAudioChange,
  onCreateScene,
  onDeleteScene,
  onCreateAudio,
  onDeleteAudio,
  onCreateSoundEffect,
  onDeleteSoundEffect,
  onTriggerSoundEffect,
  onStopSoundEffect,
  onCreateNpc,
  onDeleteNpc,
  onCreateInventoryItem,
  onDeleteInventoryItem,
  onUpdateChatPermissions,
  onCreateDiceRequest,
  onDrawCard,
  onUpdateSpotlight,
  onUpdateCharacter,
  onCreateMediaAsset,
  onDeleteMediaAsset,
  onCreateMap,
  onSetActiveMap,
  onDeleteMap,
  onDuplicateMap,
  onUpdateMapCharacterPosition,
  onLoadOlderMessages,
  onExportMessages,
  actionLog,
  onSaveRoom,
  onDeleteRoom
}: MasterControlRoomProps) {
  const [activeTool, setActiveTool] = useState<ControlTool>("preview");
  const [masterChatText, setMasterChatText] = useState("");
  const [offText, setOffText] = useState("");
  const [isSoundbarOpen, setIsSoundbarOpen] = useState(false);
  const sessionMediaAssets = useMemo(() => buildSessionMediaAssets(state), [state]);
  const sendMasterChat = () => {
    if (!masterChatText.trim()) return;
    onPublicMessage(masterChatText.trim());
    setMasterChatText("");
  };
  const launchQuickCue = (cue: DirectorCue) => {
    onPublicMessage(cue.message);
  };

  return (
    <section className="director-control-room relative -m-4 grid min-h-screen gap-4 overflow-hidden px-4 py-4 sm:-m-6 sm:px-5 sm:py-5">
      <div className="pointer-events-none absolute inset-0 bg-[url('/assets/master/director-room-bg.png')] bg-cover bg-center opacity-70" />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_68%_20%,rgba(147,51,234,0.18),transparent_32rem),linear-gradient(90deg,rgba(2,3,7,0.82),rgba(3,4,9,0.62)_48%,rgba(2,3,7,0.88)),linear-gradient(180deg,rgba(0,0,0,0.25),rgba(0,0,0,0.78))]" />
      <header className="director-card relative z-10 rounded-xl p-4">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex min-w-0 items-center gap-3">
            <button
              type="button"
              onClick={onBack}
              className="director-icon-button"
              title="Torna al menu"
              aria-label="Torna al menu"
            >
              <ArrowLeft size={18} />
            </button>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <span className="director-kicker">
                  <Radio size={13} /> Cabina di regia
                </span>
                <span className="rounded-md border border-emerald-400/25 bg-emerald-500/10 px-2 py-1 text-xs font-semibold text-emerald-200">
                  Sessione Live
                </span>
              </div>
              <h1 className="mt-2 truncate font-serif text-3xl text-stone-100">{state.campaigns[0].title}</h1>
              <p className="mt-1 text-sm text-stone-300">
                {state.room.name} · codice <span className="font-mono text-ember-100">{state.room.invite_code}</span>
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={onOpenPlayerView}
              className="director-toolbar-button"
            >
              <Eye size={16} /> Vista giocatore
            </button>
          </div>
        </div>
      </header>
      <div className="relative z-10">
        <DirectorStatusBar state={state} currentAudio={currentAudio} actionLog={actionLog} />
      </div>

      <div className="director-workbench relative z-10 grid gap-4 2xl:grid-cols-[16rem_minmax(0,1fr)_25rem]">
        <nav className="director-sidebar rounded-xl p-3">
          <p className="px-3 pb-3 font-serif text-xs uppercase tracking-[0.28em] text-brass/80">Strumenti</p>
          <ControlLink icon={<Eye size={16} />} label="Panoramica" active={activeTool === "preview"} onClick={() => setActiveTool("preview")} />
          <ControlLink icon={<ImageUp size={16} />} label="Scene" active={activeTool === "scenes"} onClick={() => setActiveTool("scenes")} />
          <ControlLink icon={<MapPinned size={16} />} label="Mappa" active={activeTool === "map"} onClick={() => setActiveTool("map")} />
          <ControlLink icon={<MessageSquareText size={16} />} label="Chat e NPC" active={activeTool === "chat"} onClick={() => setActiveTool("chat")} />
          <ControlLink icon={<UsersRound size={16} />} label="Giocatori" active={activeTool === "players"} onClick={() => setActiveTool("players")} />
          <ControlLink icon={<AudioLines size={16} />} label="Audio" active={activeTool === "audio"} onClick={() => setActiveTool("audio")} />
          <ControlLink icon={<Volume2 size={16} />} label="Soundbar" active={isSoundbarOpen} onClick={() => setIsSoundbarOpen(true)} />
          <ControlLink icon={<Library size={16} />} label="Libreria media" active={activeTool === "media"} onClick={() => setActiveTool("media")} />
          <ControlLink icon={<Shield size={16} />} label="Inventari" active={activeTool === "inventory"} onClick={() => setActiveTool("inventory")} />
        </nav>

        <div className="grid min-w-0 gap-4">
          {activeTool === "preview" ? (
            <>
              <div className="director-overview grid gap-4">
                <div className="grid gap-4 xl:grid-cols-2">
                  <SpotlightPanel room={state.room} npcs={state.npcs} currentUserId={state.profile.id} />
                  <SoundEffectPlayer room={state.room} soundEffects={state.soundEffects} />
                </div>
                <SceneStage scene={state.scene} compact />
              </div>

              <div className="director-overview-lower grid gap-4 xl:grid-cols-[minmax(0,1.55fr)_minmax(18rem,0.85fr)]">
                <ReadOnlyChat
                  state={state}
                  messages={state.messages}
                  privateCount={state.privateMessages.length}
                  value={masterChatText}
                  onChange={(value) => {
                    setMasterChatText(value);
                    if (value.trim()) onTyping("gdr");
                  }}
                  onSend={sendMasterChat}
                  onDeleteMessage={onDeleteMessage}
                />
                <div className="grid gap-4">
                  <CharactersPanel state={state} />
                  <AudioPanel currentAudio={currentAudio} audioTracks={state.audioTracks} onAudioChange={onAudioChange} />
                </div>
              </div>
            </>
          ) : null}

          {activeTool === "scenes" ? (
            <SceneManager state={state} onSceneChange={onSceneChange} onCreateScene={onCreateScene} onDeleteScene={onDeleteScene} />
          ) : null}

          {activeTool === "map" ? (
            <MapToolPanel
              state={state}
              isMaster={true}
              onCreateMap={onCreateMap}
              onSetActiveMap={onSetActiveMap}
              onDeleteMap={onDeleteMap}
              onDuplicateMap={onDuplicateMap}
              onUpdateCharacterPosition={onUpdateMapCharacterPosition}
            />
          ) : null}

          {activeTool === "chat" ? (
            <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_25rem]">
              <div className="grid gap-4">
                <ChatPanel
                  messages={state.messages}
                  value={masterChatText}
                  onChange={setMasterChatText}
                  onSend={sendMasterChat}
                  onTyping={() => onTyping("gdr")}
                  onDeleteMessage={onDeleteMessage}
                  onEditMessage={onEditMessage}
                  onTogglePin={onToggleMessagePin}
                  onLoadOlder={onLoadOlderMessages}
                  hasOlderMessages={state.hasOlderMessages}
                  currentUserId={state.profile.id}
                  isMaster
                  characters={state.characters}
                  npcs={state.npcs}
                  showAvatars
                  typing={state.typing}
                />
                <ChatPermissionsPanel state={state} onUpdateChatPermissions={onUpdateChatPermissions} />
                <DiceRequestPanel characters={state.characters} onCreate={onCreateDiceRequest} />
                <ExportChatButton messages={[...state.messages, ...state.offMessages, ...state.privateMessages]} onLoadAll={onExportMessages} />
                <OffChatPanel
                  messages={state.offMessages}
                  value={offText}
                  onChange={(value) => {
                    setOffText(value);
                    if (value.trim()) onTyping("off");
                  }}
                  onSend={() => {
                    if (!offText.trim()) return;
                    onOffMessage(offText.trim());
                    setOffText("");
                  }}
                  onDeleteMessage={onDeleteMessage}
                />
              </div>
              <div className="grid gap-4">
                <PrivateThreadsPanel
                  profile={state.profile}
                  characters={state.characters}
                  messages={state.privateMessages}
                  masterId={state.campaigns[0].master_id}
                  isMaster
                  onSend={onPrivateMessage}
                  onDeleteMessage={onDeleteMessage}
                />
                <SpotlightManager room={state.room} npcs={state.npcs} characters={state.characters} onSave={onUpdateSpotlight} />
                <NpcPanel state={state} onCreateNpc={onCreateNpc} onDeleteNpc={onDeleteNpc} />
              </div>
            </div>
          ) : null}

          {activeTool === "players" ? <PlayersManager state={state} onUpdateCharacter={onUpdateCharacter} /> : null}

          {activeTool === "audio" ? (
            <AudioManager
              currentAudio={currentAudio}
              audioTracks={state.audioTracks}
              onAudioChange={onAudioChange}
              onCreateAudio={onCreateAudio}
              onDeleteAudio={onDeleteAudio}
            />
          ) : null}

          {activeTool === "media" ? (
            <MediaLibraryPanel assets={sessionMediaAssets} onCreate={onCreateMediaAsset} onDelete={onDeleteMediaAsset} />
          ) : null}

          {activeTool === "inventory" ? (
            <InventoryPanel state={state} onCreateInventoryItem={onCreateInventoryItem} onDeleteInventoryItem={onDeleteInventoryItem} />
          ) : null}
        </div>

        <DirectorRightRail
          state={state}
          identityId={identityId}
          currentAudio={currentAudio}
          onIdentityChange={onIdentityChange}
          onSceneChange={onSceneChange}
          onAudioChange={onAudioChange}
          onSetActiveMap={onSetActiveMap}
          onUpdateMapCharacterPosition={onUpdateMapCharacterPosition}
          onSaveRoom={onSaveRoom}
          onDeleteRoom={onDeleteRoom}
          onOpenTool={setActiveTool}
          onQuickCue={launchQuickCue}
          onDirectorEvent={(event) => {
            if (event.recipientUserId) {
              onPrivateMessage(event.message, event.recipientUserId);
            } else {
              onPublicMessage(event.message);
            }
          }}
          onCreateDiceRequest={onCreateDiceRequest}
          onDrawCard={onDrawCard}
          actionLog={actionLog}
        />
      </div>
      <div className="relative z-20">
        <AudioPlayer track={currentAudio} />
      </div>
      {isSoundbarOpen ? (
        <SoundbarModal
          soundEffects={state.soundEffects}
          currentSoundEffectId={state.room.current_sound_effect_id ?? null}
          onClose={() => setIsSoundbarOpen(false)}
          onCreateSoundEffect={onCreateSoundEffect}
          onDeleteSoundEffect={onDeleteSoundEffect}
          onTriggerSoundEffect={onTriggerSoundEffect}
          onStopSoundEffect={onStopSoundEffect}
        />
      ) : null}
    </section>
  );
}

function DirectorRightRail({
  state,
  identityId,
  currentAudio,
  onIdentityChange,
  onSceneChange,
  onAudioChange,
  onSetActiveMap,
  onUpdateMapCharacterPosition,
  onSaveRoom,
  onDeleteRoom,
  onOpenTool,
  onQuickCue,
  onDirectorEvent,
  onCreateDiceRequest,
  onDrawCard,
  actionLog
}: {
  state: RoomState;
  identityId: string;
  currentAudio: AudioTrack;
  onIdentityChange: (id: string) => void;
  onSceneChange: (scene: Scene) => void;
  onAudioChange: (track: AudioTrack) => void;
  onSetActiveMap: (map: NarrativeMap) => void | Promise<void>;
  onUpdateMapCharacterPosition: (position: MapCharacterPosition, values: { x: number; y: number; narrativeLocation: string; isVisibleToPlayers: boolean; isLocked: boolean }) => void | Promise<void>;
  onSaveRoom: () => void;
  onDeleteRoom: () => void;
  onOpenTool: (tool: ControlTool) => void;
  onQuickCue: (cue: DirectorCue) => void;
  onDirectorEvent: (event: { message: string; recipientUserId?: string | null }) => void;
  onCreateDiceRequest: (values: { diceCount?: number; diceSides: number; reason: string; targetUserId?: string | null; visibility: "public" | "private" }) => void | Promise<void>;
  onDrawCard: (values: { deck: CardDeckType; targetUserId?: string | null; visibility: "public" | "private"; reason: string }) => void | Promise<void>;
  actionLog: { id: string; label: string; detail?: string; created_at: string }[];
}) {
  const activeIdentity = identityId === "master" ? "Master / Narratore" : state.npcs.find((npc) => npc.id === identityId)?.name ?? "Master / Narratore";
  const masterAvatar = state.profile.username.slice(0, 1).toUpperCase();

  return (
    <aside className="director-right-rail grid content-start gap-4 rounded-xl p-3">
      <section className="director-rail-section">
        <h2 className="director-section-title">
          <Sparkles size={15} /> Pannello Master
        </h2>
        <label className="mt-3 block text-xs uppercase tracking-[0.18em] text-stone-500">Scrivi come</label>
        <select className="field mt-2 w-full px-3 py-2 text-sm" value={identityId} onChange={(event) => onIdentityChange(event.target.value)}>
          <option value="master">Master / Narratore</option>
          {state.npcs.map((npc) => (
            <option key={npc.id} value={npc.id}>
              {npc.name}
            </option>
          ))}
        </select>
        <div className="mt-4 flex items-start gap-3 overflow-x-auto pb-1">
          <button type="button" onClick={() => onIdentityChange("master")} className={`director-identity-token ${identityId === "master" ? "is-active" : ""}`}>
            <span>{masterAvatar}</span>
            <small>Master</small>
          </button>
          {state.npcs.slice(0, 4).map((npc) => (
            <button key={npc.id} type="button" onClick={() => onIdentityChange(npc.id)} className={`director-identity-token ${identityId === npc.id ? "is-active" : ""}`}>
              <span style={npc.portrait_url ? { backgroundImage: `url(${npc.portrait_url})` } : { color: npc.color }}>{npc.portrait_url ? "" : npc.name.slice(0, 1)}</span>
              <small>{npc.name}</small>
            </button>
          ))}
          <button type="button" onClick={() => onOpenTool("chat")} className="director-identity-token">
            <span>+</span>
            <small>NPC</small>
          </button>
        </div>
        <p className="mt-3 text-xs text-stone-400">Identita attiva: <span className="text-stone-100">{activeIdentity}</span></p>
      </section>

      <section className="director-rail-section">
        <h3 className="director-mini-title">Mission control</h3>
        <div className="mt-3 grid grid-cols-2 gap-2">
          <RailAction label="Scene" icon={<ImageUp size={17} />} onClick={() => onOpenTool("scenes")} />
          <RailAction label="Privati" icon={<MessageSquareText size={17} />} onClick={() => onOpenTool("chat")} />
          <RailAction label="Audio" icon={<AudioLines size={17} />} onClick={() => onOpenTool("audio")} />
          <RailAction label="Giocatori" icon={<UsersRound size={17} />} onClick={() => onOpenTool("players")} />
        </div>
      </section>

      <DirectorQuickMapPanel state={state} onOpenTool={onOpenTool} onSetActiveMap={onSetActiveMap} onUpdateMapCharacterPosition={onUpdateMapCharacterPosition} />
      <DirectorRandomPanel state={state} onCreateDiceRequest={onCreateDiceRequest} onDrawCard={onDrawCard} />
      <DirectorCuePanel onLaunch={onQuickCue} />
      <DirectorEventBuilder state={state} onLaunch={onDirectorEvent} />
      <DirectorTimelinePanel state={state} actionLog={actionLog} />
      <DirectorRecapPanel state={state} currentAudio={currentAudio} actionLog={actionLog} />

      <section className="director-rail-section">
        <h3 className="director-mini-title">Scena</h3>
        <button type="button" onClick={() => onOpenTool("scenes")} className="director-current-card mt-3">
          <span className="h-16 w-20 shrink-0 rounded-md bg-cover bg-center" style={{ backgroundImage: `url(${state.scene.image_url})` }} />
          <span className="min-w-0 text-left">
            <strong className="block truncate text-sm text-stone-100">{state.scene.title}</strong>
            <small className="line-clamp-2 text-xs leading-5 text-stone-400">{state.scene.description}</small>
          </span>
        </button>
        <div className="mt-3 grid grid-cols-2 gap-2">
          <button type="button" onClick={() => onSceneChange(state.scene)} className="director-small-button">Rimostra</button>
          <button type="button" onClick={() => onOpenTool("scenes")} className="director-small-button is-warm">Cambia</button>
        </div>
      </section>

      <section className="director-rail-section">
        <h3 className="director-mini-title">Audio</h3>
        <div className="director-current-card mt-3">
          <span className="grid h-12 w-12 shrink-0 place-items-center rounded-md border border-violet-400/25 bg-violet-500/10 text-violet-100">
            <AudioLines size={18} />
          </span>
          <span className="min-w-0">
            <strong className="block truncate text-sm text-stone-100">{currentAudio.title}</strong>
            <small className="text-xs text-emerald-300">{currentAudio.loop ? "Loop attivo" : "Loop spento"}</small>
          </span>
        </div>
        <div className="mt-3 grid grid-cols-2 gap-2">
          {state.audioTracks.slice(0, 2).map((track) => (
            <button key={track.id} type="button" onClick={() => onAudioChange(track)} className={`director-small-button ${track.id === currentAudio.id ? "is-warm" : ""}`}>
              {track.title}
            </button>
          ))}
        </div>
      </section>

      <section className="director-rail-section">
        <h3 className="director-mini-title">Appunti rapidi</h3>
        <div className="mt-3 flex gap-2">
          <input className="field min-w-0 flex-1 px-3 py-2 text-sm" placeholder="Scrivi un appunto per te..." />
          <button type="button" className="director-icon-button h-10 w-10" title="Fissa appunto" aria-label="Fissa appunto">
            <Bell size={15} />
          </button>
        </div>
      </section>

      <div className="grid grid-cols-2 gap-2">
        <button type="button" onClick={onSaveRoom} className="director-session-button is-save">
          <Save size={15} /> Salva
        </button>
        <button type="button" onClick={onDeleteRoom} className="director-session-button is-danger">
          <Trash2 size={15} /> Chiudi
        </button>
      </div>
    </aside>
  );
}

function DirectorTimelinePanel({ state, actionLog }: { state: RoomState; actionLog: { id: string; label: string; detail?: string; created_at: string }[] }) {
  const recentMessages = [...state.messages, ...state.offMessages, ...state.privateMessages]
    .sort((a, b) => b.created_at.localeCompare(a.created_at))
    .slice(0, 3);
  const items = [
    { id: `scene-${state.scene.id}`, label: "Scena attiva", detail: state.scene.title, created_at: state.scene.created_at },
    ...actionLog.slice(0, 3),
    ...recentMessages.map((message) => ({
      id: message.id,
      label: message.is_private ? "Sussurro" : message.channel === "off" ? "OFF GDR" : message.sender_display_name,
      detail: message.content,
      created_at: message.created_at
    }))
  ]
    .sort((a, b) => b.created_at.localeCompare(a.created_at))
    .slice(0, 6);

  return (
    <section className="director-rail-section director-timeline-panel">
      <h3 className="director-mini-title">Timeline sessione</h3>
      <div className="mt-3 grid gap-2">
        {items.map((item) => (
          <article key={item.id} className="director-timeline-item">
            <time>{shortTime(item.created_at)}</time>
            <div>
              <p>{item.label}</p>
              {item.detail ? <span>{item.detail}</span> : null}
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

function DirectorRecapPanel({
  state,
  currentAudio,
  actionLog
}: {
  state: RoomState;
  currentAudio: AudioTrack;
  actionLog: { id: string; label: string; detail?: string; created_at: string }[];
}) {
  const pinnedMessages = [...state.messages, ...state.offMessages, ...state.privateMessages]
    .filter((message) => message.is_pinned)
    .sort((a, b) => a.created_at.localeCompare(b.created_at));
  const recentMessages = state.messages
    .slice(-12)
    .map((message) => `[${shortTime(message.created_at)}] ${message.sender_display_name}: ${message.content}`);
  const recentActions = actionLog
    .slice(0, 10)
    .map((entry) => `[${shortTime(entry.created_at)}] ${entry.label}${entry.detail ? ` - ${entry.detail}` : ""}`);
  const campaignTitle = state.campaigns.find((campaign) => campaign.id === state.room.campaign_id)?.title ?? state.campaigns[0]?.title ?? "Campagna";
  const players = state.characters
    .map((character) => {
      const name = `${character.character_name} ${character.character_surname}`.trim();
      return `- ${name || "Personaggio"} | PF ${character.hp}/10 | Mente ${character.mental_state || "n/d"} | Stato ${character.visible_status || "n/d"}`;
    })
    .join("\n");

  const downloadRecap = () => {
    const lines = [
      "GDR MASTER ROOM - RECAP SESSIONE",
      "================================",
      "",
      `Campagna: ${campaignTitle}`,
      `Stanza: ${state.room.name}`,
      `Codice invito: ${state.room.invite_code}`,
      `Scena finale: ${state.scene.title}`,
      `Descrizione scena: ${state.scene.description || "Nessuna descrizione."}`,
      `Audio finale: ${currentAudio.title}`,
      `Generato: ${new Date().toLocaleString("it-IT")}`,
      "",
      "GIOCATORI",
      "---------",
      players || "Nessun personaggio registrato.",
      "",
      "MESSAGGI PINNATI",
      "----------------",
      pinnedMessages.length
        ? pinnedMessages.map((message) => `[${shortTime(message.created_at)}] ${message.sender_display_name}: ${message.content}`).join("\n")
        : "Nessun messaggio pinnato.",
      "",
      "TIMELINE REGIA",
      "--------------",
      recentActions.length ? recentActions.join("\n") : "Nessuna azione di regia registrata.",
      "",
      "ULTIMI MESSAGGI IN CHAT",
      "----------------------",
      recentMessages.length ? recentMessages.join("\n") : "Nessun messaggio recente.",
      ""
    ];
    downloadTextFile(`recap-${state.room.invite_code.toLowerCase()}.txt`, lines.join("\n"));
  };

  return (
    <section className="director-rail-section director-recap-panel">
      <h3 className="director-mini-title">Recap finale</h3>
      <p className="mt-2 text-xs leading-5 text-stone-400">
        Genera una chiusura leggibile della sessione con scena, giocatori, pin e ultime azioni.
      </p>
      <div className="mt-3 grid grid-cols-3 gap-2 text-center">
        <span className="director-recap-stat">
          <strong>{state.characters.length}</strong>
          <small>PG</small>
        </span>
        <span className="director-recap-stat">
          <strong>{pinnedMessages.length}</strong>
          <small>Pin</small>
        </span>
        <span className="director-recap-stat">
          <strong>{state.messages.length}</strong>
          <small>Chat</small>
        </span>
      </div>
      <button type="button" onClick={downloadRecap} className="director-cinematic-button mt-3 w-full">
        <ScrollText size={16} />
        Scarica recap
      </button>
    </section>
  );
}

function DirectorQuickMapPanel({
  state,
  onOpenTool,
  onSetActiveMap,
  onUpdateMapCharacterPosition
}: {
  state: RoomState;
  onOpenTool: (tool: ControlTool) => void;
  onSetActiveMap: (map: NarrativeMap) => void | Promise<void>;
  onUpdateMapCharacterPosition: (position: MapCharacterPosition, values: { x: number; y: number; narrativeLocation: string; isVisibleToPlayers: boolean; isLocked: boolean }) => void | Promise<void>;
}) {
  const activeMap = state.maps.find((map) => map.is_active) ?? state.maps[0];
  const positions = activeMap ? buildQuickMapPositions(activeMap, state.characters, state.mapCharacterPositions) : [];

  function nudge(position: MapCharacterPosition, deltaX: number, deltaY: number) {
    if (!activeMap || position.is_locked) return;
    onUpdateMapCharacterPosition(position, {
      x: clampPercent(position.x + deltaX),
      y: clampPercent(position.y + deltaY),
      narrativeLocation: position.narrative_location || activeMap.title,
      isVisibleToPlayers: position.is_visible_to_players,
      isLocked: position.is_locked
    });
  }

  return (
    <section className="director-rail-section">
      <h3 className="director-mini-title">
        <MapPinned size={15} /> Mappa rapida
      </h3>
      {activeMap ? (
        <>
          <button type="button" onClick={() => onOpenTool("map")} className="director-current-card mt-3">
            <span className="h-14 w-16 shrink-0 rounded-md bg-cover bg-center" style={{ backgroundImage: `url(${activeMap.image_url})` }} />
            <span className="min-w-0 text-left">
              <strong className="block truncate text-sm text-stone-100">{activeMap.title}</strong>
              <small className="line-clamp-2 text-xs leading-5 text-stone-400">{activeMap.description || "Mappa sessione"}</small>
            </span>
          </button>
          <div className="mt-3 grid gap-2">
            {state.maps.slice(0, 4).map((map) => (
              <button key={map.id} type="button" onClick={() => onSetActiveMap(map)} className={`director-small-button text-left ${map.id === activeMap.id ? "is-warm" : ""}`}>
                {map.is_active ? "In scena: " : "Mostra: "} {map.title}
              </button>
            ))}
          </div>
          {positions.length ? (
            <div className="mt-3 grid gap-2">
              <p className="text-xs uppercase tracking-[0.18em] text-stone-500">Indicatori giocatori</p>
              {positions.map((position) => {
                const character = state.characters.find((item) => item.id === position.character_id);
                if (!character) return null;
                return (
                  <div key={position.id} className="director-map-nudge-row">
                    <span className="min-w-0 truncate" style={{ color: character.color }}>
                      {character.character_name}
                    </span>
                    <div>
                      <button type="button" onClick={() => nudge(position, 0, -5)} aria-label={`Sposta ${character.character_name} in alto`}>↑</button>
                      <button type="button" onClick={() => nudge(position, -5, 0)} aria-label={`Sposta ${character.character_name} a sinistra`}>←</button>
                      <button type="button" onClick={() => nudge(position, 5, 0)} aria-label={`Sposta ${character.character_name} a destra`}>→</button>
                      <button type="button" onClick={() => nudge(position, 0, 5)} aria-label={`Sposta ${character.character_name} in basso`}>↓</button>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : null}
        </>
      ) : (
        <div className="mt-3 rounded-lg border border-dashed border-brass/25 p-3 text-sm text-stone-400">
          Nessuna mappa caricata. Apri lo strumento Mappa per crearne una.
        </div>
      )}
      <button type="button" onClick={() => onOpenTool("map")} className="director-small-button mt-3 w-full">
        Apri gestione mappe
      </button>
    </section>
  );
}

function DirectorRandomPanel({
  state,
  onCreateDiceRequest,
  onDrawCard
}: {
  state: RoomState;
  onCreateDiceRequest: (values: { diceCount?: number; diceSides: number; reason: string; targetUserId?: string | null; visibility: "public" | "private" }) => void | Promise<void>;
  onDrawCard: (values: { deck: CardDeckType; targetUserId?: string | null; visibility: "public" | "private"; reason: string }) => void | Promise<void>;
}) {
  const [diceCount, setDiceCount] = useState(1);
  const [diceSides, setDiceSides] = useState(20);
  const [diceTarget, setDiceTarget] = useState("");
  const [diceReason, setDiceReason] = useState("");
  const [cardDeck, setCardDeck] = useState<CardDeckType>("poker");
  const [cardTarget, setCardTarget] = useState("");
  const [cardReason, setCardReason] = useState("");

  return (
    <section className="director-rail-section director-random-panel">
      <h3 className="director-mini-title">Dadi e carte</h3>
      <div className="mt-3 grid gap-3">
        <form
          className="director-random-box"
          onSubmit={(event) => {
            event.preventDefault();
            onCreateDiceRequest({
              diceCount,
              diceSides,
              reason: diceReason.trim(),
              targetUserId: diceTarget || null,
              visibility: diceTarget ? "private" : "public"
            });
            setDiceReason("");
          }}
        >
          <p>Richiesta tiro rapida</p>
          <div className="grid grid-cols-[4.5rem_1fr] gap-2">
            <input className="field px-2 py-2 text-sm" type="number" min="1" max="20" value={diceCount} onChange={(event) => setDiceCount(Math.max(1, Number(event.target.value)))} aria-label="Numero dadi rapido" />
            <select className="field px-2 py-2 text-sm" value={diceSides} onChange={(event) => setDiceSides(Number(event.target.value))}>
              {[4, 6, 8, 10, 12, 20, 100].map((sides) => <option key={sides} value={sides}>d{sides}</option>)}
            </select>
          </div>
          <select className="field px-2 py-2 text-sm" value={diceTarget} onChange={(event) => setDiceTarget(event.target.value)}>
            <option value="">Tutti</option>
            {state.characters.map((character) => (
              <option key={character.id} value={character.user_id}>{character.character_name} {character.character_surname}</option>
            ))}
          </select>
          <input className="field px-2 py-2 text-sm" placeholder="Motivo" value={diceReason} onChange={(event) => setDiceReason(event.target.value)} />
          <button className="director-small-button is-warm" type="submit">Richiedi tiro</button>
        </form>

        <form
          className="director-random-box"
          onSubmit={(event) => {
            event.preventDefault();
            onDrawCard({
              deck: cardDeck,
              targetUserId: cardTarget || null,
              visibility: cardTarget ? "private" : "public",
              reason: cardReason.trim()
            });
            setCardReason("");
          }}
        >
          <p>Estrazione carte</p>
          <select className="field px-2 py-2 text-sm" value={cardDeck} onChange={(event) => setCardDeck(event.target.value as CardDeckType)}>
            <option value="poker">Mazzo poker</option>
            <option value="regional">Mazzo regionale italiano</option>
          </select>
          <select className="field px-2 py-2 text-sm" value={cardTarget} onChange={(event) => setCardTarget(event.target.value)}>
            <option value="">Pubblica</option>
            {state.characters.map((character) => (
              <option key={character.id} value={character.user_id}>Privata: {character.character_name}</option>
            ))}
          </select>
          <input className="field px-2 py-2 text-sm" placeholder="Motivo estrazione" value={cardReason} onChange={(event) => setCardReason(event.target.value)} />
          <button className="director-small-button is-warm" type="submit">Estrai carta</button>
        </form>
      </div>
    </section>
  );
}

type DirectorEventPreset = {
  id: string;
  label: string;
  detail: string;
  template: string;
  tone: "reveal" | "danger" | "vision" | "chapter";
};

const directorEventPresets: DirectorEventPreset[] = [
  {
    id: "npc-entry",
    label: "Entrata NPC",
    detail: "Presenta un volto importante",
    tone: "reveal",
    template: "[evento] Una presenza entra nella scena. Ogni conversazione si interrompe mentre tutti ne percepiscono il peso."
  },
  {
    id: "secret",
    label: "Segreto",
    detail: "Indizio per pochi occhi",
    tone: "vision",
    template: "[sussurro] Noti un dettaglio che gli altri non sembrano cogliere."
  },
  {
    id: "threat",
    label: "Minaccia",
    detail: "Alza la tensione",
    tone: "danger",
    template: "[evento] Qualcosa cambia nell'aria. La stanza sembra trattenere il respiro."
  },
  {
    id: "chapter-note",
    label: "Beat di capitolo",
    detail: "Segna un passaggio chiave",
    tone: "chapter",
    template: "[capitolo] Questo momento resta inciso nella memoria della sessione."
  }
];

function DirectorEventBuilder({
  state,
  onLaunch
}: {
  state: RoomState;
  onLaunch: (event: { message: string; recipientUserId?: string | null }) => void;
}) {
  const [selectedPreset, setSelectedPreset] = useState(directorEventPresets[0]);
  const [target, setTarget] = useState("public");
  const [message, setMessage] = useState(selectedPreset.template);

  function selectPreset(preset: DirectorEventPreset) {
    setSelectedPreset(preset);
    setMessage(preset.template);
  }

  return (
    <section className="director-rail-section director-event-builder">
      <h3 className="director-mini-title">Event builder</h3>
      <p className="mt-2 text-xs leading-5 text-stone-400">Costruisci un beat narrativo rapido senza aprire altri pannelli.</p>
      <div className="mt-3 grid grid-cols-2 gap-2">
        {directorEventPresets.map((preset) => (
          <button
            key={preset.id}
            type="button"
            onClick={() => selectPreset(preset)}
            className={`director-event-preset director-event-preset--${preset.tone} ${selectedPreset.id === preset.id ? "is-active" : ""}`}
          >
            <span>{preset.label}</span>
            <small>{preset.detail}</small>
          </button>
        ))}
      </div>
      <select className="field mt-3 w-full px-3 py-2 text-sm" value={target} onChange={(event) => setTarget(event.target.value)}>
        <option value="public">Pubblico: tutta la stanza</option>
        {state.characters.map((character) => (
          <option key={character.id} value={character.user_id}>
            Privato: {character.character_name} {character.character_surname}
          </option>
        ))}
      </select>
      <textarea
        className="field mt-2 min-h-24 resize-none px-3 py-2 text-sm"
        value={message}
        onChange={(event) => setMessage(event.target.value)}
        placeholder="Scrivi evento narrativo..."
      />
      <button
        type="button"
        className="director-cinematic-button mt-3 w-full"
        onClick={() => {
          if (!message.trim()) return;
          onLaunch({ message: message.trim(), recipientUserId: target === "public" ? null : target });
        }}
      >
        <Send size={16} /> Lancia evento
      </button>
    </section>
  );
}

function downloadTextFile(filename: string, content: string) {
  const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}

type DirectorCue = {
  id: string;
  label: string;
  tone: "reveal" | "danger" | "vision" | "chapter";
  message: string;
};

const directorCues: DirectorCue[] = [
  {
    id: "reveal",
    label: "Rivelazione",
    tone: "reveal",
    message: "La verita emerge all'improvviso: un dettaglio impossibile cambia il senso di tutto cio che avete visto finora."
  },
  {
    id: "danger",
    label: "Pericolo",
    tone: "danger",
    message: "Qualcosa si muove nell'ombra. L'aria si tende, il silenzio si spezza, e ogni scelta ora puo avere un prezzo."
  },
  {
    id: "vision",
    label: "Visione",
    tone: "vision",
    message: "Per un istante la realta si piega: immagini, suoni e ricordi non vostri attraversano la stanza come un presagio."
  },
  {
    id: "chapter",
    label: "Fine capitolo",
    tone: "chapter",
    message: "La scena si chiude su questa immagine. Qualcosa e cambiato, e la storia non potra piu tornare al punto di prima."
  }
];

function DirectorCuePanel({ onLaunch }: { onLaunch: (cue: DirectorCue) => void }) {
  return (
    <section className="director-rail-section director-cue-panel">
      <h3 className="director-mini-title">Cue di regia</h3>
      <p className="mt-2 text-xs leading-5 text-stone-400">Eventi narrativi rapidi da lanciare in chat quando serve cambiare ritmo.</p>
      <div className="mt-3 grid gap-2">
        {directorCues.map((cue) => (
          <button key={cue.id} type="button" className={`director-cue-button director-cue-button--${cue.tone}`} onClick={() => onLaunch(cue)}>
            <span>{cue.label}</span>
            <small>Lancia evento</small>
          </button>
        ))}
      </div>
    </section>
  );
}

function RailAction({ label, icon, onClick }: { label: string; icon: React.ReactNode; onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} className="director-rail-action">
      {icon}
      <span>{label}</span>
    </button>
  );
}

function ToolHeading({ icon, eyebrow, title, detail }: { icon: React.ReactNode; eyebrow: string; title: string; detail: string }) {
  return (
    <header className="director-tool-heading">
      <div className="director-tool-emblem">{icon}</div>
      <div>
        <p>{eyebrow}</p>
        <h2>{title}</h2>
        <span>{detail}</span>
      </div>
    </header>
  );
}

function DirectorEmptyState({ title, text }: { title: string; text: string }) {
  return (
    <div className="director-empty-state">
      <Sparkles size={22} />
      <p>{title}</p>
      <span>{text}</span>
    </div>
  );
}

function ControlLink({
  icon,
  label,
  active = false,
  onClick
}: {
  icon: React.ReactNode;
  label: string;
  active?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`director-nav-link ${
        active ? "is-active" : ""
      }`}
    >
      {icon}
      {label}
    </button>
  );
}

function DirectorStatusBar({
  state,
  currentAudio,
  actionLog
}: {
  state: RoomState;
  currentAudio: AudioTrack;
  actionLog: { id: string; label: string; detail?: string; created_at: string }[];
}) {
  const onlinePlayers = state.presence.filter((entry) => Date.now() - new Date(entry.last_seen_at).getTime() < 45000);
  const activeTyping = state.typing.filter((entry) => entry.user_id !== state.profile.id && Date.now() - new Date(entry.updated_at).getTime() < 6000);
  const pinnedCount = [...state.messages, ...state.offMessages, ...state.privateMessages].filter((message) => message.is_pinned).length;

  return (
    <section className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_22rem]">
      <div className="director-card rounded-xl p-3">
        <div className="grid gap-2 sm:grid-cols-4">
          <StatusPill icon={<Activity size={15} />} label="Sessione" value="Live" />
          <StatusPill icon={<UsersRound size={15} />} label="Presenze" value={`${onlinePlayers.length}/${state.characters.length + 1}`} />
          <StatusPill icon={<AudioLines size={15} />} label="Audio" value={currentAudio.title} />
          <StatusPill icon={<PinIcon />} label="Pin" value={String(pinnedCount)} />
        </div>
        {activeTyping.length ? (
          <p className="mt-3 rounded-lg border border-sky-400/20 bg-sky-500/10 px-3 py-2 text-xs text-sky-100">
            {activeTyping.map((entry) => entry.display_name).join(", ")} sta scrivendo.
          </p>
        ) : null}
      </div>
      <div className="director-card rounded-xl p-3">
        <h2 className="flex items-center gap-2 font-serif text-xs uppercase tracking-[0.22em] text-brass">
          <Bell size={15} /> Log regia
        </h2>
        <div className="mt-2 space-y-2">
          {actionLog.slice(0, 4).map((entry) => (
            <p key={entry.id} className="text-xs leading-5 text-slate-300">
              <span className="text-slate-500">{shortTime(entry.created_at)}</span> <span className="text-white">{entry.label}</span>
              {entry.detail ? <span className="text-slate-400"> · {entry.detail}</span> : null}
            </p>
          ))}
          {!actionLog.length ? <p className="text-xs text-slate-500">Le azioni principali appariranno qui.</p> : null}
        </div>
      </div>
    </section>
  );
}

function StatusPill({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="director-status-tile px-3 py-2">
      <p className="flex items-center gap-2 text-xs uppercase tracking-[0.14em] text-stone-500">
        {icon} {label}
      </p>
      <p className="mt-1 truncate text-sm font-semibold text-white">{value}</p>
    </div>
  );
}

function PinIcon() {
  return <span className="text-sm text-brass">⌖</span>;
}

function CharactersPanel({ state, expanded = false }: { state: RoomState; expanded?: boolean }) {
  return (
    <section className="glass-panel rounded-lg p-4">
      <h2 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.18em] text-brass">
        <UsersRound size={16} /> Giocatori
      </h2>
      <div className={`mt-4 grid gap-3 ${expanded ? "md:grid-cols-2" : ""}`}>
        {state.characters.map((character) => (
          <article key={character.id} className="flex gap-3 rounded-lg border border-white/10 bg-white/[0.04] p-3">
            <div className="h-14 w-14 shrink-0 rounded-lg bg-cover bg-center" style={{ backgroundImage: `url(${character.portrait_url})` }} />
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold" style={{ color: character.color }}>
                {character.character_name} {character.character_surname}
              </p>
              <p className="mt-1 text-xs text-slate-300">
                PF {character.hp} · {character.mental_state} · {character.visible_status}
              </p>
              <p className="mt-1 text-xs text-slate-500">{isOnline(state, character.user_id) ? "online" : "offline"}</p>
              <div className="mt-2 flex flex-wrap gap-1">
                {(character.conditions?.length ? character.conditions : [character.visible_status]).filter(Boolean).map((condition) => (
                  <span key={condition} className="rounded-md border border-white/10 bg-white/[0.04] px-2 py-1 text-xs text-slate-200">
                    {condition}
                  </span>
                ))}
              </div>
              {expanded ? <p className="mt-2 line-clamp-3 text-xs leading-5 text-slate-400">{character.public_background}</p> : null}
              <div className="mt-2 flex flex-wrap gap-1">
                {state.inventory
                  .filter((item) => item.character_id === character.id && item.is_public)
                  .map((item) => (
                    <span key={item.id} className="rounded-md bg-emerald-500/10 px-2 py-1 text-xs text-emerald-100">
                      {item.name} x{item.quantity}
                    </span>
                  ))}
              </div>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

function isOnline(state: RoomState, userId: string) {
  const presence = state.presence.find((entry) => entry.user_id === userId);
  return Boolean(presence && Date.now() - new Date(presence.last_seen_at).getTime() < 45000);
}

function buildQuickMapPositions(map: NarrativeMap, characters: RoomState["characters"], positions: MapCharacterPosition[]) {
  const existingForMap = positions.filter((position) => position.map_id === map.id);
  const positionedCharacters = new Set(existingForMap.map((position) => position.character_id));
  const virtualPositions = characters
    .filter((character) => !positionedCharacters.has(character.id))
    .map((character, index) => ({
      id: `virtual-position:${map.id}:${character.id}`,
      map_id: map.id,
      character_id: character.id,
      x: clampPercent(18 + (index % 4) * 18),
      y: clampPercent(22 + Math.floor(index / 4) * 16),
      narrative_location: map.title,
      is_visible_to_players: true,
      is_locked: false,
      updated_at: new Date(0).toISOString()
    }));

  return [...existingForMap, ...virtualPositions];
}

function clampPercent(value: number) {
  return Math.min(96, Math.max(4, value));
}

function buildSessionMediaAssets(state: RoomState): MediaAsset[] {
  const derivedAssets: MediaAsset[] = [];

  for (const scene of state.scenes) {
    if (scene.image_url) {
      derivedAssets.push({
        id: `scene:${scene.id}:image`,
        room_id: scene.room_id,
        title: `${scene.title} - immagine scena`,
        asset_type: "image",
        url: scene.image_url,
        tags: ["scena", scene.visibility === "private" ? "privata" : "pubblica"],
        created_by: scene.created_by,
        created_at: scene.created_at
      });
    }

    if (scene.video_url) {
      derivedAssets.push({
        id: `scene:${scene.id}:video`,
        room_id: scene.room_id,
        title: `${scene.title} - video scena`,
        asset_type: "video",
        url: scene.video_url,
        tags: ["video", "scena", scene.loop_video === false ? "no-loop" : "loop"],
        created_by: scene.created_by,
        created_at: scene.created_at
      });
    }
  }

  const mapAssets = state.maps.map((map) => ({
    id: `map:${map.id}`,
    room_id: map.room_id,
    title: `${map.title} - mappa`,
    asset_type: "map" as const,
    url: map.image_url,
    tags: ["mappa", map.level_type, map.is_visible_to_players ? "pubblica" : "privata"],
    created_by: map.created_by ?? null,
    created_at: map.updated_at ?? map.created_at
  }));
  derivedAssets.push(...mapAssets);

  for (const track of state.audioTracks) {
    if (!track.audio_url) continue;
    derivedAssets.push({
      id: `audio:${track.id}`,
      room_id: track.room_id,
      title: track.title,
      asset_type: "audio",
      url: track.audio_url,
      tags: ["traccia", track.loop ? "loop" : "no-loop"],
      created_by: null,
      created_at: ""
    });
  }

  for (const effect of state.soundEffects) {
    if (!effect.audio_url) continue;
    derivedAssets.push({
      id: `sound:${effect.id}`,
      room_id: effect.room_id,
      title: effect.title,
      asset_type: "sound",
      url: effect.audio_url,
      tags: ["soundbar", effect.loop ? "loop" : "one-shot"],
      created_by: null,
      created_at: effect.created_at ?? ""
    });
  }

  const seen = new Set<string>();
  return [...derivedAssets, ...state.mediaAssets]
    .filter((asset) => {
      const key = `${asset.asset_type}:${asset.url}`;
      if (!asset.url || seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .sort((a, b) => String(b.created_at ?? "").localeCompare(String(a.created_at ?? "")));
}

function SceneManager({
  state,
  onSceneChange,
  onCreateScene,
  onDeleteScene
}: {
  state: RoomState;
  onSceneChange: (scene: Scene) => void;
  onCreateScene: (values: {
    title: string;
    description: string;
    imageUrl: string;
    imageFile?: File;
    mediaType?: SceneMediaType;
    videoUrl?: string;
    videoFile?: File;
    loopVideo?: boolean;
    visibility?: SceneVisibility;
    visibleUserIds?: string[];
    linkedAudioId?: string | null;
  }) => void | Promise<void>;
  onDeleteScene: (scene: Scene) => void | Promise<void>;
}) {
  const [title, setTitle] = useState("");
  const [mediaType, setMediaType] = useState<SceneMediaType>("image");
  const [imageUrl, setImageUrl] = useState("");
  const [videoUrl, setVideoUrl] = useState("");
  const [imageFile, setImageFile] = useState<File | undefined>();
  const [videoFile, setVideoFile] = useState<File | undefined>();
  const [loopVideo, setLoopVideo] = useState(true);
  const [visibility, setVisibility] = useState<SceneVisibility>("public");
  const [visibleUserIds, setVisibleUserIds] = useState<string[]>([]);
  const [linkedAudioId, setLinkedAudioId] = useState("");
  const [description, setDescription] = useState("");

  function toggleVisibleUser(userId: string) {
    setVisibleUserIds((ids) => (ids.includes(userId) ? ids.filter((id) => id !== userId) : [...ids, userId]));
  }

  return (
    <section className="director-tool-panel glass-panel rounded-lg p-4">
      <ToolHeading icon={<ImageUp size={17} />} eyebrow="Archivio visivo" title="Scene" detail="Prepara luoghi, indizi, video e rivelazioni private." />
      <div className="mt-4 grid gap-4 xl:grid-cols-[minmax(0,1fr)_24rem]">
        <div className="director-scene-grid">
          {state.scenes.map((scene) => (
            <article key={scene.id} className={`director-scene-card ${scene.id === state.scene.id ? "is-current" : ""}`}>
              {scene.media_type === "video" ? (
                <div className="director-scene-thumb flex items-center justify-center bg-black/50 text-brass">
                  <Film size={18} />
                </div>
              ) : (
                <div className="director-scene-thumb bg-cover bg-center" style={{ backgroundImage: `url(${scene.image_url})` }} />
              )}
              <button type="button" onClick={() => onSceneChange(scene)} className="director-scene-select">
                <span className="block truncate font-serif text-base text-white">
                  {scene.title}
                  {scene.visibility === "private" ? <span className="ml-2 text-xs font-normal text-ember-100">Privata</span> : null}
                </span>
                <span className="line-clamp-2 text-xs leading-5 text-stone-400">{scene.description || "Nessuna descrizione."}</span>
                {scene.linked_audio_id ? (
                  <span className="mt-2 block text-xs text-brass">
                    Audio: {state.audioTracks.find((track) => track.id === scene.linked_audio_id)?.title ?? "traccia collegata"}
                  </span>
                ) : null}
                {scene.id === state.scene.id ? <span className="director-live-chip mt-2">In scena ora</span> : null}
              </button>
              <button
                type="button"
                onClick={() => onDeleteScene(scene)}
                className="director-danger-icon"
                title={`Elimina scena ${scene.title}`}
                aria-label={`Elimina scena ${scene.title}`}
              >
                <Trash2 size={16} />
              </button>
            </article>
          ))}
          {!state.scenes.length ? <DirectorEmptyState title="Nessuna scena preparata" text="Crea la prima scena per iniziare a costruire il palcoscenico della sessione." /> : null}
        </div>
        <form
          className="director-create-panel grid content-start gap-2 rounded-lg p-3"
          onSubmit={(event) => {
            event.preventDefault();
            if (!title.trim()) return;
            onCreateScene({
              title: title.trim(),
              imageUrl: imageUrl.trim(),
              imageFile,
              description: description.trim(),
              mediaType,
              videoUrl: videoUrl.trim(),
              videoFile,
              loopVideo,
              visibility,
              visibleUserIds: visibility === "private" ? visibleUserIds : [],
              linkedAudioId: linkedAudioId || null
            });
            setTitle("");
            setImageUrl("");
            setVideoUrl("");
            setImageFile(undefined);
            setVideoFile(undefined);
            setLoopVideo(true);
            setVisibility("public");
            setVisibleUserIds([]);
            setLinkedAudioId("");
            setDescription("");
          }}
        >
          <p className="director-form-title">Nuova scena</p>
          <input className="field px-3 py-2 text-sm" placeholder="Titolo scena" value={title} onChange={(event) => setTitle(event.target.value)} />
          <select className="field px-3 py-2 text-sm" value={mediaType} onChange={(event) => setMediaType(event.target.value as SceneMediaType)}>
            <option value="image">Immagine 16:9</option>
            <option value="video">Video MP4 in scena</option>
          </select>
          <input className="field px-3 py-2 text-sm" placeholder="Link immagine 16:9" value={imageUrl} onChange={(event) => setImageUrl(event.target.value)} />
          <label className="director-upload-target">
            {imageFile ? imageFile.name : "Carica immagine 16:9"}
            <input className="sr-only" type="file" accept="image/*" onChange={(event) => setImageFile(event.target.files?.[0])} />
          </label>
          <input className="field px-3 py-2 text-sm" placeholder="Link video MP4 in loop" value={videoUrl} onChange={(event) => {
            setVideoUrl(event.target.value);
            if (event.target.value.trim()) setMediaType("video");
          }} />
          <label className="director-upload-target border-purple-400/35 bg-purple-500/10 text-purple-100">
            {videoFile ? videoFile.name : "Carica video MP4 in loop"}
            <input
              className="sr-only"
              type="file"
              accept="video/mp4,video/*"
              onChange={(event) => {
                setVideoFile(event.target.files?.[0]);
                if (event.target.files?.[0]) setMediaType("video");
              }}
            />
          </label>
          <label className="flex items-center gap-2 text-sm text-slate-200">
            <input type="checkbox" checked={loopVideo} onChange={(event) => setLoopVideo(event.target.checked)} />
            Ripeti video in loop
          </label>
          <select className="field px-3 py-2 text-sm" value={visibility} onChange={(event) => setVisibility(event.target.value as SceneVisibility)}>
            <option value="public">Scena pubblica</option>
            <option value="private">Scena privata</option>
          </select>
          <select className="field px-3 py-2 text-sm" value={linkedAudioId} onChange={(event) => setLinkedAudioId(event.target.value)}>
            <option value="">Nessuna traccia collegata</option>
            {state.audioTracks.map((track) => (
              <option key={track.id} value={track.id}>
                {track.title}
              </option>
            ))}
          </select>
          {visibility === "private" ? (
            <div className="director-sub-panel grid gap-2 rounded-lg p-2">
              <p className="text-xs uppercase tracking-[0.16em] text-slate-500">Visibile a</p>
              {state.characters.map((character) => (
                <label key={character.id} className="flex items-center justify-between gap-2 text-sm text-slate-200">
                  {character.character_name} {character.character_surname}
                  <input type="checkbox" checked={visibleUserIds.includes(character.user_id)} onChange={() => toggleVisibleUser(character.user_id)} />
                </label>
              ))}
            </div>
          ) : null}
          <textarea className="field min-h-24 resize-none px-3 py-2 text-sm" placeholder="Descrizione" value={description} onChange={(event) => setDescription(event.target.value)} />
          <button className="director-primary-action">
            <Plus size={16} /> Crea scena
          </button>
        </form>
      </div>
    </section>
  );
}

function ChatPermissionsPanel({ state, onUpdateChatPermissions }: { state: RoomState; onUpdateChatPermissions: (values: { chatEnabled: boolean; mutedUserIds: string[] }) => void | Promise<void> }) {
  const [chatEnabled, setChatEnabled] = useState(state.room.chat_enabled !== false);
  const [mutedUserIds, setMutedUserIds] = useState<string[]>(state.room.muted_user_ids ?? []);

  function toggleMuted(userId: string) {
    setMutedUserIds((ids) => (ids.includes(userId) ? ids.filter((id) => id !== userId) : [...ids, userId]));
  }

  return (
    <section className="glass-panel rounded-lg p-4">
      <h2 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.18em] text-brass">
        <MessageSquareText size={16} /> Permessi chat
      </h2>
      <label className="mt-4 flex items-center justify-between gap-3 rounded-lg border border-white/10 bg-white/[0.04] px-3 py-2 text-sm text-white">
        Chat comune giocatori
        <input type="checkbox" checked={chatEnabled} onChange={(event) => setChatEnabled(event.target.checked)} />
      </label>
      <div className="mt-3 grid gap-2">
        {state.characters.map((character) => (
          <label key={character.id} className="flex items-center justify-between gap-3 rounded-lg border border-white/10 bg-white/[0.04] px-3 py-2 text-sm text-slate-200">
            {character.character_name} {character.character_surname}
            <input type="checkbox" checked={!mutedUserIds.includes(character.user_id)} onChange={() => toggleMuted(character.user_id)} />
          </label>
        ))}
      </div>
      <button
        type="button"
        onClick={() => onUpdateChatPermissions({ chatEnabled, mutedUserIds })}
        className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-lg border border-emerald-400/25 bg-emerald-500/10 px-3 py-2 text-sm font-medium text-emerald-100 hover:bg-emerald-500/20"
      >
        Salva permessi chat
      </button>
    </section>
  );
}

function NpcPanel({
  state,
  onCreateNpc,
  onDeleteNpc
}: {
  state: RoomState;
  onCreateNpc: (values: { name: string; color: string; description: string; portraitUrl: string }) => void | Promise<void>;
  onDeleteNpc: (npc: Npc) => void | Promise<void>;
}) {
  const [name, setName] = useState("");
  const [color, setColor] = useState("#84cc16");
  const [portraitUrl, setPortraitUrl] = useState("");
  const [description, setDescription] = useState("");

  return (
    <section className="glass-panel rounded-lg p-4">
      <h2 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.18em] text-brass">
        <MessageSquareText size={16} /> NPC
      </h2>
      <form
        className="mt-4 grid gap-2 rounded-lg border border-white/10 bg-black/20 p-3"
        onSubmit={(event) => {
          event.preventDefault();
          if (!name.trim()) return;
          onCreateNpc({ name: name.trim(), color, description: description.trim(), portraitUrl: portraitUrl.trim() });
          setName("");
          setPortraitUrl("");
          setDescription("");
        }}
      >
        <input className="field px-3 py-2 text-sm" placeholder="Nome NPC" value={name} onChange={(event) => setName(event.target.value)} />
        <div className="grid gap-2 sm:grid-cols-[5rem_minmax(0,1fr)]">
          <input className="field h-10 px-2 py-1" aria-label="Colore NPC" type="color" value={color} onChange={(event) => setColor(event.target.value)} />
          <input
            className="field px-3 py-2 text-sm"
            placeholder="Link portrait NPC"
            value={portraitUrl}
            onChange={(event) => setPortraitUrl(event.target.value)}
          />
        </div>
        <textarea
          className="field min-h-20 resize-none px-3 py-2 text-sm"
          placeholder="Descrizione NPC"
          value={description}
          onChange={(event) => setDescription(event.target.value)}
        />
        <button className="inline-flex items-center justify-center gap-2 rounded-lg border border-ember-400/25 bg-ember-500/10 px-3 py-2 text-sm font-medium text-ember-100 hover:bg-ember-500/20">
          <Plus size={16} /> Crea NPC
        </button>
      </form>
      <div className="mt-4 grid gap-3">
        {state.npcs.map((npc) => (
          <article key={npc.id} className="grid grid-cols-[minmax(0,1fr)_2.5rem] gap-2 rounded-lg border border-white/10 bg-white/[0.04] p-3">
            <div className="min-w-0">
              <p className="text-sm font-semibold" style={{ color: npc.color }}>
                {npc.name}
              </p>
              <p className="mt-1 text-xs leading-5 text-slate-300">{npc.description}</p>
            </div>
            <button
              type="button"
              onClick={() => onDeleteNpc(npc)}
              className="flex h-10 w-10 items-center justify-center rounded-lg border border-rose-400/25 bg-rose-500/10 text-rose-100 hover:bg-rose-500/20"
              title={`Elimina NPC ${npc.name}`}
              aria-label={`Elimina NPC ${npc.name}`}
            >
              <Trash2 size={16} />
            </button>
          </article>
        ))}
      </div>
    </section>
  );
}

function AudioPanel({
  currentAudio,
  audioTracks,
  onAudioChange,
  expanded = false
}: {
  currentAudio: AudioTrack;
  audioTracks: AudioTrack[];
  onAudioChange: (track: AudioTrack) => void;
  expanded?: boolean;
}) {
  return (
    <section className="glass-panel rounded-lg p-4">
      <h2 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.18em] text-brass">
        <AudioLines size={16} /> Audio attuale
      </h2>
      <div className="mt-4 rounded-lg border border-white/10 bg-black/25 p-3">
        <p className="text-sm font-semibold text-stone-100">{currentAudio.title}</p>
        <p className="mt-1 text-xs text-stone-400">Il player resta attivo mentre cambi strumenti nella cabina di regia.</p>
      </div>
      {expanded ? (
        <div className="mt-4 grid gap-2">
          {audioTracks.map((track) => (
            <button
              key={track.id}
              type="button"
              onClick={() => onAudioChange(track)}
              className="rounded-lg border border-white/10 bg-white/[0.04] px-3 py-2 text-left text-sm text-white hover:border-ember-400/35 hover:bg-ember-500/10"
            >
              {track.title}
            </button>
          ))}
        </div>
      ) : null}
    </section>
  );
}

function AudioManager({
  currentAudio,
  audioTracks,
  onAudioChange,
  onCreateAudio,
  onDeleteAudio
}: {
  currentAudio: AudioTrack;
  audioTracks: AudioTrack[];
  onAudioChange: (track: AudioTrack) => void;
  onCreateAudio: (values: { title: string; audioUrl: string; loop: boolean; audioFile?: File }) => void | Promise<void>;
  onDeleteAudio: (track: AudioTrack) => void | Promise<void>;
}) {
  const [title, setTitle] = useState("");
  const [audioUrl, setAudioUrl] = useState("");
  const [audioFile, setAudioFile] = useState<File | undefined>();
  const [loop, setLoop] = useState(true);

  return (
    <section className="director-tool-panel glass-panel rounded-lg p-4">
      <ToolHeading icon={<AudioLines size={17} />} eyebrow="Atmosfera" title="Audio" detail="Scegli la traccia della scena e prepara nuove musiche ambientali." />
      <div className="mt-4 rounded-lg border border-white/10 bg-black/25 p-3">
        <p className="text-sm font-semibold text-stone-100">In riproduzione: {currentAudio.title}</p>
        <p className="mt-1 text-xs text-stone-400">La riproduzione e gestita dal player persistente in fondo alla cabina.</p>
      </div>
      <div className="mt-4 grid gap-4 xl:grid-cols-[minmax(0,1fr)_24rem]">
        <div className="director-audio-grid">
          {audioTracks.map((track) => (
            <article key={track.id} className={`director-audio-card ${track.id === currentAudio.id ? "is-current" : ""}`}>
              <button type="button" onClick={() => onAudioChange(track)} className="min-w-0 text-left">
                <span className="block truncate font-serif text-base text-white">{track.title}</span>
                <span className="mt-1 block text-xs text-stone-400">{track.loop ? "Loop continuo" : "Riproduzione singola"}</span>
                {track.id === currentAudio.id ? <span className="director-live-chip mt-3">In riproduzione</span> : null}
              </button>
              <button
                type="button"
                onClick={() => onDeleteAudio(track)}
                className="director-danger-icon"
                title={`Elimina traccia ${track.title}`}
                aria-label={`Elimina traccia ${track.title}`}
              >
                <Trash2 size={16} />
              </button>
            </article>
          ))}
          {!audioTracks.length ? <DirectorEmptyState title="Nessuna traccia audio" text="Aggiungi una musica ambientale per dare ritmo emotivo alla scena." /> : null}
        </div>
        <form
          className="director-create-panel grid content-start gap-2 rounded-lg p-3"
          onSubmit={(event) => {
            event.preventDefault();
            if (!title.trim()) return;
            onCreateAudio({ title: title.trim(), audioUrl: audioUrl.trim(), loop, audioFile });
            setTitle("");
            setAudioUrl("");
            setAudioFile(undefined);
            setLoop(true);
          }}
        >
          <p className="director-form-title">Nuova traccia</p>
          <input className="field px-3 py-2 text-sm" placeholder="Titolo traccia" value={title} onChange={(event) => setTitle(event.target.value)} />
          <input className="field px-3 py-2 text-sm" placeholder="Link audio" value={audioUrl} onChange={(event) => setAudioUrl(event.target.value)} />
          <label className="director-upload-target">
            Carica audio
            <input className="sr-only" type="file" accept="audio/*" onChange={(event) => setAudioFile(event.target.files?.[0])} />
          </label>
          <label className="flex items-center gap-2 text-sm text-slate-200">
            <input type="checkbox" checked={loop} onChange={(event) => setLoop(event.target.checked)} />
            Ripeti in loop
          </label>
          <button className="director-primary-action">
            <Plus size={16} /> Crea traccia
          </button>
        </form>
      </div>
    </section>
  );
}

function SoundbarModal({
  soundEffects,
  currentSoundEffectId,
  onClose,
  onCreateSoundEffect,
  onDeleteSoundEffect,
  onTriggerSoundEffect,
  onStopSoundEffect
}: {
  soundEffects: SoundEffect[];
  currentSoundEffectId: string | null;
  onClose: () => void;
  onCreateSoundEffect: (values: { title: string; audioUrl: string; loop: boolean; audioFile?: File }) => void | Promise<void>;
  onDeleteSoundEffect: (effect: SoundEffect) => void | Promise<void>;
  onTriggerSoundEffect: (effect: SoundEffect) => void | Promise<void>;
  onStopSoundEffect: () => void | Promise<void>;
}) {
  const [soundTitle, setSoundTitle] = useState("");
  const [soundUrl, setSoundUrl] = useState("");
  const [soundFile, setSoundFile] = useState<File | undefined>();
  const [soundLoop, setSoundLoop] = useState(false);

  return (
    <div className="soundbar-backdrop fixed inset-0 z-50 grid place-items-center bg-black/70 px-4 py-6 backdrop-blur-sm">
      <section className="soundbar-modal glass-panel max-h-[90vh] w-full max-w-4xl overflow-y-auto rounded-lg p-4 shadow-2xl shadow-black/40">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-[0.18em] text-brass">Console ambiente</p>
            <h2 className="mt-1 flex items-center gap-2 font-serif text-2xl text-white">
              <Volume2 size={20} /> Soundbar rumori
            </h2>
            <p className="mt-1 text-sm text-slate-300">Avvia effetti ambientali separati dalla musica principale della scena.</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-10 w-10 items-center justify-center rounded-lg border border-white/10 bg-white/[0.04] text-slate-200 hover:bg-white/[0.08]"
            title="Chiudi soundbar"
            aria-label="Chiudi soundbar"
          >
            <X size={18} />
          </button>
        </div>

        <div className="soundbar-pad-grid mt-5">
          {soundEffects.map((effect) => (
            <span key={effect.id} className={`soundbar-pad ${effect.id === currentSoundEffectId ? "is-active" : ""}`}>
              <button type="button" onClick={() => onTriggerSoundEffect(effect)}>
                <Volume2 size={17} />
                {effect.title}
              </button>
              <button
                type="button"
                onClick={() => onDeleteSoundEffect(effect)}
                className="soundbar-pad-delete"
                title={`Elimina rumore ${effect.title}`}
                aria-label={`Elimina rumore ${effect.title}`}
              >
                <Trash2 size={14} />
              </button>
            </span>
          ))}
          {!soundEffects.length ? <DirectorEmptyState title="Nessun rumore salvato" text="Aggiungi pioggia, vento, porte, fuoco o presenze per dare vita alla stanza." /> : null}
          <button
            type="button"
            onClick={onStopSoundEffect}
            className="soundbar-stop-button"
          >
            <Square size={14} /> Stop rumore
          </button>
        </div>

        <form
          className="director-create-panel mt-5 grid gap-2 rounded-lg p-3"
          onSubmit={(event) => {
            event.preventDefault();
            if (!soundTitle.trim()) return;
            onCreateSoundEffect({ title: soundTitle.trim(), audioUrl: soundUrl.trim(), loop: soundLoop, audioFile: soundFile });
            setSoundTitle("");
            setSoundUrl("");
            setSoundFile(undefined);
            setSoundLoop(false);
          }}
        >
          <div className="grid gap-2 sm:grid-cols-2">
            <input className="field px-3 py-2 text-sm" placeholder="Nome rumore" value={soundTitle} onChange={(event) => setSoundTitle(event.target.value)} />
            <input className="field px-3 py-2 text-sm" placeholder="Link audio rumore" value={soundUrl} onChange={(event) => setSoundUrl(event.target.value)} />
          </div>
          <label className="director-upload-target">
            Carica rumore
            <input className="sr-only" type="file" accept="audio/*" onChange={(event) => setSoundFile(event.target.files?.[0])} />
          </label>
          <label className="flex items-center gap-2 text-sm text-slate-200">
            <input type="checkbox" checked={soundLoop} onChange={(event) => setSoundLoop(event.target.checked)} />
            Loop rumore
          </label>
          <button className="director-primary-action">
            <Plus size={16} /> Aggiungi alla soundbar
          </button>
        </form>
      </section>
    </div>
  );
}

function MediaLibraryPanel({
  assets,
  onCreate,
  onDelete
}: {
  assets: MediaAsset[];
  onCreate: (values: { title: string; assetType: MediaAsset["asset_type"]; url: string; tags: string[]; file?: File }) => void | Promise<void>;
  onDelete: (asset: MediaAsset) => void | Promise<void>;
}) {
  const [title, setTitle] = useState("");
  const [assetType, setAssetType] = useState<MediaAsset["asset_type"]>("image");
  const [url, setUrl] = useState("");
  const [tags, setTags] = useState("");
  const [file, setFile] = useState<File | undefined>();
  const [query, setQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState<MediaAsset["asset_type"] | "all">("all");
  const visibleAssets = assets.filter((asset) => {
    if (typeFilter !== "all" && asset.asset_type !== typeFilter) return false;
    return `${asset.title} ${asset.asset_type} ${(asset.tags ?? []).join(" ")}`.toLowerCase().includes(query.toLowerCase());
  });
  const mediaTypes: Array<MediaAsset["asset_type"] | "all"> = ["all", "image", "video", "map", "audio", "sound", "portrait", "object"];

  return (
    <section className="glass-panel rounded-lg p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.18em] text-brass">
          <Library size={16} /> Libreria media
        </h2>
        <input className="field max-w-xs px-3 py-2 text-sm" placeholder="Cerca asset..." value={query} onChange={(event) => setQuery(event.target.value)} />
      </div>
      <div className="director-media-filterbar mt-4">
        {mediaTypes.map((type) => {
          const count = type === "all" ? assets.length : assets.filter((asset) => asset.asset_type === type).length;
          return (
            <button key={type} type="button" className={typeFilter === type ? "is-active" : ""} onClick={() => setTypeFilter(type)}>
              <span>{type === "all" ? "Tutti" : type}</span>
              <small>{count}</small>
            </button>
          );
        })}
      </div>
      <div className="mt-4 grid gap-4 xl:grid-cols-[minmax(0,1fr)_22rem]">
        <div className="director-media-grid grid content-start gap-3 md:grid-cols-2">
          {visibleAssets.map((asset) => (
            <article key={asset.id} className={`director-media-card director-media-card--${asset.asset_type}`}>
              <div className="aspect-video overflow-hidden rounded-md bg-black/40">
                {asset.asset_type === "image" || asset.asset_type === "portrait" || asset.asset_type === "object" || asset.asset_type === "map" ? (
                  <div className="h-full bg-cover bg-center" style={{ backgroundImage: `url(${asset.url})` }} />
                ) : asset.asset_type === "video" ? (
                  <video className="h-full w-full object-cover" src={asset.url} muted playsInline />
                ) : (
                  <div className="flex h-full items-center justify-center text-brass">
                    <AudioLines size={28} />
                  </div>
                )}
              </div>
              <div className="mt-3 flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-white">{asset.title}</p>
                  <p className="text-xs uppercase tracking-[0.14em] text-slate-500">{asset.asset_type}</p>
                </div>
                <button type="button" onClick={() => onDelete(asset)} className="text-rose-200 hover:text-rose-100" title="Elimina asset" aria-label="Elimina asset">
                  <Trash2 size={16} />
                </button>
              </div>
              <div className="mt-2 flex flex-wrap gap-1">
                {(asset.tags ?? []).map((tag) => (
                  <span key={tag} className="rounded-md bg-brass/10 px-2 py-1 text-xs text-brass">
                    {tag}
                  </span>
                ))}
              </div>
            </article>
          ))}
          {!visibleAssets.length ? <p className="text-sm text-slate-400">Nessun asset trovato.</p> : null}
        </div>
        <form
          className="grid content-start gap-2 rounded-lg border border-white/10 bg-black/20 p-3"
          onSubmit={(event) => {
            event.preventDefault();
            if (!title.trim()) return;
            onCreate({
              title: title.trim(),
              assetType,
              url: url.trim(),
              tags: tags.split(",").map((tag) => tag.trim()).filter(Boolean),
              file
            });
            setTitle("");
            setUrl("");
            setTags("");
            setFile(undefined);
          }}
        >
          <input className="field px-3 py-2 text-sm" placeholder="Titolo asset" value={title} onChange={(event) => setTitle(event.target.value)} />
          <select className="field px-3 py-2 text-sm" value={assetType} onChange={(event) => setAssetType(event.target.value as MediaAsset["asset_type"])}>
            <option value="image">Immagine scena</option>
            <option value="video">Video scena</option>
            <option value="map">Mappa</option>
            <option value="audio">Musica</option>
            <option value="sound">Rumore</option>
            <option value="portrait">Portrait</option>
            <option value="object">Oggetto</option>
          </select>
          <input className="field px-3 py-2 text-sm" placeholder="Link asset" value={url} onChange={(event) => setUrl(event.target.value)} />
          <input className="field px-3 py-2 text-sm" placeholder="Tag separati da virgola" value={tags} onChange={(event) => setTags(event.target.value)} />
          <label className="block rounded-lg border border-dashed border-brass/30 bg-brass/5 px-3 py-3 text-center text-xs text-brass">
            Carica file
            <input className="sr-only" type="file" onChange={(event) => setFile(event.target.files?.[0])} />
          </label>
          <button className="inline-flex items-center justify-center gap-2 rounded-lg border border-ember-400/25 bg-ember-500/10 px-3 py-2 text-sm font-medium text-ember-100 hover:bg-ember-500/20">
            <Plus size={16} /> Salva asset
          </button>
        </form>
      </div>
    </section>
  );
}

function PlayersManager({
  state,
  onUpdateCharacter
}: {
  state: RoomState;
  onUpdateCharacter: (
    characterId: string,
    values: { characterName: string; characterSurname: string; portraitUrl: string; portraitFile?: File; color: string; hp: number; mentalState: string; visibleStatus: string; publicBackground: string; conditions: string }
  ) => void | Promise<void>;
}) {
  const [selectedId, setSelectedId] = useState(state.characters[0]?.id ?? "");
  const selected = state.characters.find((character) => character.id === selectedId) ?? state.characters[0];
  const [draft, setDraft] = useState(() => characterDraft(selected));
  const [portraitFile, setPortraitFile] = useState<File | undefined>();

  function selectCharacter(id: string) {
    const next = state.characters.find((character) => character.id === id);
    setSelectedId(id);
    setDraft(characterDraft(next));
    setPortraitFile(undefined);
  }

  if (!selected) {
    return (
      <section className="glass-panel rounded-lg p-4 text-sm text-slate-300">
        Nessun giocatore nella stanza.
      </section>
    );
  }

  return (
    <section className="director-tool-panel glass-panel rounded-lg p-4">
      <ToolHeading icon={<UsersRound size={17} />} eyebrow="Cast della sessione" title="Giocatori" detail="Aggiorna stati, ferite, condizioni e informazioni pubbliche dei personaggi." />
      <div className="mt-4 grid gap-4 xl:grid-cols-[16rem_minmax(0,1fr)]">
        <div className="grid content-start gap-2">
          {state.characters.map((character) => (
            <button
              key={character.id}
              type="button"
              onClick={() => selectCharacter(character.id)}
              className={`director-character-selector ${character.id === selected.id ? "is-active" : ""}`}
            >
              <span className="h-10 w-10 shrink-0 rounded-lg bg-cover bg-center" style={{ backgroundImage: `url(${character.portrait_url})` }} />
              <span className="min-w-0">
                <span className="block truncate text-sm font-semibold" style={{ color: character.color }}>
                  {character.character_name} {character.character_surname}
                </span>
                <span className="text-xs text-slate-400">PF {character.hp} · {character.visible_status}</span>
              </span>
            </button>
          ))}
        </div>
        <form
          className="director-create-panel grid gap-3 rounded-lg p-3"
          onSubmit={(event) => {
            event.preventDefault();
            onUpdateCharacter(selected.id, { ...draft, portraitFile });
            setPortraitFile(undefined);
          }}
        >
          <div className="director-character-dossier">
            <div className="h-24 w-24 shrink-0 rounded-xl bg-cover bg-center" style={{ backgroundImage: `url(${draft.portraitUrl})` }} />
            <div className="min-w-0">
              <p className="director-form-title">Dossier personaggio</p>
              <h3 className="truncate font-serif text-2xl text-white" style={{ color: draft.color }}>{draft.characterName || "Nome"} {draft.characterSurname}</h3>
              <p className="mt-1 text-sm text-stone-400">PF {draft.hp} · {draft.mentalState || "Stabile"} · {draft.visibleStatus || "stabile"}</p>
            </div>
          </div>
          <div className="grid gap-2 sm:grid-cols-2">
            <input className="field px-3 py-2 text-sm" placeholder="Nome" value={draft.characterName} onChange={(event) => setDraft({ ...draft, characterName: event.target.value })} />
            <input className="field px-3 py-2 text-sm" placeholder="Cognome" value={draft.characterSurname} onChange={(event) => setDraft({ ...draft, characterSurname: event.target.value })} />
          </div>
          <div className="grid gap-2 sm:grid-cols-[5rem_minmax(0,1fr)_7rem]">
            <input className="field h-10 px-2 py-1" aria-label="Colore personaggio" type="color" value={draft.color} onChange={(event) => setDraft({ ...draft, color: event.target.value })} />
            <input className="field px-3 py-2 text-sm" placeholder="Link portrait" value={draft.portraitUrl} onChange={(event) => setDraft({ ...draft, portraitUrl: event.target.value })} />
            <input className="field px-3 py-2 text-sm" type="number" value={draft.hp} onChange={(event) => setDraft({ ...draft, hp: Number(event.target.value) })} />
          </div>
          <button type="button" className="director-secondary-action" onClick={() => setDraft({ ...draft, portraitUrl: "" })}>
            Rimuovi portrait
          </button>
          <label className="director-upload-target">
            Carica nuovo portrait
            <input className="sr-only" type="file" accept="image/*" onChange={(event) => setPortraitFile(event.target.files?.[0])} />
          </label>
          <div className="grid gap-2 sm:grid-cols-2">
            <input className="field px-3 py-2 text-sm" placeholder="Stato mentale" value={draft.mentalState} onChange={(event) => setDraft({ ...draft, mentalState: event.target.value })} />
            <input className="field px-3 py-2 text-sm" placeholder="Stato visibile" value={draft.visibleStatus} onChange={(event) => setDraft({ ...draft, visibleStatus: event.target.value })} />
          </div>
          <input className="field px-3 py-2 text-sm" placeholder="Condizioni con icone, separate da virgola" value={draft.conditions} onChange={(event) => setDraft({ ...draft, conditions: event.target.value })} />
          <textarea className="field min-h-24 resize-none px-3 py-2 text-sm" placeholder="Background pubblico" value={draft.publicBackground} onChange={(event) => setDraft({ ...draft, publicBackground: event.target.value })} />
          <button className="director-save-action">
            Salva giocatore
          </button>
        </form>
      </div>
    </section>
  );
}

function characterDraft(character?: RoomState["characters"][number]) {
  return {
    characterName: character?.character_name ?? "",
    characterSurname: character?.character_surname ?? "",
    portraitUrl: character?.portrait_url ?? "",
    color: character?.color ?? "#f59e0b",
    hp: character?.hp ?? 10,
    mentalState: character?.mental_state ?? "Stabile",
    visibleStatus: character?.visible_status ?? "stabile",
    publicBackground: character?.public_background ?? "",
    conditions: (character?.conditions ?? []).join(", ")
  };
}

function InventoryPanel({
  state,
  onCreateInventoryItem,
  onDeleteInventoryItem
}: {
  state: RoomState;
  onCreateInventoryItem: (characterId: string, values: { name: string; description: string; quantity: number; imageUrl: string; isPublic: boolean; masterNotes: string }) => void | Promise<void>;
  onDeleteInventoryItem: (item: InventoryItem) => void | Promise<void>;
}) {
  const [characterId, setCharacterId] = useState(state.characters[0]?.id ?? "");
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [isPublic, setIsPublic] = useState(false);
  const [masterNotes, setMasterNotes] = useState("");
  const selectedCharacter = state.characters.find((character) => character.id === characterId) ?? state.characters[0];
  const visibleInventory = selectedCharacter ? state.inventory.filter((item) => item.character_id === selectedCharacter.id) : [];

  return (
    <section className="director-tool-panel glass-panel rounded-lg p-4">
      <ToolHeading icon={<Shield size={17} />} eyebrow="Oggetti di scena" title="Inventari" detail="Assegna oggetti, decidi cosa e pubblico e conserva note riservate da Master." />
      <form
        className="director-create-panel mt-4 grid gap-2 rounded-lg p-3"
        onSubmit={(event) => {
          event.preventDefault();
          if (!selectedCharacter || !name.trim()) return;
          onCreateInventoryItem(selectedCharacter.id, {
            name: name.trim(),
            description: description.trim(),
            quantity,
            imageUrl: imageUrl.trim(),
            isPublic,
            masterNotes: masterNotes.trim()
          });
          setName("");
          setDescription("");
          setImageUrl("");
          setQuantity(1);
          setIsPublic(false);
          setMasterNotes("");
        }}
      >
        <p className="director-form-title">Assegna oggetto</p>
        <select className="field px-3 py-2 text-sm" value={selectedCharacter?.id ?? ""} onChange={(event) => setCharacterId(event.target.value)}>
          {state.characters.map((character) => (
            <option key={character.id} value={character.id}>
              {character.character_name} {character.character_surname}
            </option>
          ))}
        </select>
        <div className="grid gap-2 sm:grid-cols-[minmax(0,1fr)_7rem]">
          <input className="field px-3 py-2 text-sm" placeholder="Nome oggetto" value={name} onChange={(event) => setName(event.target.value)} />
          <input
            className="field px-3 py-2 text-sm"
            aria-label="Quantita oggetto"
            type="number"
            min="1"
            value={quantity}
            onChange={(event) => setQuantity(Math.max(1, Number(event.target.value)))}
          />
        </div>
        <textarea
          className="field min-h-20 resize-none px-3 py-2 text-sm"
          placeholder="Descrizione oggetto"
          value={description}
          onChange={(event) => setDescription(event.target.value)}
        />
        <input className="field px-3 py-2 text-sm" placeholder="Link immagine oggetto" value={imageUrl} onChange={(event) => setImageUrl(event.target.value)} />
        <textarea
          className="field min-h-16 resize-none px-3 py-2 text-sm"
          placeholder="Note Master"
          value={masterNotes}
          onChange={(event) => setMasterNotes(event.target.value)}
        />
        <label className="flex items-center gap-2 text-sm text-slate-200">
          <input type="checkbox" checked={isPublic} onChange={(event) => setIsPublic(event.target.checked)} />
          Visibile pubblicamente
        </label>
        <button className="director-primary-action">
          <Plus size={16} /> Aggiungi oggetto
        </button>
      </form>
      <div className="mt-4 grid gap-3 md:grid-cols-2">
        {visibleInventory.map((item) => (
          <article key={item.id} className={`director-inventory-card ${item.is_public ? "is-public" : ""}`}>
            {item.image_url ? <div className="director-inventory-thumb" style={{ backgroundImage: `url(${item.image_url})` }} /> : null}
            <div className="min-w-0">
              <p className="font-serif text-base text-white">
                {item.name} <span className="text-xs text-slate-400">x{item.quantity}</span>
              </p>
              <p className="mt-1 text-xs leading-5 text-slate-300">{item.description}</p>
              <p className="mt-2 inline-flex rounded-md border border-white/10 bg-black/20 px-2 py-1 text-xs text-slate-300">{item.is_public ? "Pubblico" : "Privato"}</p>
            </div>
            <button
              type="button"
              onClick={() => onDeleteInventoryItem(item)}
              className="director-danger-icon"
              title={`Rimuovi ${item.name}`}
              aria-label={`Rimuovi ${item.name}`}
            >
              <Trash2 size={16} />
            </button>
          </article>
        ))}
        {!visibleInventory.length ? <DirectorEmptyState title="Inventario vuoto" text="Questo personaggio non ha ancora oggetti assegnati." /> : null}
      </div>
    </section>
  );
}

function ReadOnlyChat({
  state,
  messages,
  privateCount,
  value,
  onChange,
  onSend,
  onDeleteMessage
}: {
  state: RoomState;
  messages: RoomState["messages"];
  privateCount: number;
  value: string;
  onChange: (value: string) => void;
  onSend: () => void;
  onDeleteMessage?: (message: Message) => void;
}) {
  return (
    <section className="director-live-chat glass-panel min-h-[27rem] rounded-lg p-4">
      <div className="flex items-center justify-between gap-3">
        <h2 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.18em] text-brass">
          <MessageSquareText size={16} /> Chat live
        </h2>
        <span className="rounded-md border border-brass/20 bg-brass/10 px-2 py-1 text-xs text-brass">{messages.length} messaggi</span>
      </div>
      <div className="director-live-chat-list scrollbar-soft mt-4 space-y-3 overflow-y-auto pr-1">
        {messages.slice(-10).map((message) => {
          const avatar = resolveMessageAvatar(state, message);

          return (
            <article key={message.id} className="director-live-message">
              <div
                className="director-live-avatar"
                style={avatar.url ? { backgroundImage: `url(${avatar.url})`, color: message.sender_color } : { color: message.sender_color }}
                aria-hidden="true"
              >
                {avatar.url ? "" : avatar.fallback}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2">
                  <p className="truncate text-sm font-semibold" style={{ color: message.sender_color }}>
                    {message.sender_display_name}
                  </p>
                  {onDeleteMessage ? (
                    <button type="button" onClick={() => onDeleteMessage(message)} className="text-rose-200 hover:text-rose-100" title="Elimina messaggio" aria-label="Elimina messaggio">
                      <Trash2 size={14} />
                    </button>
                  ) : null}
                </div>
                <p className="mt-1 whitespace-pre-wrap text-sm leading-6 text-white">&quot;{message.content}&quot;</p>
              </div>
            </article>
          );
        })}
        {!messages.length ? (
          <p className="rounded-lg border border-white/10 bg-black/20 px-3 py-6 text-center text-sm text-stone-400">La chat live apparira qui durante la sessione.</p>
        ) : null}
      </div>
      <p className="mt-3 text-xs text-slate-400">{privateCount} messaggi privati nella cronologia Master.</p>
      <form
        className="director-live-composer mt-4 flex gap-2"
        onSubmit={(event) => {
          event.preventDefault();
          onSend();
        }}
      >
        <textarea
          className="field min-h-12 flex-1 resize-none px-3 py-3 text-sm"
          placeholder="Scrivi messaggio pubblico..."
          value={value}
          onChange={(event) => onChange(event.target.value)}
          onKeyDown={(event) => {
            if (event.key !== "Enter" || event.shiftKey) return;
            event.preventDefault();
            onSend();
          }}
        />
        <button type="submit" className="inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-ember-500 text-ink-900 transition hover:bg-ember-400" aria-label="Invia messaggio" title="Invia messaggio">
          <MessageSquareText size={18} />
        </button>
      </form>
    </section>
  );
}

function resolveMessageAvatar(state: RoomState, message: Message) {
  if (message.sender_type === "npc" && message.npc_id) {
    const npc = state.npcs.find((item) => item.id === message.npc_id);
    return { url: npc?.portrait_url ?? "", fallback: npc?.name.slice(0, 1).toUpperCase() ?? "N" };
  }

  if (message.sender_type === "player" && message.sender_user_id) {
    const character = state.characters.find((item) => item.user_id === message.sender_user_id);
    return {
      url: character?.portrait_url ?? "",
      fallback: (character?.character_name ?? message.sender_display_name).slice(0, 1).toUpperCase()
    };
  }

  return { url: "", fallback: "M" };
}
