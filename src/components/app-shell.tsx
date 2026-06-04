"use client";

import { useEffect, useMemo, useState } from "react";
import { AlertTriangle, CheckCircle2, Loader2, LogOut, Sparkles } from "lucide-react";
import { CampaignLobby } from "@/components/campaign-lobby";
import { CharacterSetupForm, type CharacterSetupValues } from "@/components/lobby/character-setup-form";
import { CreateGameForm, type CreateGameValues } from "@/components/lobby/create-game-form";
import { JoinRoomForm, type JoinMode } from "@/components/lobby/join-room-form";
import { StartMenu } from "@/components/lobby/start-menu";
import { MasterControlRoom } from "@/components/master-control-room";
import { PlayerRoom } from "@/components/player-room";
import { SuperAdminRooms } from "@/components/superadmin-rooms";
import { demoRoomState } from "@/lib/demo-data";
import { createClient, demoMode } from "@/lib/supabase/client";
import {
  createGameInSupabase,
  createAudioTrack,
  createDiceRequest,
  createInventoryItem,
  createMediaAsset,
  createPlayerNote,
  createOrUpdateCharacter,
  createNpc,
  createScene,
  createSoundEffect,
  deleteAudioTrack,
  deleteInventoryItem,
  deleteMediaAsset,
  deleteMessage,
  deleteNpc,
  deleteScene,
  deleteRoom,
  deleteRoomBySuperAdmin,
  deleteMediaBySuperAdmin,
  deleteSoundEffect,
  enterMasterRoomByCode,
  ensureProfile,
  insertMessage,
  joinRoomByCode,
  listAllRoomsForSuperAdmin,
  listAllMediaForSuperAdmin,
  exportRoomMessages,
  loadInitialRoomState,
  loadOlderRoomMessages,
  loadRoomState,
  profileFromUser,
  rollDiceRequest,
  triggerRoomSoundEffect,
  removePresence,
  upsertPresence,
  updateCurrentAudio,
  updateCurrentScene,
  updateCharacterByMaster,
  updateRoomChatPermissions,
  updateRoomSpotlight,
  updateMessageContent,
  updateMessagePinned,
  updateRoomBySuperAdmin,
  uploadPublicFile
} from "@/lib/supabase/room-service";
import type { AdminMediaOverview, AdminRoomOverview } from "@/lib/supabase/room-service";
import type { AudioTrack, DiceRequest, InventoryItem, MediaAsset, Message, Npc, Room, RoomState, Scene, SceneMediaType, SceneVisibility, SoundEffect } from "@/lib/types";

type View = "menu" | "create" | "join" | "character" | "player" | "master" | "superadmin";

