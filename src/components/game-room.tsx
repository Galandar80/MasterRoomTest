"use client";

import { useMemo, useState } from "react";
import type { AudioTrack, Message, RoomState, Scene } from "@/lib/types";
import { splitSides } from "@/lib/utils";
import { AudioPlayer } from "@/components/room/audio-player";
import { ChatPanel } from "@/components/room/chat-panel";
import { CharacterRail } from "@/components/room/character-rail";
import { MasterPanel } from "@/components/room/master-panel";
import { PlayerDrawer } from "@/components/room/player-drawer";
import { SceneStage } from "@/components/room/scene-stage";

type GameRoomProps = {
  initialState: RoomState;
};

export function GameRoom({ initialState }: GameRoomProps) {
  const [scene, setScene] = useState(initialState.scene);
  const [messages, setMessages] = useState(initialState.messages);
  const [privateMessages, setPrivateMessages] = useState(initialState.privateMessages);
  const [currentAudio, setCurrentAudio] = useState<AudioTrack>(
    initialState.audioTracks.find((track) => track.id === initialState.room.current_audio_id) ?? initialState.audioTracks[0]
  );
  const [identityId, setIdentityId] = useState("master");
  const [playerText, setPlayerText] = useState("");

  const [leftCharacters, rightCharacters] = useMemo(() => splitSides(initialState.characters), [initialState.characters]);
  const currentCharacter = initialState.characters[0];

  function publishMessage(content: string, isPrivate = false, recipientUserId?: string) {
    const npc = initialState.npcs.find((item) => item.id === identityId);
    const message: Message = {
      id: crypto.randomUUID(),
      room_id: initialState.room.id,
      sender_user_id: initialState.profile.id,
      sender_type: npc ? "npc" : identityId === "player" ? "player" : "master",
      sender_display_name: npc ? npc.name : identityId === "player" ? `${currentCharacter.character_name} ${currentCharacter.character_surname}` : "Master",
      sender_color: npc ? npc.color : identityId === "player" ? currentCharacter.color : "#c8a35d",
      npc_id: npc?.id,
      content,
      is_private: isPrivate,
      recipient_user_id: recipientUserId,
      created_at: new Date().toISOString()
    };

    if (isPrivate) {
      setPrivateMessages((items) => [...items, message]);
      return;
    }

    setMessages((items) => [...items, message]);
  }

  function changeScene(nextScene: Scene) {
    setScene(nextScene);
  }

  return (
    <section className="grid gap-4 xl:grid-cols-[18rem_minmax(0,1fr)_18rem]">
      <CharacterRail side="left" characters={leftCharacters} />

      <div className="grid min-w-0 gap-4">
        <SceneStage scene={scene} />
        <div className="grid min-h-[34rem] gap-4 lg:grid-cols-[minmax(0,1fr)_24rem]">
          <ChatPanel
            messages={messages}
            value={playerText}
            onChange={setPlayerText}
            onSend={() => {
              if (!playerText.trim()) return;
              publishMessage(playerText.trim(), false);
              setPlayerText("");
            }}
          />
          <MasterPanel
            profile={initialState.profile}
            npcs={initialState.npcs}
            scenes={initialState.scenes}
            characters={initialState.characters}
            audioTracks={initialState.audioTracks}
            identityId={identityId}
            currentAudioId={currentAudio.id}
            onIdentityChange={setIdentityId}
            onPublicMessage={publishMessage}
            onPrivateMessage={(content, userId) => publishMessage(content, true, userId)}
            onSceneChange={changeScene}
            onAudioChange={(track) => setCurrentAudio(track)}
            onCreateScene={() => undefined}
            onDeleteScene={() => undefined}
            onCreateAudio={() => undefined}
            onSaveRoom={() => undefined}
            onDeleteRoom={() => undefined}
          />
        </div>
        <PlayerDrawer
          character={currentCharacter}
          inventory={initialState.inventory}
          notes={initialState.notes}
          privateMessages={privateMessages}
          onCreateNote={() => undefined}
        />
        <AudioPlayer track={currentAudio} />
      </div>

      <CharacterRail side="right" characters={rightCharacters} />
    </section>
  );
}
