"use client";

import { useEffect, useRef, useCallback, useState } from "react";
import { Play, Pause, SkipBack, SkipForward } from "lucide-react";
import { GlassFilter } from "./glass-filter";
import { ParamControls, useParamState } from "./param-controls";

const CONFIG = {
  width: 340,
  height: 120,
  radius: 32,
  bezelWidth: 22,
  glassThickness: 80,
  refractiveIndex: 1.4,
};

const DEFAULTS = {
  specularOpacity: 0.40,
  saturation: 6,
  refractionScale: 1.00,
  blur: 1.0,
  progressiveBlurIntensity: 1.00,
  glassBgOpacity: 0.60,
};

const PARAM_DEFS = [
  { key: "specularOpacity", label: "Specular Opacity", min: 0, max: 1, step: 0.01, defaultValue: DEFAULTS.specularOpacity },
  { key: "saturation", label: "Specular Saturation", min: 0, max: 20, step: 0.1, defaultValue: DEFAULTS.saturation },
  { key: "refractionScale", label: "Refraction Level", min: 0, max: 3, step: 0.01, defaultValue: DEFAULTS.refractionScale },
  { key: "blur", label: "Blur Level", min: 0, max: 40, step: 0.1, defaultValue: DEFAULTS.blur },
  { key: "progressiveBlurIntensity", label: "Progressive Blur Intensity", min: 0, max: 2, step: 0.01, defaultValue: DEFAULTS.progressiveBlurIntensity },
  { key: "glassBgOpacity", label: "Glass Background Opacity", min: 0, max: 1, step: 0.01, defaultValue: DEFAULTS.glassBgOpacity },
];

function AlbumBg() {
  return (
    <>
      <div className="absolute inset-0 flex items-center justify-center opacity-30">
        <div className="w-48 h-48 rounded-2xl bg-gradient-to-br from-[#e94560] to-[#533483] rotate-12" />
      </div>
      <div className="absolute inset-0 flex items-center justify-center opacity-20">
        <div className="w-40 h-40 rounded-2xl bg-gradient-to-br from-[#f093fb] to-[#f5576c] -rotate-6" />
      </div>
    </>
  );
}