export function AppShell() {
  const [view, setView] = useState<View>("menu");
  const [roomState, setRoomState] = useState<RoomState>(demoRoomState);
  const [identityId, setIdentityId] = useState("master");
  const [status, setStatus] = useState("Caricamento dati...");
  const [isLoading, setIsLoading] = useState(!demoMode);
  const [error, setError] = useState("");
  const [pendingPlayerRoom, setPendingPlayerRoom] = useState<RoomState | null>(null);
  const [actionLog, setActionLog] = useState<{ id: string; label: string; detail?: string; created_at: string }[]>([]);
  const [adminRooms, setAdminRooms] = useState<AdminRoomOverview[]>([]);
  const [adminMedia, setAdminMedia] = useState<AdminMediaOverview[]>([]);
  const supabase = createClient();
  const currentAudio = useMemo(
    () => roomState.audioTracks.find((track) => track.id === roomState.room.current_audio_id) ?? roomState.audioTracks[0],
    [roomState.audioTracks, roomState.room.current_audio_id]
  );
  const currentCharacter =
    roomState.characters.find((character) => character.user_id === roomState.profile.id) ?? roomState.characters[0];
  const isCurrentMaster = roomState.profile.role === "master";
  const isCurrentPlayer = roomState.profile.role === "player";
  const hasCurrentSession = demoMode || roomState.room.id !== demoRoomState.room.id;
  const isSuperAdmin = roomState.profile.email.toLowerCase() === "galandar@gmail.com";

  function logAction(label: string, detail?: string) {
    setActionLog((items) => [{ id: crypto.randomUUID(), label, detail, created_at: new Date().toISOString() }, ...items].slice(0, 12));
  }

  useEffect(() => {
    if (!supabase || demoMode) {
      setIsLoading(false);
      setStatus("Modalita demo locale");
      return;
    }

    let active = true;

    async function load() {
      try {
        setError("");
        const { data } = await withClientTimeout(
          supabase!.auth.getUser(),
          6000,
          "Supabase non ha risposto in tempo durante il controllo sessione. Puoi comunque usare il menu e riprovare."
        );
        if (!data.user) {
          setIsLoading(false);
          return;
        }

        let profile = profileFromUser(data.user);

        try {
          profile = await ensureProfile(supabase!, data.user);
        } catch (profileError) {
          setError(
            `Login riuscito, ma il profilo pubblico non e stato creato. Esegui lo schema SQL aggiornato in Supabase. Dettaglio: ${readError(profileError)}`
          );
        }

        const initialState = await withClientTimeout(
          loadInitialRoomState(supabase!, profile),
          8000,
          "Supabase non ha risposto in tempo durante il caricamento stanza. Puoi creare o entrare in una stanza dal menu."
        );

        if (!active) return;

        setRoomState(initialState ?? { ...demoRoomState, profile, campaigns: [demoRoomState.campaigns[0]] });
        setStatus(initialState ? "Connesso a Supabase" : "Connesso: crea una partita o entra con codice");
      } catch (loadError) {
        setError(readError(loadError));
      } finally {
        if (active) setIsLoading(false);
      }
    }

    load();

    return () => {
      active = false;
    };
  }, [supabase]);

  useEffect(() => {
    if (!supabase || demoMode || !hasCurrentSession || !roomState.room.id) return;

    const channel = supabase
      .channel(`room-${roomState.room.id}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "messages", filter: `room_id=eq.${roomState.room.id}` },
        (payload) => {
          const message = payload.new as Message;
          setRoomState((state) => {
            const target = message.is_private ? state.privateMessages : message.channel === "off" ? state.offMessages : state.messages;
            if (target.some((item) => item.id === message.id)) return state;

            if (message.is_private) return { ...state, privateMessages: [...state.privateMessages, message] };
            if (message.channel === "off") return { ...state, offMessages: [...state.offMessages, message] };
            return { ...state, messages: [...state.messages, message] };
          });
        }
      )
      .on(
        "postgres_changes",
        { event: "DELETE", schema: "public", table: "messages", filter: `room_id=eq.${roomState.room.id}` },
        (payload) => {
          const deleted = payload.old as Message;
          setRoomState((state) => ({
            ...state,
            messages: state.messages.filter((item) => item.id !== deleted.id),
            offMessages: state.offMessages.filter((item) => item.id !== deleted.id),
            privateMessages: state.privateMessages.filter((item) => item.id !== deleted.id)
          }));
        }
      )
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "messages", filter: `room_id=eq.${roomState.room.id}` },
        (payload) => {
          const updated = payload.new as Message;
          setRoomState((state) => updateMessageInState(state, updated));
        }
      )
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "rooms", filter: `id=eq.${roomState.room.id}` },
        (payload) => {
          const room = payload.new as Room;
          setRoomState((state) => ({
            ...state,
            room,
            scene: state.scenes.find((scene) => scene.id === room.current_scene_id) ?? state.scene
          }));
        }
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "dice_requests", filter: `room_id=eq.${roomState.room.id}` },
        (payload) => {
          setRoomState((state) => updateCollectionEvent(state, "diceRequests", payload, "created_at", false));
        }
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "media_assets", filter: `room_id=eq.${roomState.room.id}` },
        (payload) => {
          setRoomState((state) => updateCollectionEvent(state, "mediaAssets", payload, "created_at", false));
        }
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "scenes", filter: `room_id=eq.${roomState.room.id}` },
        (payload) => {
          setRoomState((state) => {
            const next = updateCollectionEvent(state, "scenes", payload, "created_at", false);
            return { ...next, scene: next.scenes.find((scene) => scene.id === next.room.current_scene_id) ?? next.scene };
          });
        }
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "audio_tracks", filter: `room_id=eq.${roomState.room.id}` },
        (payload) => {
          setRoomState((state) => updateCollectionEvent(state, "audioTracks", payload, "title", true));
        }
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "sound_effects", filter: `room_id=eq.${roomState.room.id}` },
        (payload) => {
          setRoomState((state) => updateCollectionEvent(state, "soundEffects", payload, "title", true));
        }
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "player_characters", filter: `room_id=eq.${roomState.room.id}` },
        (payload) => {
          setRoomState((state) => updateCollectionEvent(state, "characters", payload, "created_at", true));
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [supabase, hasCurrentSession, roomState.room.id, roomState.profile]);

  useEffect(() => {
    if (!supabase || demoMode || !hasCurrentSession || !roomState.room.id) return;

    const displayName = currentCharacter
      ? `${currentCharacter.character_name} ${currentCharacter.character_surname}`
      : roomState.profile.username;

    upsertPresence(supabase, roomState.room.id, roomState.profile, displayName).catch(() => undefined);

    return () => {
      removePresence(supabase, roomState.room.id, roomState.profile.id).catch(() => undefined);
    };
  }, [supabase, hasCurrentSession, roomState.room.id, roomState.profile, currentCharacter]);

  async function createGame(values: CreateGameValues) {
    const inviteCode = values.inviteCode.trim().toUpperCase() || generateInviteCode(values.campaignTitle);

    if (supabase && !demoMode) {
      try {
        setError("");
        let coverImageUrl = values.coverImageUrl;
        let sceneImageUrl = values.sceneImageUrl;

        if (values.coverImageFile) {
          coverImageUrl = await uploadPublicFile(supabase, "scene-images", values.coverImageFile, `campaign-covers/${roomState.profile.id}`);
        }

        if (values.sceneImageFile) {
          sceneImageUrl = await uploadPublicFile(supabase, "scene-images", values.sceneImageFile, `initial-scenes/${roomState.profile.id}`);
        }

        const nextState = await createGameInSupabase(supabase, roomState.profile, { ...values, inviteCode, coverImageUrl, sceneImageUrl });
        setRoomState(nextState);
        setStatus("Partita creata su Supabase");
        setView("master");
      } catch (createError) {
        setError(readError(createError));
      }
      return;
    }

    const nextScene: Scene = {
      ...roomState.scene,
      id: crypto.randomUUID(),
      room_id: roomState.room.id,
      title: values.sceneTitle,
      description: values.sceneDescription,
      image_url: values.sceneImageUrl || roomState.scene.image_url,
      media_type: "image",
      video_url: null,
      loop_video: true,
      created_at: new Date().toISOString()
    };

    setRoomState((state) => ({
      ...state,
      profile: { ...state.profile, role: "master" },
      campaigns: [
        {
          ...state.campaigns[0],
          title: values.campaignTitle,
          genre: values.genre,
          description: values.description,
          cover_image_url: values.coverImageUrl || state.campaigns[0].cover_image_url,
          created_at: new Date().toISOString()
        }
      ],
      room: {
        ...state.room,
        name: values.roomName,
        invite_code: inviteCode,
        max_players: values.maxPlayers,
        current_scene_id: nextScene.id
      },
      scene: nextScene,
      scenes: [nextScene, ...state.scenes]
    }));
    setView("master");
  }

  async function openSuperAdminPanel() {
    if (!isSuperAdmin || !supabase || demoMode) {
      setError("Pannello superadmin disponibile solo per galandar@gmail.com con Supabase attivo.");
      return;
    }

    try {
      setError("");
      const rooms = await listAllRoomsForSuperAdmin(supabase, roomState.profile);
      const media = await listAllMediaForSuperAdmin(supabase, roomState.profile);
      setAdminRooms(rooms);
      setAdminMedia(media);
      setView("superadmin");
    } catch (adminError) {
      setError(readError(adminError));
    }
  }

  async function refreshAdminRooms() {
    if (!isSuperAdmin || !supabase || demoMode) return;

    try {
      setError("");
      const [rooms, media] = await Promise.all([listAllRoomsForSuperAdmin(supabase, roomState.profile), listAllMediaForSuperAdmin(supabase, roomState.profile)]);
      setAdminRooms(rooms);
      setAdminMedia(media);
    } catch (adminError) {
      setError(readError(adminError));
    }
  }

  async function updateAdminRoom(roomId: string, values: { name: string; inviteCode: string; maxPlayers: number }) {
    if (!isSuperAdmin || !supabase || demoMode) return;

    try {
      setError("");
      await updateRoomBySuperAdmin(supabase, roomState.profile, roomId, values);
      await refreshAdminRooms();
      setStatus("Stanza aggiornata dal superadmin");
    } catch (adminError) {
      setError(readError(adminError));
    }
  }

  async function deleteAdminRoom(room: AdminRoomOverview) {
    if (!isSuperAdmin || !supabase || demoMode) return;
    const confirmed = window.confirm(`Vuoi eliminare definitivamente la stanza "${room.name}"?`);
    if (!confirmed) return;

    try {
      setError("");
      await deleteRoomBySuperAdmin(supabase, roomState.profile, room.id);
      await refreshAdminRooms();
      setStatus("Stanza eliminata dal superadmin");
    } catch (adminError) {
      setError(readError(adminError));
    }
  }

  async function deleteAdminMedia(media: AdminMediaOverview) {
    if (!isSuperAdmin || !supabase || demoMode) return;
    const confirmed = window.confirm(`Vuoi eliminare definitivamente "${media.title}"?`);
    if (!confirmed) return;

    try {
      setError("");
      await deleteMediaBySuperAdmin(supabase, roomState.profile, media);
      await refreshAdminRooms();
      setStatus("Contenuto multimediale eliminato dal superadmin");
    } catch (adminError) {
      setError(readError(adminError));
    }
  }

  async function publishMessage(content: string, isPrivate = false, recipientUserId?: string, explicitIdentityId = identityId, channel: "gdr" | "off" = "gdr") {
    const wantsMasterIdentity = explicitIdentityId !== "player";

    if (channel === "gdr" && explicitIdentityId === "player" && (roomState.room.chat_enabled === false || roomState.room.muted_user_ids?.includes(roomState.profile.id))) {
      setError(roomState.room.chat_enabled === false ? "La chat comune e disattivata dal Master." : "Il Master ha disattivato la tua chat.");
      return;
    }

    if (wantsMasterIdentity && !isCurrentMaster) {
      setError("Solo chi ha creato la partita puo usare identita Master o NPC.");
      return;
    }

    const npc = roomState.npcs.find((item) => item.id === explicitIdentityId);
    const message: Omit<Message, "id" | "created_at"> = {
      room_id: roomState.room.id,
      sender_user_id: roomState.profile.id,
      sender_type: npc ? "npc" : explicitIdentityId === "player" ? "player" : "master",
      sender_display_name: npc
        ? npc.name
        : explicitIdentityId === "player"
          ? `${currentCharacter.character_name} ${currentCharacter.character_surname}`
          : "Master",
      sender_color: npc ? npc.color : explicitIdentityId === "player" ? currentCharacter.color : "#c8a35d",
      npc_id: npc?.id,
      content,
      is_private: isPrivate,
      channel,
      recipient_user_id: recipientUserId
    };

    if (supabase && !demoMode) {
      try {
        setError("");
        const saved = await insertMessage(supabase, message);
        setRoomState((state) => addMessageToState(state, saved));
        logAction(channel === "off" ? "Messaggio OFF GDR" : isPrivate ? "Sussurro inviato" : "Messaggio in chat", content.slice(0, 80));
      } catch (messageError) {
        setError(readError(messageError));
      }
      return;
    }

    const localMessage: Message = {
      ...message,
      id: crypto.randomUUID(),
      created_at: new Date().toISOString()
    };

    setRoomState((state) => addMessageToState(state, localMessage));
    logAction(channel === "off" ? "Messaggio OFF GDR" : isPrivate ? "Sussurro inviato" : "Messaggio in chat", content.slice(0, 80));
  }

  async function markTyping() {
    // Typing realtime intentionally disabled to keep Supabase Realtime usage low.
  }

  async function changeScene(scene: Scene) {
    if (!isCurrentMaster) {
      setError("Solo il Master puo cambiare scena.");
      return;
    }

    if (supabase && !demoMode) {
      try {
        setError("");
        await updateCurrentScene(supabase, roomState.room.id, scene.id);
      } catch (sceneError) {
        setError(readError(sceneError));
      }
    }

    setRoomState((state) => ({
      ...state,
      scene,
      room: { ...state.room, current_scene_id: scene.id }
    }));
  }

  async function changeAudio(track: AudioTrack) {
    if (!isCurrentMaster) {
      setError("Solo il Master puo cambiare audio.");
      return;
    }

    if (supabase && !demoMode) {
      try {
        setError("");
        await updateCurrentAudio(supabase, roomState.room.id, track.id);
      } catch (audioError) {
        setError(readError(audioError));
      }
    }

    setRoomState((state) => ({
      ...state,
      room: { ...state.room, current_audio_id: track.id }
    }));
  }

  async function joinRoom(code: string, mode: JoinMode) {
    if (supabase && !demoMode) {
      try {
        setError("");
        if (mode === "master") {
          const masterState = await enterMasterRoomByCode(supabase, code, roomState.profile);
          if (!masterState) return false;

          setRoomState(masterState);
          setStatus("Rientro Master completato");
          setView("master");
          return true;
        }

        const joinedState = await joinRoomByCode(supabase, code, roomState.profile);
        if (!joinedState) return false;

        const playerState = { ...joinedState, profile: { ...joinedState.profile, role: "player" as const } };
        setRoomState(playerState);
        const existingCharacter = playerState.characters.find((character) => character.user_id === playerState.profile.id);
        if (existingCharacter?.is_setup_complete) {
          setPendingPlayerRoom(null);
          setStatus("Rientro giocatore completato");
          setView("player");
        } else {
          setPendingPlayerRoom(playerState);
          setStatus("Stanza trovata: crea il tuo personaggio");
          setView("character");
        }
        return true;
      } catch (joinError) {
        setError(readError(joinError));
        return false;
      }
    }

    if (code.trim().toUpperCase() === roomState.room.invite_code.toUpperCase()) {
      if (mode === "master") {
        if (roomState.campaigns[0]?.master_id !== roomState.profile.id) {
          setError("Questo codice stanza appartiene a un altro Master.");
          return false;
        }

        setRoomState((state) => ({ ...state, profile: { ...state.profile, role: "master" } }));
        setView("master");
        return true;
      }

      setRoomState((state) => ({ ...state, profile: { ...state.profile, role: "player" } }));
      setView("character");
      return true;
    }

    return false;
  }

  async function createCharacter(values: CharacterSetupValues) {
    const targetState = pendingPlayerRoom ?? roomState;
    let portraitUrl = values.portraitUrl;

    try {
      setError("");
      if (supabase && !demoMode) {
        if (values.portraitFile) {
          portraitUrl = await uploadPublicFile(supabase, "portraits", values.portraitFile, `rooms/${targetState.room.id}/portraits`);
        }

        await createOrUpdateCharacter(supabase, targetState.room.id, targetState.profile, {
          characterName: values.characterName,
          characterSurname: values.characterSurname,
          color: values.color,
          portraitUrl: portraitUrl || demoRoomState.characters[0].portrait_url,
          hp: values.hp,
          mentalState: values.mentalState,
          visibleStatus: values.visibleStatus,
          publicBackground: values.publicBackground
        });

        const refreshed = await loadRoomState(supabase, targetState.room.id, { ...targetState.profile, role: "player" });
        setRoomState({ ...refreshed, profile: { ...refreshed.profile, role: "player" } });
      }

      setPendingPlayerRoom(null);
      setStatus("Personaggio creato");
      setView("player");
    } catch (characterError) {
      setError(readError(characterError));
    }
  }

  async function createMasterScene(values: {
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
  }) {
    if (!isCurrentMaster) return;

    try {
      setError("");
      let imageUrl = values.imageUrl;
      let videoUrl = values.videoUrl ?? "";
      if (supabase && !demoMode) {
        if (values.imageFile) {
          imageUrl = await uploadPublicFile(supabase, "scene-images", values.imageFile, `rooms/${roomState.room.id}/scenes`);
        }
        if (values.videoFile) {
          videoUrl = await uploadPublicFile(supabase, "scene-images", values.videoFile, `rooms/${roomState.room.id}/scene-videos`);
        }
        if (values.mediaType === "video" && !imageUrl) {
          imageUrl = videoUrl;
        }
        const scene = await createScene(supabase, roomState.room.id, { ...roomState.profile, role: "master" }, { ...values, imageUrl, videoUrl });
        const sceneAssetUrl = scene.media_type === "video" ? scene.video_url || scene.image_url : scene.image_url;
        if (sceneAssetUrl) {
          const asset = await createMediaAsset(supabase, roomState.room.id, roomState.profile, {
            title: scene.title,
            assetType: scene.media_type === "video" ? "video" : "image",
            url: sceneAssetUrl,
            tags: ["scena"]
          });
          setRoomState((state) => ({ ...state, mediaAssets: [asset, ...state.mediaAssets.filter((item) => item.id !== asset.id)] }));
        }
        await updateCurrentScene(supabase, roomState.room.id, scene.id);
        setRoomState((state) => ({
          ...state,
          scene,
          scenes: [scene, ...state.scenes.filter((item) => item.id !== scene.id)],
          room: { ...state.room, current_scene_id: scene.id }
        }));
      }
      setStatus("Scena salvata");
    } catch (sceneError) {
      setError(readError(sceneError));
    }
  }

  async function removeMasterScene(scene: Scene) {
    if (!isCurrentMaster) return;

    if (roomState.scenes.length <= 1) {
      setError("Non puoi eliminare l'unica scena della stanza. Creane prima un'altra.");
      return;
    }

    const confirmed = window.confirm(`Vuoi eliminare definitivamente la scena "${scene.title}"? Immagine e descrizione verranno rimosse.`);
    if (!confirmed) return;

    try {
      setError("");
      const fallbackScene = roomState.scenes.find((item) => item.id !== scene.id);

      if (supabase && !demoMode) {
        if (roomState.room.current_scene_id === scene.id && fallbackScene) {
          await updateCurrentScene(supabase, roomState.room.id, fallbackScene.id);
        }

        await deleteScene(supabase, scene);
      }

      if (fallbackScene) {
        setRoomState((state) => ({
          ...state,
          scene: state.scene.id === scene.id ? fallbackScene : state.scene,
          scenes: state.scenes.filter((item) => item.id !== scene.id),
          room: { ...state.room, current_scene_id: state.room.current_scene_id === scene.id ? fallbackScene.id : state.room.current_scene_id }
        }));
      }

      setStatus("Scena eliminata");
    } catch (sceneError) {
      setError(readError(sceneError));
    }
  }

  async function createMasterAudio(values: { title: string; audioUrl: string; loop: boolean; audioFile?: File }) {
    if (!isCurrentMaster) return;

    try {
      setError("");
      let audioUrl = values.audioUrl;
      if (supabase && !demoMode) {
        if (values.audioFile) {
          audioUrl = await uploadPublicFile(supabase, "audio-tracks", values.audioFile, `rooms/${roomState.room.id}/audio`);
        }
        const track = await createAudioTrack(supabase, roomState.room.id, { ...values, audioUrl });
        if (audioUrl) {
          const asset = await createMediaAsset(supabase, roomState.room.id, roomState.profile, {
            title: track.title,
            assetType: "audio",
            url: audioUrl,
            tags: ["audio", "traccia"]
          });
          setRoomState((state) => ({ ...state, mediaAssets: [asset, ...state.mediaAssets.filter((item) => item.id !== asset.id)] }));
        }
        await updateCurrentAudio(supabase, roomState.room.id, track.id);
        setRoomState((state) => ({
          ...state,
          audioTracks: [...state.audioTracks.filter((item) => item.id !== track.id), track].sort((a, b) => a.title.localeCompare(b.title)),
          room: { ...state.room, current_audio_id: track.id }
        }));
      }
      setStatus("Traccia audio salvata");
    } catch (audioError) {
      setError(readError(audioError));
    }
  }

  async function removeMasterAudio(track: AudioTrack) {
    if (!isCurrentMaster) return;

    if (roomState.audioTracks.length <= 1) {
      setError("Non puoi eliminare l'unica traccia audio. Creane prima un'altra.");
      return;
    }

    const confirmed = window.confirm(`Vuoi eliminare definitivamente la traccia "${track.title}"?`);
    if (!confirmed) return;

    try {
      setError("");
      const fallbackTrack = roomState.audioTracks.find((item) => item.id !== track.id);

      if (supabase && !demoMode) {
        if (roomState.room.current_audio_id === track.id && fallbackTrack) {
          await updateCurrentAudio(supabase, roomState.room.id, fallbackTrack.id);
        }

        await deleteAudioTrack(supabase, track);
      }

      if (fallbackTrack) {
        setRoomState((state) => ({
          ...state,
          audioTracks: state.audioTracks.filter((item) => item.id !== track.id),
          room: { ...state.room, current_audio_id: state.room.current_audio_id === track.id ? fallbackTrack.id : state.room.current_audio_id }
        }));
      }
      setStatus("Traccia audio eliminata");
    } catch (audioError) {
      setError(readError(audioError));
    }
  }

  async function createMasterSoundEffect(values: { title: string; audioUrl: string; loop: boolean; audioFile?: File }) {
    if (!isCurrentMaster) return;

    try {
      setError("");
      let audioUrl = values.audioUrl;
      if (supabase && !demoMode) {
        if (values.audioFile) {
          audioUrl = await uploadPublicFile(supabase, "audio-tracks", values.audioFile, `rooms/${roomState.room.id}/soundbar`);
        }
        const effect = await createSoundEffect(supabase, roomState.room.id, { ...values, audioUrl });
        if (audioUrl) {
          const asset = await createMediaAsset(supabase, roomState.room.id, roomState.profile, {
            title: effect.title,
            assetType: "sound",
            url: audioUrl,
            tags: ["soundbar", "rumore"]
          });
          setRoomState((state) => ({ ...state, mediaAssets: [asset, ...state.mediaAssets.filter((item) => item.id !== asset.id)] }));
        }
        setRoomState((state) => ({
          ...state,
          soundEffects: [...state.soundEffects.filter((item) => item.id !== effect.id), effect].sort((a, b) => a.title.localeCompare(b.title))
        }));
      } else {
        setRoomState((state) => ({
          ...state,
          soundEffects: [
            ...state.soundEffects,
            {
              id: crypto.randomUUID(),
              room_id: state.room.id,
              title: values.title,
              audio_url: audioUrl,
              loop: values.loop,
              created_at: new Date().toISOString()
            }
          ]
        }));
      }
      setStatus("Rumore aggiunto alla soundbar");
    } catch (soundError) {
      setError(readError(soundError));
    }
  }

  async function removeMasterSoundEffect(effect: SoundEffect) {
    if (!isCurrentMaster) return;
    const confirmed = window.confirm(`Vuoi eliminare il rumore "${effect.title}"?`);
    if (!confirmed) return;

    try {
      setError("");
      if (supabase && !demoMode) {
        if (roomState.room.current_sound_effect_id === effect.id) {
          await triggerRoomSoundEffect(supabase, roomState.room.id, null);
        }
        await deleteSoundEffect(supabase, effect);
      }
      setRoomState((state) => ({
        ...state,
        room: {
          ...state.room,
          current_sound_effect_id: state.room.current_sound_effect_id === effect.id ? null : state.room.current_sound_effect_id,
          sound_effect_started_at: new Date().toISOString()
        },
        soundEffects: state.soundEffects.filter((item) => item.id !== effect.id)
      }));
      setStatus("Rumore eliminato");
    } catch (soundError) {
      setError(readError(soundError));
    }
  }

  async function triggerSoundEffect(effect: SoundEffect) {
    if (!isCurrentMaster) return;

    try {
      setError("");
      if (supabase && !demoMode) {
        await triggerRoomSoundEffect(supabase, roomState.room.id, effect.id);
      }
      setRoomState((state) => ({
        ...state,
        room: { ...state.room, current_sound_effect_id: effect.id, sound_effect_started_at: new Date().toISOString() }
      }));
      setStatus(`Rumore avviato: ${effect.title}`);
    } catch (soundError) {
      setError(readError(soundError));
    }
  }

  async function stopSoundEffect() {
    if (!isCurrentMaster) return;

    try {
      setError("");
      if (supabase && !demoMode) {
        await triggerRoomSoundEffect(supabase, roomState.room.id, null);
      }
      setRoomState((state) => ({
        ...state,
        room: { ...state.room, current_sound_effect_id: null, sound_effect_started_at: new Date().toISOString() }
      }));
      setStatus("Rumore fermato");
    } catch (soundError) {
      setError(readError(soundError));
    }
  }

  async function createMasterNpc(values: { name: string; color: string; description: string; portraitUrl: string }) {
    if (!isCurrentMaster) return;

    try {
      setError("");
      if (supabase && !demoMode) {
        const npc = await createNpc(supabase, roomState.room.id, values);
        setRoomState((state) => ({ ...state, npcs: [...state.npcs, npc] }));
      } else {
        setRoomState((state) => ({
          ...state,
          npcs: [
            ...state.npcs,
            {
              id: crypto.randomUUID(),
              room_id: state.room.id,
              name: values.name,
              color: values.color,
              description: values.description,
              portrait_url: values.portraitUrl
            }
          ]
        }));
      }
      setStatus("NPC creato");
    } catch (npcError) {
      setError(readError(npcError));
    }
  }

  async function removeMasterNpc(npc: Npc) {
    if (!isCurrentMaster) return;
    const confirmed = window.confirm(`Vuoi eliminare definitivamente l'NPC "${npc.name}"?`);
    if (!confirmed) return;

    try {
      setError("");
      if (supabase && !demoMode) {
        await deleteNpc(supabase, npc);
      }
      setRoomState((state) => ({
        ...state,
        npcs: state.npcs.filter((item) => item.id !== npc.id),
        messages: state.messages.map((message) => (message.npc_id === npc.id ? { ...message, npc_id: null } : message))
      }));
      if (identityId === npc.id) setIdentityId("master");
      setStatus("NPC eliminato");
    } catch (npcError) {
      setError(readError(npcError));
    }
  }

  async function addInventoryItem(characterId: string, values: { name: string; description: string; quantity: number; isPublic: boolean; masterNotes: string }) {
    if (!isCurrentMaster) return;

    try {
      setError("");
      if (supabase && !demoMode) {
        const item = await createInventoryItem(supabase, characterId, values);
        setRoomState((state) => ({ ...state, inventory: [...state.inventory, item] }));
      } else {
        setRoomState((state) => ({
          ...state,
          inventory: [
            ...state.inventory,
            {
              id: crypto.randomUUID(),
              character_id: characterId,
              name: values.name,
              description: values.description,
              quantity: values.quantity,
              image_url: null,
              is_public: values.isPublic,
              master_notes: values.masterNotes,
              player_notes: null
            }
          ]
        }));
      }
      setStatus("Oggetto aggiunto all'inventario");
    } catch (inventoryError) {
      setError(readError(inventoryError));
    }
  }

  async function removeInventoryItem(item: InventoryItem) {
    if (!isCurrentMaster) return;
    const confirmed = window.confirm(`Vuoi rimuovere "${item.name}" dall'inventario?`);
    if (!confirmed) return;

    try {
      setError("");
      if (supabase && !demoMode) {
        await deleteInventoryItem(supabase, item);
      }
      setRoomState((state) => ({ ...state, inventory: state.inventory.filter((inventoryItem) => inventoryItem.id !== item.id) }));
      setStatus("Oggetto rimosso dall'inventario");
    } catch (inventoryError) {
      setError(readError(inventoryError));
    }
  }

  async function saveChatPermissions(values: { chatEnabled: boolean; mutedUserIds: string[] }) {
    if (!isCurrentMaster) return;

    try {
      setError("");
      if (supabase && !demoMode) {
        await updateRoomChatPermissions(supabase, roomState.room.id, values);
        setRoomState((state) => ({ ...state, room: { ...state.room, chat_enabled: values.chatEnabled, muted_user_ids: values.mutedUserIds } }));
      } else {
        setRoomState((state) => ({ ...state, room: { ...state.room, chat_enabled: values.chatEnabled, muted_user_ids: values.mutedUserIds } }));
      }
      setStatus("Permessi chat aggiornati");
    } catch (chatError) {
      setError(readError(chatError));
    }
  }

  async function saveCharacterByMaster(
    characterId: string,
    values: { characterName: string; characterSurname: string; portraitUrl: string; portraitFile?: File; color: string; hp: number; mentalState: string; visibleStatus: string; publicBackground: string; conditions: string }
  ) {
    if (!isCurrentMaster) return;

    try {
      setError("");
      let portraitUrl = values.portraitUrl;
      if (supabase && !demoMode) {
        if (values.portraitFile) {
          portraitUrl = await uploadPublicFile(supabase, "portraits", values.portraitFile, `rooms/${roomState.room.id}/portraits`);
        }
        const updatedCharacter = await updateCharacterByMaster(supabase, characterId, {
          ...values,
          portraitUrl,
          conditions: values.conditions.split(",").map((condition) => condition.trim()).filter(Boolean)
        });
        setRoomState((state) => ({
          ...state,
          characters: state.characters.map((character) => (character.id === characterId ? updatedCharacter : character))
        }));
      } else {
        setRoomState((state) => ({
          ...state,
          characters: state.characters.map((character) =>
            character.id === characterId
              ? {
                  ...character,
                  character_name: values.characterName,
                  character_surname: values.characterSurname,
                  portrait_url: portraitUrl,
                  color: values.color,
                  hp: values.hp,
                  mental_state: values.mentalState,
                  visible_status: values.visibleStatus,
                  public_background: values.publicBackground,
                  conditions: values.conditions.split(",").map((condition) => condition.trim()).filter(Boolean)
                }
              : character
          )
        }));
      }
      setStatus("Dati giocatore aggiornati");
    } catch (characterError) {
      setError(readError(characterError));
    }
  }

  async function requestDice(values: { diceSides: number; reason: string; targetUserId?: string | null; visibility: "public" | "private" }) {
    if (!isCurrentMaster) return;

    try {
      setError("");
      if (supabase && !demoMode) {
        const request = await createDiceRequest(supabase, roomState.room.id, roomState.profile, values);
        setRoomState((state) => ({ ...state, diceRequests: [request, ...state.diceRequests.filter((item) => item.id !== request.id)] }));
      } else {
        setRoomState((state) => ({
          ...state,
          diceRequests: [
            {
              id: crypto.randomUUID(),
              room_id: state.room.id,
              requested_by: state.profile.id,
              target_user_id: values.targetUserId,
              dice_sides: values.diceSides,
              reason: values.reason,
              visibility: values.visibility,
              status: "pending",
              created_at: new Date().toISOString()
            },
            ...state.diceRequests
          ]
        }));
      }
      setStatus("Tiro richiesto");
    } catch (diceError) {
      setError(readError(diceError));
    }
  }

  async function rollDice(request: DiceRequest) {
    const result = Math.floor(Math.random() * request.dice_sides) + 1;
    const characterName = currentCharacter ? `${currentCharacter.character_name} ${currentCharacter.character_surname}` : roomState.profile.username;
    const text = `${characterName} tira d${request.dice_sides}: ${result}${request.reason ? ` (${request.reason})` : ""}`;

    try {
      setError("");
      if (supabase && !demoMode) {
        await rollDiceRequest(supabase, request, result);
      }

      await publishMessage(text, request.visibility === "private", request.visibility === "private" ? roomState.campaigns[0].master_id : undefined, "player");
      setRoomState((state) => ({
        ...state,
        diceRequests: state.diceRequests.map((item) =>
          item.id === request.id ? { ...item, status: "rolled", result, rolled_at: new Date().toISOString() } : item
        )
      }));
    } catch (diceError) {
      setError(readError(diceError));
    }
  }

  async function saveSpotlight(values: { npcId: string | null; visibility: "off" | "public" | "private"; userIds: string[] }) {
    if (!isCurrentMaster) return;

    try {
      setError("");
      if (supabase && !demoMode) {
        await updateRoomSpotlight(supabase, roomState.room.id, values);
        setRoomState((state) => ({
          ...state,
          room: { ...state.room, spotlight_npc_id: values.npcId, spotlight_visibility: values.visibility, spotlight_user_ids: values.userIds }
        }));
      } else {
        setRoomState((state) => ({
          ...state,
          room: { ...state.room, spotlight_npc_id: values.npcId, spotlight_visibility: values.visibility, spotlight_user_ids: values.userIds }
        }));
      }
      setStatus("Focus personaggio aggiornato");
    } catch (spotlightError) {
      setError(readError(spotlightError));
    }
  }

  async function saveRoom() {
    setError("");
    setStatus("Stanza salvata sul database");
  }

  async function loadOlderMessages() {
    const loadedMessages = [...roomState.messages, ...roomState.offMessages, ...roomState.privateMessages].sort((a, b) => a.created_at.localeCompare(b.created_at));
    const oldestMessage = loadedMessages[0];
    if (!oldestMessage || !roomState.hasOlderMessages) return;

    try {
      setError("");
      if (supabase && !demoMode) {
        const older = await loadOlderRoomMessages(supabase, roomState.room.id, oldestMessage.created_at);
        setRoomState((state) => ({
          ...state,
          messages: mergeMessagePages(older.messages, state.messages),
          offMessages: mergeMessagePages(older.offMessages, state.offMessages),
          privateMessages: mergeMessagePages(older.privateMessages, state.privateMessages),
          hasOlderMessages: older.hasOlderMessages
        }));
      } else {
        setRoomState((state) => ({ ...state, hasOlderMessages: false }));
      }
      setStatus("Cronologia precedente caricata");
    } catch (messageError) {
      setError(readError(messageError));
    }
  }

  async function loadFullChatForExport() {
    if (supabase && !demoMode) {
      return exportRoomMessages(supabase, roomState.room.id);
    }

    return [...roomState.messages, ...roomState.offMessages, ...roomState.privateMessages].sort((a, b) => a.created_at.localeCompare(b.created_at));
  }

  async function removeMessage(message: Message) {
    const allMessages = [...roomState.messages, ...roomState.offMessages, ...roomState.privateMessages];
    const latestOwnMessage = [...allMessages].reverse().find((item) => item.sender_user_id === roomState.profile.id);
    if (!isCurrentMaster && latestOwnMessage?.id !== message.id) return;
    const confirmed = window.confirm("Vuoi eliminare questo messaggio?");
    if (!confirmed) return;

    try {
      setError("");
      if (supabase && !demoMode) {
        await deleteMessage(supabase, message.id);
      }
      setRoomState((state) => ({
        ...state,
        messages: state.messages.filter((item) => item.id !== message.id),
        offMessages: state.offMessages.filter((item) => item.id !== message.id),
        privateMessages: state.privateMessages.filter((item) => item.id !== message.id)
      }));
      setStatus("Messaggio eliminato");
    } catch (messageError) {
      setError(readError(messageError));
    }
  }

  async function editOwnMessage(message: Message, content: string) {
    const canEdit = message.sender_user_id === roomState.profile.id || isCurrentMaster;
    if (!canEdit || !content.trim()) return;

    try {
      setError("");
      if (supabase && !demoMode) {
        const updated = await updateMessageContent(supabase, message.id, content.trim());
        setRoomState((state) => updateMessageInState(state, updated));
      } else {
        const updated = { ...message, content: content.trim(), edited_at: new Date().toISOString() };
        setRoomState((state) => updateMessageInState(state, updated));
      }
      setStatus("Messaggio modificato");
    } catch (messageError) {
      setError(readError(messageError));
    }
  }

  async function toggleMessagePin(message: Message) {
    if (!isCurrentMaster) return;

    try {
      setError("");
      if (supabase && !demoMode) {
        const updated = await updateMessagePinned(supabase, message.id, !message.is_pinned);
        setRoomState((state) => updateMessageInState(state, updated));
      } else {
        setRoomState((state) => updateMessageInState(state, { ...message, is_pinned: !message.is_pinned }));
      }
      setStatus(message.is_pinned ? "Messaggio rimosso dai pin" : "Messaggio fissato");
    } catch (messageError) {
      setError(readError(messageError));
    }
  }

  async function addMediaAsset(values: { title: string; assetType: MediaAsset["asset_type"]; url: string; tags: string[]; file?: File }) {
    if (!isCurrentMaster) return;

    try {
      setError("");
      let url = values.url;
      if (supabase && !demoMode) {
        if (values.file) {
          const bucket = values.assetType === "audio" || values.assetType === "sound" ? "audio-tracks" : values.assetType === "portrait" ? "portraits" : "scene-images";
          url = await uploadPublicFile(supabase, bucket, values.file, `rooms/${roomState.room.id}/media`);
        }
        const asset = await createMediaAsset(supabase, roomState.room.id, roomState.profile, { ...values, url });
        setRoomState((state) => ({ ...state, mediaAssets: [asset, ...state.mediaAssets.filter((item) => item.id !== asset.id)] }));
      } else {
        setRoomState((state) => ({
          ...state,
          mediaAssets: [
            {
              id: crypto.randomUUID(),
              room_id: state.room.id,
              title: values.title,
              asset_type: values.assetType,
              url,
              tags: values.tags,
              created_by: state.profile.id,
              created_at: new Date().toISOString()
            },
            ...state.mediaAssets
          ]
        }));
      }
      setStatus("Asset salvato in libreria");
      logAction("Asset media salvato", values.title);
    } catch (mediaError) {
      setError(readError(mediaError));
    }
  }

  async function removeMediaAsset(asset: MediaAsset) {
    if (!isCurrentMaster) return;
    const confirmed = window.confirm(`Vuoi eliminare "${asset.title}" dalla libreria media?`);
    if (!confirmed) return;

    try {
      setError("");
      const [syntheticSource, syntheticId] = asset.id.split(":");
      if (syntheticSource === "scene") {
        const scene = roomState.scenes.find((item) => item.id === syntheticId);
        if (scene) {
          await removeMasterScene(scene);
          return;
        }
      }
      if (syntheticSource === "audio") {
        const track = roomState.audioTracks.find((item) => item.id === syntheticId);
        if (track) {
          await removeMasterAudio(track);
          return;
        }
      }
      if (syntheticSource === "sound") {
        const effect = roomState.soundEffects.find((item) => item.id === syntheticId);
        if (effect) {
          await removeMasterSoundEffect(effect);
          return;
        }
      }

      if (supabase && !demoMode) {
        await deleteMediaAsset(supabase, asset);
      }
      setRoomState((state) => ({ ...state, mediaAssets: state.mediaAssets.filter((item) => item.id !== asset.id) }));
      setStatus("Asset eliminato");
    } catch (mediaError) {
      setError(readError(mediaError));
    }
  }

  async function addPersonalNote(values: { title: string; content: string }) {
    if (!currentCharacter) return;

    try {
      setError("");
      if (supabase && !demoMode) {
        const note = await createPlayerNote(supabase, currentCharacter.id, values);
        setRoomState((state) => ({ ...state, notes: [note, ...state.notes.filter((item) => item.id !== note.id)] }));
      } else {
        setRoomState((state) => ({
          ...state,
          notes: [
            {
              id: crypto.randomUUID(),
              character_id: currentCharacter.id,
              title: values.title,
              content: values.content,
              updated_at: new Date().toISOString()
            },
            ...state.notes
          ]
        }));
      }
      setStatus("Nota salvata");
    } catch (noteError) {
      setError(readError(noteError));
    }
  }

  async function closeAndDeleteRoom() {
    if (!isCurrentMaster) return;
    const confirmed = window.confirm("Vuoi eliminare definitivamente questa stanza? L'operazione non e reversibile.");
    if (!confirmed) return;

    try {
      if (supabase && !demoMode) {
        await deleteRoom(supabase, roomState.room.id);
      }
      setRoomState({ ...demoRoomState, profile: roomState.profile });
      setStatus("Stanza eliminata");
      setView("menu");
    } catch (deleteError) {
      setError(readError(deleteError));
    }
  }

  async function signOut() {
    if (supabase && !demoMode) {
      await supabase.auth.signOut();
    }
    setRoomState(demoRoomState);
    setView("menu");
    setStatus("Logout eseguito");
  }

  if (isLoading) {
    return <AppLoading status={status} />;
  }

  return (
    <div className={view === "master" ? "flex min-h-screen flex-col" : "mx-auto flex max-w-[1800px] flex-col gap-4"}>
      {(view !== "menu" && view !== "master") || error ? <StatusBar status={status} error={error} onSignOut={signOut} /> : null}
      {view === "menu" ? (
        <StartMenu
          onCreate={() => setView("create")}
          onJoin={() => setView("join")}
          onSignOut={signOut}
          isSuperAdmin={isSuperAdmin}
          onSuperAdmin={openSuperAdminPanel}
        />
      ) : null}

      {view === "superadmin" && isSuperAdmin ? (
        <SuperAdminRooms
          rooms={adminRooms}
          media={adminMedia}
          onBack={() => setView("menu")}
          onRefresh={refreshAdminRooms}
          onUpdate={updateAdminRoom}
          onDelete={deleteAdminRoom}
          onDeleteMedia={deleteAdminMedia}
        />
      ) : null}

      {view === "create" ? <CreateGameForm state={roomState} onBack={() => setView("menu")} onCreate={createGame} /> : null}

      {view === "join" ? <JoinRoomForm room={roomState.room} onBack={() => setView("menu")} onJoin={joinRoom} /> : null}

      {view === "character" ? (
        <CharacterSetupForm defaultName={roomState.profile.username} onBack={() => setView("join")} onCreate={createCharacter} />
      ) : null}

      {view === "player" ? (
        <PlayerRoom
          state={roomState}
          currentAudio={currentAudio}
          onBack={() => setView("menu")}
          onSend={(content) => publishMessage(content, false, undefined, "player")}
          onPrivateSend={(content, recipientUserId) => publishMessage(content, true, recipientUserId, "player")}
          onOffSend={(content) => publishMessage(content, false, undefined, "player", "off")}
          onTyping={markTyping}
          onEditMessage={editOwnMessage}
          onDeleteMessage={removeMessage}
          onRollDice={rollDice}
          onCreateNote={addPersonalNote}
          onLoadOlderMessages={loadOlderMessages}
          onExportMessages={loadFullChatForExport}
        />
      ) : null}

      {view === "master" && isCurrentMaster ? (
        <MasterControlRoom
          state={roomState}
          identityId={identityId}
          currentAudio={currentAudio}
          onBack={() => setView("menu")}
          onOpenPlayerView={() => setView("player")}
          onIdentityChange={setIdentityId}
          onPublicMessage={(content) => publishMessage(content)}
          onOffMessage={(content) => publishMessage(content, false, undefined, "master", "off")}
          onPrivateMessage={(content, userId) => publishMessage(content, true, userId)}
          onTyping={markTyping}
          onDeleteMessage={removeMessage}
          onEditMessage={editOwnMessage}
          onToggleMessagePin={toggleMessagePin}
          onSceneChange={changeScene}
          onAudioChange={changeAudio}
          onCreateScene={createMasterScene}
          onDeleteScene={removeMasterScene}
          onCreateAudio={createMasterAudio}
          onDeleteAudio={removeMasterAudio}
          onCreateSoundEffect={createMasterSoundEffect}
          onDeleteSoundEffect={removeMasterSoundEffect}
          onTriggerSoundEffect={triggerSoundEffect}
          onStopSoundEffect={stopSoundEffect}
          onCreateNpc={createMasterNpc}
          onDeleteNpc={removeMasterNpc}
          onCreateInventoryItem={addInventoryItem}
          onDeleteInventoryItem={removeInventoryItem}
          onUpdateChatPermissions={saveChatPermissions}
          onCreateDiceRequest={requestDice}
          onUpdateSpotlight={saveSpotlight}
          onUpdateCharacter={saveCharacterByMaster}
          onCreateMediaAsset={addMediaAsset}
          onDeleteMediaAsset={removeMediaAsset}
          onLoadOlderMessages={loadOlderMessages}
          onExportMessages={loadFullChatForExport}
          actionLog={actionLog}
          onSaveRoom={saveRoom}
          onDeleteRoom={closeAndDeleteRoom}
        />
      ) : null}
    </div>
  );
}

function AppLoading({ status }: { status: string }) {
  return (
    <main className="app-loading-shell">
      <div className="app-loading-card">
        <div className="app-loading-orb" aria-hidden="true">
          <Loader2 size={28} />
        </div>
        <p className="app-loading-kicker">GDR Master Room</p>
        <h1>Preparazione della stanza</h1>
        <p>{status}</p>
        <div className="app-loading-line" aria-hidden="true" />
      </div>
    </main>
  );
}

function StatusBar({ status, error, onSignOut }: { status: string; error: string; onSignOut: () => void }) {
  return (
    <div className={`app-status-bar ${error ? "is-error" : ""}`}>
      <div className="app-status-content">
        <span className="app-status-icon" aria-hidden="true">
          {error ? <AlertTriangle size={16} /> : status.toLowerCase().includes("caric") ? <Sparkles size={16} /> : <CheckCircle2 size={16} />}
        </span>
        <span>{error || status}</span>
      </div>
      <button type="button" onClick={onSignOut} className="app-status-logout">
        <LogOut size={14} aria-hidden="true" />
        Logout
      </button>
    </div>
  );
}

function addMessageToState(state: RoomState, message: Message) {
  if (message.is_private) {
    return state.privateMessages.some((item) => item.id === message.id)
      ? state
      : { ...state, privateMessages: [...state.privateMessages, message] };
  }

  if (message.channel === "off") {
    return state.offMessages.some((item) => item.id === message.id)
      ? state
      : { ...state, offMessages: [...state.offMessages, message] };
  }

  return state.messages.some((item) => item.id === message.id)
    ? state
    : { ...state, messages: [...state.messages, message] };
}

function updateMessageInState(state: RoomState, message: Message) {
  const update = (items: Message[]) => items.map((item) => (item.id === message.id ? message : item));

  return {
    ...state,
    messages: update(state.messages),
    offMessages: update(state.offMessages),
    privateMessages: update(state.privateMessages)
  };
}

function mergeMessagePages(olderMessages: Message[], currentMessages: Message[]) {
  const seen = new Set<string>();
  return [...olderMessages, ...currentMessages]
    .filter((message) => {
      if (seen.has(message.id)) return false;
      seen.add(message.id);
      return true;
    })
    .sort((a, b) => a.created_at.localeCompare(b.created_at));
}

type CollectionKey = "diceRequests" | "mediaAssets" | "scenes" | "audioTracks" | "soundEffects" | "characters";

function updateCollectionEvent(
  state: RoomState,
  key: CollectionKey,
  payload: { eventType: string; new: Record<string, unknown>; old: Record<string, unknown> },
  sortKey: string,
  ascending: boolean
) {
  const items = state[key] as unknown as Array<{ id: string } & Record<string, unknown>>;

  if (payload.eventType === "DELETE") {
    return { ...state, [key]: items.filter((item) => item.id !== payload.old.id) };
  }

  const incoming = payload.new as { id: string } & Record<string, unknown>;
  const merged = items.some((item) => item.id === incoming.id) ? items.map((item) => (item.id === incoming.id ? incoming : item)) : [...items, incoming];
  const sorted = merged.sort((a, b) => {
    const left = String((a as Record<string, unknown>)[sortKey] ?? "");
    const right = String((b as Record<string, unknown>)[sortKey] ?? "");
    return ascending ? left.localeCompare(right) : right.localeCompare(left);
  });

  return { ...state, [key]: sorted };
}

function generateInviteCode(title: string) {
  const prefix = title
    .replace(/[^a-zA-Z]/g, "")
    .slice(0, 3)
    .toUpperCase()
    .padEnd(3, "G");
  return `${prefix}-${Math.floor(100 + Math.random() * 900)}`;
}

function readError(error: unknown) {
  const message =
    error instanceof Error
      ? error.message
      : typeof error === "object" && error && "message" in error
        ? String(error.message)
        : "";

  if (message.includes("public.users") || message.includes("schema cache") || message.includes("PGRST205")) {
    return "Login riuscito, ma manca lo schema database. Esegui supabase/schema.sql nel SQL Editor di Supabase.";
  }

  if (message) return message;
  return "Operazione non riuscita. Controlla schema Supabase e permessi RLS.";
}

function withClientTimeout<T>(promise: Promise<T>, timeoutMs: number, message: string) {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) => {
      window.setTimeout(() => reject(new Error(message)), timeoutMs);
    })
  ]);
}
