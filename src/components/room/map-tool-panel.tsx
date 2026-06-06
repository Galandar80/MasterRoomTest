"use client";

import { Compass, Copy, Crosshair, DoorOpen, Expand, Eye, EyeOff, Flag, ImageUp, Map, MapPinned, Minus, Move, Plus, RotateCcw, Search, Trash2, UsersRound } from "lucide-react";
import type React from "react";
import { useEffect, useMemo, useRef, useState } from "react";
import type { Character, MapCharacterPosition, MapCustomMarker, MapHotspot, MapNpcMarker, NarrativeMap, Npc, RoomState } from "@/lib/types";

type MapToolPanelProps = {
  state: RoomState;
  isMaster: boolean;
  onCreateMap?: (values: { title: string; description: string; imageUrl: string; imageFile?: File; parentMapId?: string | null; levelType: NarrativeMap["level_type"]; isVisibleToPlayers: boolean }) => void | Promise<void>;
  onSetActiveMap?: (map: NarrativeMap) => void | Promise<void>;
  onDeleteMap?: (map: NarrativeMap) => void | Promise<void>;
  onDuplicateMap?: (map: NarrativeMap) => void | Promise<void>;
  onUpdateCharacterPosition?: (position: MapCharacterPosition, values: { x: number; y: number; narrativeLocation: string; isVisibleToPlayers: boolean; isLocked: boolean }) => void | Promise<void>;
};

type ViewTransform = {
  scale: number;
  x: number;
  y: number;
};

const levelOptions: { value: NarrativeMap["level_type"]; label: string }[] = [
  { value: "world", label: "Mondo" },
  { value: "region", label: "Regione" },
  { value: "city", label: "Citta" },
  { value: "district", label: "Quartiere" },
  { value: "building", label: "Edificio" },
  { value: "floor", label: "Piano" },
  { value: "room", label: "Stanza" },
  { value: "custom", label: "Custom" }
];