export function PlayerDemo() {
  const areaRef = useRef<HTMLDivElement>(null);
  const playerRef = useRef<HTMLDivElement>(null);
  const cloneRef = useRef<HTMLDivElement>(null);
  const cloneInnerRef = useRef<HTMLDivElement>(null);
  const [ready, setReady] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState(35);
  const paramState = useParamState(DEFAULTS);

  const updateClonePosition = useCallback(() => {
    const player = playerRef.current;
    const cloneInner = cloneInnerRef.current;
    const area = areaRef.current;
    if (!player || !cloneInner || !area) return;

    const areaRect = area.getBoundingClientRect();
    const playerRect = player.getBoundingClientRect();

    cloneInner.style.width = areaRect.width + "px";
    cloneInner.style.height = areaRect.height + "px";
    cloneInner.style.transform = `translate(${-(playerRect.left - areaRect.left)}px, ${-(playerRect.top - areaRect.top)}px)`;
  }, []);

  useEffect(() => {
    const clone = cloneRef.current;
    if (!clone) return;

    clone.style.filter = "url(#playerGlassFilter)";
    updateClonePosition();
    setReady(true);

    const handleResize = () => updateClonePosition();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [updateClonePosition]);

  // Simulate progress
  useEffect(() => {
    if (!playing) return;
    const interval = setInterval(() => {
      setProgress((p) => {
        if (p >= 100) {
          setPlaying(false);
          return 0;
        }
        return p + 0.5;
      });
    }, 100);
    return () => clearInterval(interval);
  }, [playing]);

  return (
    <div>
      <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
        <span className="w-1 h-5 rounded-sm bg-gradient-to-b from-[#667eea] to-[#764ba2]" />
        Music Player
      </h2>
      <div
        ref={areaRef}
        className="relative h-[280px] rounded-2xl overflow-hidden border border-[var(--lg-border)] flex items-center justify-center"
        style={{
          background:
            "linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)",
          opacity: ready ? 1 : 0,
          transition: "opacity 0.3s",
        }}
      >
        {/* Background album art */}
        <AlbumBg />

        {/* Player */}
        <div
          ref={playerRef}
          className="relative z-10"
          style={{
            width: CONFIG.width,
            height: CONFIG.height,
            maxWidth: "calc(100% - 32px)",
            borderRadius: CONFIG.radius,
            overflow: "hidden",
          }}
        >
          {/* Clone layer with SVG filter */}
          <div
            ref={cloneRef}
            className="absolute inset-0 overflow-hidden"
            style={{ borderRadius: "inherit", zIndex: 1 }}
          >
            <div
              ref={cloneInnerRef}
              className="absolute top-0 left-0 pointer-events-none"
              style={{
                background:
                  "linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)",
              }}
            >
              <AlbumBg />
            </div>
          </div>

          {/* Glass inner shadow */}
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              borderRadius: "inherit",
              zIndex: 2,
              boxShadow:
                "0 4px 20px rgba(0,0,0,0.25), inset 0 1px 0 rgba(255,255,255,0.15), inset 0 -1px 0 rgba(0,0,0,0.15)",
            }}
          />

          {/* Content */}
          <div
            className="relative flex items-center h-full px-5 gap-4"
            style={{ zIndex: 3 }}
          >
            {/* Album art */}
            <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-[#e94560] to-[#533483] flex-shrink-0 flex items-center justify-center">
              <div className="w-6 h-6 rounded-full border-2 border-white/50" />
            </div>

            <div className="flex-1 min-w-0">
              <div className="text-white text-sm font-semibold truncate">
                Midnight Groove
              </div>
              <div className="text-white/50 text-xs truncate mb-2">
                Liquid Glass Band
              </div>

              {/* Progress bar */}
              <div className="w-full h-1 bg-white/10 rounded-full overflow-hidden mb-2">
                <div
                  className="h-full bg-white/60 rounded-full"
                  style={{
                    width: `${progress}%`,
                    transition: "width 0.1s linear",
                  }}
                />
              </div>

              {/* Controls */}
              <div className="flex items-center gap-4 justify-center">
                <button
                  type="button"
                  className="text-white/60 hover:text-white transition-colors bg-transparent border-none cursor-pointer"
                  onClick={() => setProgress(0)}
                >
                  <SkipBack className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  className="text-white hover:text-white/80 transition-colors bg-transparent border-none cursor-pointer"
                  onClick={() => setPlaying(!playing)}
                >
                  {playing ? (
                    <Pause className="w-5 h-5" />
                  ) : (
                    <Play className="w-5 h-5" />
                  )}
                </button>
                <button
                  type="button"
                  className="text-white/60 hover:text-white transition-colors bg-transparent border-none cursor-pointer"
                  onClick={() => setProgress(0)}
                >
                  <SkipForward className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* SVG Filter */}
      <GlassFilter
        filterId="playerGlassFilter"
        width={CONFIG.width}
        height={CONFIG.height}
        radius={CONFIG.radius}
        bezelWidth={CONFIG.bezelWidth}
        glassThickness={CONFIG.glassThickness}
        refractiveIndex={CONFIG.refractiveIndex}
        refractionScale={paramState.values.refractionScale}
        specularOpacity={paramState.values.specularOpacity}
        blur={paramState.values.blur}
        saturation={paramState.values.saturation}
        glassBgOpacity={paramState.values.glassBgOpacity}
        progressiveBlurIntensity={paramState.values.progressiveBlurIntensity}
      />

      {/* Parameter Controls */}
      <ParamControls
        params={PARAM_DEFS}
        values={paramState.values}
        onChange={paramState.onChange}
        onReset={paramState.onReset}
      />
    </div>
  );
}