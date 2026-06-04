import { CalendarDays, Eye, ImageIcon, LockKeyhole } from "lucide-react";
import type { Scene } from "@/lib/types";
import { shortTime } from "@/lib/utils";

type SceneStageProps = {
  scene: Scene;
  compact?: boolean;
};

export function SceneStage({ scene, compact = false }: SceneStageProps) {
  const isVideo = scene.media_type === "video";
  const mediaUrl = isVideo ? scene.video_url || scene.image_url : scene.image_url;
  const mediaClassName = compact ? "scene-stage-media aspect-[21/7] max-h-[22rem] w-full" : "scene-stage-media aspect-video w-full";

  return (
    <section className={`scene-stage glass-panel overflow-hidden rounded-lg ${compact ? "scene-stage--compact" : ""}`}>
      <div className="scene-stage-badge">
        <Eye size={13} /> {isVideo ? "Video scena" : "Scena attuale"}
      </div>
      {scene.visibility === "private" ? (
        <div className="scene-stage-private-badge">
          <LockKeyhole size={13} /> Privata
        </div>
      ) : null}
      {isVideo ? (
        <video
          className={`${mediaClassName} bg-black object-cover`}
          src={mediaUrl}
          aria-label={scene.title}
          autoPlay
          muted
          loop={scene.loop_video !== false}
          playsInline
          controls
        />
      ) : (
        <div
          className={`${mediaClassName} bg-cover bg-center`}
          style={{ backgroundImage: `url(${mediaUrl})` }}
          aria-label={scene.title}
        />
      )}
      <div className="scene-stage-caption border-t border-white/10 bg-ink-900/75 p-4 sm:p-5">
        <div className="mb-3 flex flex-wrap items-center gap-2 text-xs text-slate-300">
          <span className="scene-meta-chip inline-flex items-center gap-1 rounded-md border border-white/10 bg-white/[0.04] px-2 py-1">
            <ImageIcon size={13} /> {isVideo ? "Video scena" : "Scena attuale"}
          </span>
          {scene.visibility === "private" ? (
            <span className="scene-meta-chip inline-flex items-center gap-1 rounded-md border border-ember-400/20 bg-ember-500/10 px-2 py-1 text-ember-100">
              Privata
            </span>
          ) : null}
          <span className="scene-meta-chip inline-flex items-center gap-1 rounded-md border border-white/10 bg-white/[0.04] px-2 py-1">
            <CalendarDays size={13} /> {shortTime(scene.created_at)}
          </span>
        </div>
        <h2 className="text-2xl font-semibold text-white sm:text-3xl">{scene.title}</h2>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-300 sm:text-base">{scene.description}</p>
      </div>
    </section>
  );
}