export function MapToolPanel({
  state,
  isMaster,
  onCreateMap,
  onSetActiveMap,
  onDeleteMap,
  onDuplicateMap,
  onUpdateCharacterPosition
}: MapToolPanelProps) {
  const visibleMaps = useMemo(
    () => (isMaster ? state.maps : state.maps.filter((map) => map.is_visible_to_players)),
    [isMaster, state.maps]
  );
  const activeMap = visibleMaps.find((map) => map.is_active) ?? visibleMaps[0];
  const [selectedMapId, setSelectedMapId] = useState(activeMap?.id ?? "");
  const currentMap = visibleMaps.find((map) => map.id === selectedMapId) ?? activeMap;
  const [query, setQuery] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [imageFile, setImageFile] = useState<File | undefined>();
  const [levelType, setLevelType] = useState<NarrativeMap["level_type"]>("custom");
  const [isVisibleToPlayers, setIsVisibleToPlayers] = useState(true);
  const [isCreating, setIsCreating] = useState(false);

  const filteredMaps = visibleMaps.filter((map) => `${map.title} ${map.description}`.toLowerCase().includes(query.toLowerCase()));
  const childMaps = currentMap ? visibleMaps.filter((map) => map.parent_map_id === currentMap.id) : [];
  const breadcrumb = currentMap ? buildMapBreadcrumb(visibleMaps, currentMap) : [];
  const characterPositions = useMemo(
    () => (currentMap ? buildMapCharacterPositions(currentMap, state.characters, state.mapCharacterPositions) : []),
    [currentMap, state.characters, state.mapCharacterPositions]
  );

  useEffect(() => {
    if (!activeMap) return;
    setSelectedMapId((current) => (visibleMaps.some((map) => map.id === current) ? current : activeMap.id));
  }, [activeMap, visibleMaps]);

  function updateIndicator(position: MapCharacterPosition, values: Partial<{ x: number; y: number; narrativeLocation: string; isVisibleToPlayers: boolean; isLocked: boolean }>) {
    if (!currentMap || !onUpdateCharacterPosition) return;
    onUpdateCharacterPosition(position, {
      x: clamp(values.x ?? position.x, 2, 98),
      y: clamp(values.y ?? position.y, 2, 98),
      narrativeLocation: values.narrativeLocation ?? position.narrative_location ?? currentMap.title,
      isVisibleToPlayers: values.isVisibleToPlayers ?? position.is_visible_to_players,
      isLocked: values.isLocked ?? position.is_locked
    });
  }

  return (
    <section className="map-tool-panel director-tool-panel glass-panel rounded-lg p-4">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
        <div>
          <p className="director-tool-eyebrow flex items-center gap-2">
            <MapPinned size={17} /> Atlante narrativo
          </p>
          <h2 className="font-serif text-3xl text-white">Mappa</h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-stone-300">
            Gestisci mappe, livelli, marker e posizioni senza update continui: i marker salvano solo quando li rilasci.
          </p>
        </div>
        <div className="map-tool-search">
          <Search size={15} />
          <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Cerca mappa..." />
        </div>
      </div>

      <div className="mt-5 grid gap-4 2xl:grid-cols-[17rem_minmax(0,1fr)_22rem]">
        <MapLibrary
          maps={filteredMaps}
          activeMap={currentMap}
          onSelect={(map) => setSelectedMapId(map.id)}
          onSetActive={onSetActiveMap}
          onDelete={onDeleteMap}
          onDuplicate={onDuplicateMap}
          isMaster={isMaster}
        />

        <div className="grid min-w-0 gap-3">
          <MapBreadcrumb maps={breadcrumb} onSelect={(map) => setSelectedMapId(map.id)} />
          {currentMap ? (
            <MapViewer
              map={currentMap}
              maps={visibleMaps}
              characters={state.characters}
              npcs={state.npcs}
              hotspots={state.mapHotspots.filter((hotspot) => hotspot.map_id === currentMap.id)}
              characterPositions={characterPositions}
              npcMarkers={state.mapNpcMarkers.filter((marker) => marker.map_id === currentMap.id)}
              customMarkers={state.mapCustomMarkers.filter((marker) => marker.map_id === currentMap.id)}
              isMaster={isMaster}
              onOpenMap={(mapId) => setSelectedMapId(mapId)}
              onUpdateCharacterPosition={onUpdateCharacterPosition}
            />
          ) : (
            <MapEmptyState title="Nessuna mappa disponibile" text={isMaster ? "Crea una mappa per iniziare a muovere la scena." : "Il Master non ha ancora condiviso una mappa."} />
          )}
        </div>

        <aside className="map-tool-sidebar grid content-start gap-4">
          <section className="map-tool-card">
            <h3>
              <Compass size={16} /> Dettagli
            </h3>
            {currentMap ? (
              <>
                <p className="mt-3 font-serif text-2xl text-white">{currentMap.title}</p>
                <p className="mt-2 text-sm leading-6 text-stone-300">{currentMap.description || "Nessuna descrizione."}</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <span className="map-chip">{levelOptions.find((item) => item.value === currentMap.level_type)?.label ?? "Mappa"}</span>
                  <span className={`map-chip ${currentMap.is_visible_to_players ? "is-public" : "is-private"}`}>
                    {currentMap.is_visible_to_players ? <Eye size={13} /> : <EyeOff size={13} />}
                    {currentMap.is_visible_to_players ? "Pubblica" : "Privata"}
                  </span>
                  {currentMap.is_active ? <span className="map-chip is-active">Attiva</span> : null}
                </div>
                {childMaps.length ? (
                  <div className="mt-4 grid gap-2">
                    <p className="text-xs uppercase tracking-[0.18em] text-brass/80">Sottomappe</p>
                    {childMaps.map((map) => (
                      <button key={map.id} type="button" className="map-submap-button" onClick={() => setSelectedMapId(map.id)}>
                        <DoorOpen size={15} /> {map.title}
                      </button>
                    ))}
                  </div>
                ) : null}
              </>
            ) : (
              <p className="mt-2 text-sm text-stone-400">Seleziona una mappa.</p>
            )}
          </section>

          {isMaster && currentMap ? (
            <section className="map-tool-card">
              <h3>
                <UsersRound size={16} /> Indicatori giocatori
              </h3>
              <div className="mt-3 grid gap-2">
                {characterPositions.map((position) => {
                  const character = state.characters.find((item) => item.id === position.character_id);
                  if (!character) return null;
                  return (
                    <article key={position.id} className="map-indicator-control">
                      <div>
                        <span className="map-indicator-avatar" style={{ backgroundImage: `url(${character.portrait_url})`, borderColor: character.color }} />
                        <span className="min-w-0">
                          <strong className="truncate" style={{ color: character.color }}>
                            {character.character_name}
                          </strong>
                          <small>
                            X {Math.round(position.x)} · Y {Math.round(position.y)}
                          </small>
                        </span>
                      </div>
                      <div className="map-indicator-actions">
                        <button type="button" onClick={() => updateIndicator(position, { y: position.y - 4 })} aria-label={`Sposta ${character.character_name} in alto`}>↑</button>
                        <button type="button" onClick={() => updateIndicator(position, { x: position.x - 4 })} aria-label={`Sposta ${character.character_name} a sinistra`}>←</button>
                        <button type="button" onClick={() => updateIndicator(position, { x: position.x + 4 })} aria-label={`Sposta ${character.character_name} a destra`}>→</button>
                        <button type="button" onClick={() => updateIndicator(position, { y: position.y + 4 })} aria-label={`Sposta ${character.character_name} in basso`}>↓</button>
                        <button type="button" onClick={() => updateIndicator(position, { x: 50, y: 50 })} aria-label={`Porta ${character.character_name} al centro`}>
                          <Crosshair size={13} />
                        </button>
                      </div>
                      <div className="map-indicator-toggles">
                        <button type="button" className={position.is_visible_to_players ? "is-on" : ""} onClick={() => updateIndicator(position, { isVisibleToPlayers: !position.is_visible_to_players })}>
                          {position.is_visible_to_players ? <Eye size={13} /> : <EyeOff size={13} />}
                          {position.is_visible_to_players ? "Visibile" : "Nascosto"}
                        </button>
                        <button type="button" className={position.is_locked ? "is-on" : ""} onClick={() => updateIndicator(position, { isLocked: !position.is_locked })}>
                          {position.is_locked ? "Bloccato" : "Mobile"}
                        </button>
                      </div>
                    </article>
                  );
                })}
              </div>
            </section>
          ) : null}

          {isMaster ? (
            <form
              className="map-tool-card grid gap-3"
              onSubmit={async (event) => {
                event.preventDefault();
                if (!title.trim() || (!imageUrl.trim() && !imageFile) || isCreating) return;
                setIsCreating(true);
                try {
                  await onCreateMap?.({
                    title: title.trim(),
                    description: description.trim(),
                    imageUrl: imageUrl.trim(),
                    imageFile,
                    parentMapId: currentMap ? currentMap.id : null,
                    levelType,
                    isVisibleToPlayers
                  });
                  setTitle("");
                  setDescription("");
                  setImageUrl("");
                  setImageFile(undefined);
                } finally {
                  setIsCreating(false);
                }
              }}
            >
              <h3>
                <ImageUp size={16} /> Nuova mappa
              </h3>
              <input className="field px-3 py-2 text-sm" value={title} onChange={(event) => setTitle(event.target.value)} placeholder="Nome mappa" />
              <textarea className="field min-h-20 resize-none px-3 py-2 text-sm" value={description} onChange={(event) => setDescription(event.target.value)} placeholder="Descrizione breve" />
              <input className="field px-3 py-2 text-sm" value={imageUrl} onChange={(event) => setImageUrl(event.target.value)} placeholder="Link immagine mappa" />
              <label className="director-upload-target">
                Carica immagine mappa
                <input className="sr-only" type="file" accept="image/*" onChange={(event) => setImageFile(event.target.files?.[0])} />
              </label>
              {imageFile ? <p className="text-xs text-brass">File selezionato: {imageFile.name}</p> : null}
              <select className="field px-3 py-2 text-sm" value={levelType} onChange={(event) => setLevelType(event.target.value as NarrativeMap["level_type"])}>
                {levelOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              <label className="flex items-center gap-2 text-sm text-stone-300">
                <input type="checkbox" checked={isVisibleToPlayers} onChange={(event) => setIsVisibleToPlayers(event.target.checked)} />
                Visibile ai giocatori
              </label>
              <button className="director-primary-action" disabled={isCreating || !title.trim() || (!imageUrl.trim() && !imageFile)}>
                <Plus size={16} /> {isCreating ? "Creo mappa..." : "Crea mappa"}
              </button>
            </form>
          ) : null}
        </aside>
      </div>
    </section>
  );
}

function MapLibrary({
  maps,
  activeMap,
  isMaster,
  onSelect,
  onSetActive,
  onDelete,
  onDuplicate
}: {
  maps: NarrativeMap[];
  activeMap?: NarrativeMap;
  isMaster: boolean;
  onSelect: (map: NarrativeMap) => void;
  onSetActive?: (map: NarrativeMap) => void | Promise<void>;
  onDelete?: (map: NarrativeMap) => void | Promise<void>;
  onDuplicate?: (map: NarrativeMap) => void | Promise<void>;
}) {
  return (
    <aside className="map-library">
      <p className="px-2 pb-2 text-xs uppercase tracking-[0.22em] text-brass/80">Libreria mappe</p>
      <div className="grid gap-2">
        {maps.map((map) => (
          <article key={map.id} className={`map-library-card ${activeMap?.id === map.id ? "is-selected" : ""}`}>
            <button type="button" onClick={() => onSelect(map)} className="min-w-0 flex-1 text-left">
              <span className="map-library-thumb" style={{ backgroundImage: `url(${map.image_url})` }} />
              <span className="block truncate font-serif text-base text-white">{map.title}</span>
              <span className="mt-1 block truncate text-xs text-stone-400">{map.description || "Nessuna descrizione."}</span>
            </button>
            {isMaster ? (
              <div className="mt-2 flex gap-1">
                <button type="button" title="Mostra ai giocatori" onClick={() => onSetActive?.(map)}>
                  <Flag size={14} />
                </button>
                <button type="button" title="Duplica mappa" onClick={() => onDuplicate?.(map)}>
                  <Copy size={14} />
                </button>
                <button type="button" title="Elimina mappa" onClick={() => onDelete?.(map)}>
                  <Trash2 size={14} />
                </button>
              </div>
            ) : null}
          </article>
        ))}
      </div>
    </aside>
  );
}

function MapBreadcrumb({ maps, onSelect }: { maps: NarrativeMap[]; onSelect: (map: NarrativeMap) => void }) {
  if (!maps.length) return null;

  return (
    <nav className="map-breadcrumb" aria-label="Percorso mappa">
      {maps.map((map, index) => (
        <span key={map.id} className="inline-flex items-center gap-2">
          {index > 0 ? <span className="text-stone-600">/</span> : null}
          <button type="button" onClick={() => onSelect(map)} className={index === maps.length - 1 ? "is-current" : ""}>
            {map.title}
          </button>
        </span>
      ))}
    </nav>
  );
}

function MapViewer({
  map,
  maps,
  characters,
  npcs,
  hotspots,
  characterPositions,
  npcMarkers,
  customMarkers,
  isMaster,
  onOpenMap,
  onUpdateCharacterPosition
}: {
  map: NarrativeMap;
  maps: NarrativeMap[];
  characters: Character[];
  npcs: Npc[];
  hotspots: MapHotspot[];
  characterPositions: MapCharacterPosition[];
  npcMarkers: MapNpcMarker[];
  customMarkers: MapCustomMarker[];
  isMaster: boolean;
  onOpenMap: (mapId: string) => void;
  onUpdateCharacterPosition?: MapToolPanelProps["onUpdateCharacterPosition"];
}) {
  const shellRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLDivElement>(null);
  const [transform, setTransform] = useState<ViewTransform>({ scale: 1, x: 0, y: 0 });
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [panStart, setPanStart] = useState<{ pointerId: number; x: number; y: number; originX: number; originY: number } | null>(null);
  const [draggingPosition, setDraggingPosition] = useState<{ id: string; x: number; y: number } | null>(null);
  const [dragStart, setDragStart] = useState<{ position: MapCharacterPosition; pointerId: number } | null>(null);
  const visibleHotspots = isMaster ? hotspots : hotspots.filter((hotspot) => hotspot.is_visible_to_players);
  const visiblePositions = isMaster ? characterPositions : characterPositions.filter((position) => position.is_visible_to_players);
  const visibleNpcMarkers = isMaster ? npcMarkers : npcMarkers.filter((marker) => marker.is_visible_to_players);
  const visibleCustomMarkers = isMaster ? customMarkers : customMarkers.filter((marker) => marker.is_visible_to_players);

  function zoom(delta: number) {
    setTransform((current) => ({ ...current, scale: clamp(current.scale + delta, 0.6, 3) }));
  }

  function reset() {
    setTransform({ scale: 1, x: 0, y: 0 });
  }

  function toggleFullscreen() {
    const node = shellRef.current;
    if (!node) return;

    if (!document.fullscreenElement) {
      node.requestFullscreen?.();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen?.();
      setIsFullscreen(false);
    }
  }

  function pointerToMap(event: React.PointerEvent) {
    const node = canvasRef.current;
    const rect = node?.getBoundingClientRect();
    if (!rect) return { x: 50, y: 50 };

    const localX = (event.clientX - rect.left - transform.x) / transform.scale;
    const localY = (event.clientY - rect.top - transform.y) / transform.scale;
    return {
      x: clamp((localX / rect.width) * 100, 0, 100),
      y: clamp((localY / rect.height) * 100, 0, 100)
    };
  }

  return (
    <section className={`map-viewer ${isFullscreen ? "is-fullscreen" : ""}`} ref={shellRef}>
      <div className="map-viewer-toolbar">
        <span>
          <Map size={15} /> {map.title}
        </span>
        <div>
          <button type="button" onClick={() => zoom(-0.15)} title="Riduci zoom">
            <Minus size={15} />
          </button>
          <button type="button" onClick={reset} title="Reset vista">
            <RotateCcw size={15} />
          </button>
          <button type="button" onClick={() => zoom(0.15)} title="Aumenta zoom">
            <Plus size={15} />
          </button>
          <button type="button" onClick={toggleFullscreen} title="Fullscreen">
            <Expand size={15} />
          </button>
        </div>
      </div>
      <div
        className="map-canvas"
        ref={canvasRef}
        onWheel={(event) => {
          event.preventDefault();
          zoom(event.deltaY > 0 ? -0.1 : 0.1);
        }}
        onPointerDown={(event) => {
          if ((event.target as HTMLElement).closest("[data-map-marker]")) return;
          setPanStart({ pointerId: event.pointerId, x: event.clientX, y: event.clientY, originX: transform.x, originY: transform.y });
          event.currentTarget.setPointerCapture(event.pointerId);
        }}
        onPointerMove={(event) => {
          if (!panStart || panStart.pointerId !== event.pointerId) return;
          setTransform((current) => ({
            ...current,
            x: panStart.originX + event.clientX - panStart.x,
            y: panStart.originY + event.clientY - panStart.y
          }));
        }}
        onPointerUp={(event) => {
          if (panStart?.pointerId === event.pointerId) setPanStart(null);
        }}
      >
        <div
          className="map-canvas-layer"
          style={{ transform: `translate3d(${transform.x}px, ${transform.y}px, 0) scale(${transform.scale})`, backgroundImage: `url(${map.image_url})` }}
        >
          {visibleHotspots.map((hotspot) => (
            <button
              key={hotspot.id}
              type="button"
              data-map-marker
              className="map-hotspot-marker"
              style={{ left: `${hotspot.x}%`, top: `${hotspot.y}%`, color: hotspot.color }}
              title={`${hotspot.title} - ${hotspot.description}`}
              onClick={() => {
                if (hotspot.target_map_id && maps.some((item) => item.id === hotspot.target_map_id)) onOpenMap(hotspot.target_map_id);
              }}
            >
              <Crosshair size={18} />
            </button>
          ))}

          {visiblePositions.map((position) => {
            const character = characters.find((item) => item.id === position.character_id);
            if (!character) return null;
            const local = draggingPosition?.id === position.id ? draggingPosition : position;
            return (
              <button
                key={position.id}
                type="button"
                data-map-marker
                className={`map-character-marker ${position.is_locked ? "is-locked" : ""}`}
                style={{ left: `${local.x}%`, top: `${local.y}%`, color: character.color }}
                title={`${character.character_name} ${character.character_surname} - ${position.narrative_location || map.title}`}
                onPointerDown={(event) => {
                  if (!isMaster || position.is_locked) return;
                  event.preventDefault();
                  setDragStart({ position, pointerId: event.pointerId });
                  setDraggingPosition({ id: position.id, x: position.x, y: position.y });
                  event.currentTarget.setPointerCapture(event.pointerId);
                }}
                onPointerMove={(event) => {
                  if (!dragStart || dragStart.pointerId !== event.pointerId || dragStart.position.id !== position.id) return;
                  const next = pointerToMap(event);
                  setDraggingPosition({ id: position.id, ...next });
                }}
                onPointerUp={(event) => {
                  if (!dragStart || dragStart.pointerId !== event.pointerId || dragStart.position.id !== position.id) return;
                  const finalPosition = draggingPosition ?? position;
                  setDragStart(null);
                  setDraggingPosition(null);
                  onUpdateCharacterPosition?.(position, {
                    x: finalPosition.x,
                    y: finalPosition.y,
                    narrativeLocation: position.narrative_location || map.title,
                    isVisibleToPlayers: position.is_visible_to_players,
                    isLocked: position.is_locked
                  });
                }}
              >
                <span style={{ backgroundImage: `url(${character.portrait_url})` }} />
                <strong>{character.character_name}</strong>
              </button>
            );
          })}

          {visibleNpcMarkers.map((marker) => {
            const npc = npcs.find((item) => item.id === marker.npc_id);
            if (!npc) return null;
            return (
              <span key={marker.id} data-map-marker className="map-npc-marker" style={{ left: `${marker.x}%`, top: `${marker.y}%`, color: npc.color }} title={`${npc.name} - ${marker.status}`}>
                {npc.portrait_url ? <span style={{ backgroundImage: `url(${npc.portrait_url})` }} /> : <UsersRound size={15} />}
              </span>
            );
          })}

          {visibleCustomMarkers.map((marker) => (
            <span key={marker.id} data-map-marker className="map-custom-marker" style={{ left: `${marker.x}%`, top: `${marker.y}%`, color: marker.color }} title={`${marker.title} - ${marker.description}`}>
              <MapPinned size={17} />
            </span>
          ))}
        </div>
      </div>
      <p className="map-viewer-hint">
        <Move size={14} /> Pan e zoom liberi. {isMaster ? "Trascina i personaggi: il database si aggiorna solo al rilascio." : "Vedi solo marker e hotspot condivisi dal Master."}
      </p>
    </section>
  );
}

function MapEmptyState({ title, text }: { title: string; text: string }) {
  return (
    <div className="map-empty-state">
      <MapPinned size={22} />
      <p>{title}</p>
      <span>{text}</span>
    </div>
  );
}

function buildMapBreadcrumb(maps: NarrativeMap[], map: NarrativeMap) {
  const stack: NarrativeMap[] = [map];
  let parentId = map.parent_map_id;
  let guard = 0;

  while (parentId && guard < 12) {
    const parent = maps.find((item) => item.id === parentId);
    if (!parent) break;
    stack.unshift(parent);
    parentId = parent.parent_map_id;
    guard += 1;
  }

  return stack;
}

function buildMapCharacterPositions(map: NarrativeMap, characters: Character[], positions: MapCharacterPosition[]) {
  const existingForMap = positions.filter((position) => position.map_id === map.id);
  const positionedCharacters = new Set(existingForMap.map((position) => position.character_id));
  const virtualPositions = characters
    .filter((character) => !positionedCharacters.has(character.id))
    .map((character, index) => ({
      id: `virtual-position:${map.id}:${character.id}`,
      map_id: map.id,
      character_id: character.id,
      x: clamp(18 + (index % 4) * 18, 8, 92),
      y: clamp(22 + Math.floor(index / 4) * 16, 8, 92),
      narrative_location: map.title,
      is_visible_to_players: true,
      is_locked: false,
      updated_at: new Date(0).toISOString()
    }));

  return [...existingForMap, ...virtualPositions];
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}
