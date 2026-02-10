"use client";

import { useEffect, useRef, useCallback, useState } from "react";
import { Spring } from "@/lib/liquid-glass";
import { GlassFilter } from "./glass-filter";
import { ParamControls, useParamState } from "./param-controls";

const DEFAULTS = {
  specularOpacity: 0.5,
  saturation: 6,
  refractionScale: 1.0,
  blur: 0.2,
};

const PARAM_DEFS = [
  { key: "specularOpacity", label: "Specular Opacity", min: 0, max: 1, step: 0.01, defaultValue: DEFAULTS.specularOpacity },
  { key: "saturation", label: "Specular Saturation", min: 0, max: 20, step: 0.1, defaultValue: DEFAULTS.saturation },
  { key: "refractionScale", label: "Refraction Level", min: 0, max: 3, step: 0.01, defaultValue: DEFAULTS.refractionScale },
  { key: "blur", label: "Blur Level", min: 0, max: 5, step: 0.1, defaultValue: DEFAULTS.blur },
];

const CONFIG = {
  trackWidth: 160,
  trackHeight: 67,
  thumbWidth: 146,
  thumbHeight: 92,
  thumbRadius: 46,
  bezelWidth: 19,
  glassThickness: 47,
  refractiveIndex: 1.5,
  THUMB_REST_SCALE: 0.65,
  THUMB_ACTIVE_SCALE: 0.9,
  THUMB_REST_OFFSET: 0,
  TRAVEL: 0,
};
CONFIG.THUMB_REST_OFFSET =
  ((1 - CONFIG.THUMB_REST_SCALE) * CONFIG.thumbWidth) / 2;
CONFIG.TRAVEL =
  CONFIG.trackWidth -
  CONFIG.trackHeight -
  (CONFIG.thumbWidth - CONFIG.thumbHeight) * CONFIG.THUMB_REST_SCALE;

const BG_STYLE = {
  backgroundImage:
    "linear-gradient(to right, rgba(0,0,0,0.03) 1px, transparent 1px), linear-gradient(to bottom, rgba(0,0,0,0.03) 1px, transparent 1px), radial-gradient(120% 100% at 10% 0%, var(--lg-bg-primary), var(--lg-bg-secondary))",
  backgroundSize: "24px 24px, 24px 24px, 100% 100%",
  backgroundPosition: "12px 12px, 12px 12px, 0 0",
};

export function SwitchDemo() {
  const trackRef = useRef<HTMLDivElement>(null);
  const thumbRef = useRef<HTMLDivElement>(null);
  const cloneRef = useRef<HTMLDivElement>(null);
  const cloneInnerRef = useRef<HTMLDivElement>(null);
  const areaRef = useRef<HTMLDivElement>(null);
  const [ready, setReady] = useState(false);
  const paramState = useParamState(DEFAULTS);

  const stateRef = useRef({
    checked: true,
    pointerDown: false,
    initialPointerX: 0,
    xDragRatio: 1,
  });

  const springsRef = useRef({
    xRatio: new Spring(1, 1000, 80),
    scale: new Spring(CONFIG.THUMB_REST_SCALE, 2000, 80),
    backgroundOpacity: new Spring(1, 2000, 80),
    trackColor: new Spring(1, 1000, 80),
    scaleRatio: new Spring(0.4, 100, 10),
  });

  const animFrameRef = useRef<number | null>(null);

  const animationLoop = useCallback(() => {
    const dt = Math.min(0.032, 1 / 60);
    const s = stateRef.current;
    const sp = springsRef.current;
    const thumb = thumbRef.current;
    const track = trackRef.current;
    const clone = cloneRef.current;
    const cloneInner = cloneInnerRef.current;
    const area = areaRef.current;

    if (!thumb || !track || !clone || !cloneInner || !area) return;

    const isActive = s.pointerDown;

    sp.scale.setTarget(
      isActive ? CONFIG.THUMB_ACTIVE_SCALE : CONFIG.THUMB_REST_SCALE,
    );
    sp.backgroundOpacity.setTarget(isActive ? 0.1 : 1);
    sp.scaleRatio.setTarget(isActive ? 0.9 : 0.4);

    if (!s.pointerDown) {
      sp.xRatio.setTarget(s.checked ? 1 : 0);
    }

    const considerChecked = s.pointerDown
      ? s.xDragRatio > 0.5 ? 1 : 0
      : s.checked ? 1 : 0;
    sp.trackColor.setTarget(considerChecked);

    const xRatio = sp.xRatio.update(dt);
    const scale = sp.scale.update(dt);
    const backgroundOpacity = sp.backgroundOpacity.update(dt);
    const trackColor = sp.trackColor.update(dt);
    sp.scaleRatio.update(dt);

    const cloneOpacity = 1 - backgroundOpacity;
    clone.style.opacity = String(cloneOpacity);

    const marginLeft =
      -CONFIG.THUMB_REST_OFFSET +
      (CONFIG.trackHeight - CONFIG.thumbHeight * CONFIG.THUMB_REST_SCALE) / 2;
    const thumbX = marginLeft + xRatio * CONFIG.TRAVEL;

    thumb.style.left = thumbX + "px";
    thumb.style.transform = `translateY(-50%) scale(${scale})`;
    thumb.style.backgroundColor = `rgba(255, 255, 255, ${backgroundOpacity})`;

    if (s.pointerDown) {
      thumb.style.boxShadow =
        "0 4px 22px rgba(0,0,0,0.1), inset 2px 7px 24px rgba(0,0,0,0.09), inset -2px -7px 24px rgba(255,255,255,0.09)";
    } else {
      thumb.style.boxShadow = "0 4px 22px rgba(0,0,0,0.1)";
    }

    const offR = 148, offG = 148, offB = 159, offA = 0.47;
    const onR = 59, onG = 191, onB = 78, onA = 0.93;
    const r = Math.round(offR + (onR - offR) * trackColor);
    const g = Math.round(offG + (onG - offG) * trackColor);
    const b = Math.round(offB + (onB - offB) * trackColor);
    const a = offA + (onA - offA) * trackColor;
    const trackBgColor = `rgba(${r}, ${g}, ${b}, ${a})`;
    track.style.backgroundColor = trackBgColor;

    const areaRect = area.getBoundingClientRect();
    const containerLeft = (areaRect.width - CONFIG.trackWidth) / 2;
    const containerTop = (areaRect.height - CONFIG.trackHeight) / 2;
    const thumbYOffset = CONFIG.trackHeight / 2 - CONFIG.thumbHeight / 2;

    cloneInner.style.width = areaRect.width + "px";
    cloneInner.style.height = areaRect.height + "px";
    cloneInner.style.transform = `translate(${-(containerLeft + thumbX)}px, ${-(containerTop + thumbYOffset)}px)`;
    cloneInner.style.setProperty("--switch-track-color", trackBgColor);
    cloneInner.style.setProperty("--track-left", `${containerLeft}px`);
    cloneInner.style.setProperty("--track-top", `${containerTop}px`);

    const allSettled = Object.values(sp).every((spring) => spring.isSettled());
    if (!allSettled) {
      animFrameRef.current = requestAnimationFrame(animationLoop);
    } else {
      animFrameRef.current = null;
    }
  }, []);

  const startAnimation = useCallback(() => {
    if (!animFrameRef.current) {
      animFrameRef.current = requestAnimationFrame(animationLoop);
    }
  }, [animationLoop]);

  useEffect(() => {
    const thumb = thumbRef.current;
    const track = trackRef.current;
    const clone = cloneRef.current;
    if (!thumb || !track || !clone) return;

    clone.style.filter = "url(#switchGlassFilter)";
    startAnimation();
    setReady(true);

    const s = stateRef.current;

    const onPointerDown = (e: MouseEvent | TouchEvent) => {
      e.preventDefault();
      e.stopPropagation();
      s.pointerDown = true;
      s.initialPointerX = "touches" in e ? e.touches[0].clientX : e.clientX;
      s.xDragRatio = s.checked ? 1 : 0;
      startAnimation();
    };

    const onPointerMove = (e: MouseEvent | TouchEvent) => {
      if (!s.pointerDown) return;
      e.stopPropagation();
      const clientX = "touches" in e ? e.touches[0].clientX : e.clientX;
      const baseRatio = s.checked ? 1 : 0;
      const displacementX = clientX - s.initialPointerX;
      const ratio = baseRatio + displacementX / CONFIG.TRAVEL;

      const overflow = ratio < 0 ? -ratio : ratio > 1 ? ratio - 1 : 0;
      const overflowSign = ratio < 0 ? -1 : 1;
      const dampedOverflow = (overflowSign * overflow) / 22;
      s.xDragRatio = Math.min(1, Math.max(0, ratio)) + dampedOverflow;

      springsRef.current.xRatio.setTarget(s.xDragRatio);
      startAnimation();
    };

    const onPointerUp = (e: MouseEvent | TouchEvent) => {
      if (!s.pointerDown) return;
      s.pointerDown = false;

      const clientX =
        "changedTouches" in e
          ? (e as TouchEvent).changedTouches[0].clientX
          : (e as MouseEvent).clientX;
      const distance = Math.abs(clientX - s.initialPointerX);

      if (distance < 4) {
        s.checked = !s.checked;
      } else {
        s.checked = s.xDragRatio > 0.5;
      }
      startAnimation();
    };

    const trackClick = (e: MouseEvent) => {
      if (e.target === track) {
        s.checked = !s.checked;
        startAnimation();
      }
    };

    thumb.addEventListener("mousedown", onPointerDown);
    thumb.addEventListener("touchstart", onPointerDown, { passive: false });
    track.addEventListener("click", trackClick);
    window.addEventListener("mousemove", onPointerMove);
    window.addEventListener("touchmove", onPointerMove, { passive: false });
    window.addEventListener("mouseup", onPointerUp);
    window.addEventListener("touchend", onPointerUp);

    return () => {
      thumb.removeEventListener("mousedown", onPointerDown);
      thumb.removeEventListener("touchstart", onPointerDown);
      track.removeEventListener("click", trackClick);
      window.removeEventListener("mousemove", onPointerMove);
      window.removeEventListener("touchmove", onPointerMove);
      window.removeEventListener("mouseup", onPointerUp);
      window.removeEventListener("touchend", onPointerUp);
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [startAnimation]);

  return (
    <div>
      <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
        <span className="w-1 h-5 rounded-sm bg-gradient-to-b from-[#667eea] to-[#764ba2]" />
        Switch
      </h2>
      <div
        ref={areaRef}
        className="relative h-[200px] rounded-2xl overflow-hidden border border-[var(--lg-border)] flex items-center justify-center"
        style={{
          ...BG_STYLE,
          opacity: ready ? 1 : 0,
          transition: "opacity 0.3s",
        }}
      >
        <div
          ref={trackRef}
          className="relative cursor-pointer"
          style={{
            width: CONFIG.trackWidth,
            height: CONFIG.trackHeight,
            borderRadius: CONFIG.trackHeight / 2,
            backgroundColor: "rgba(59, 191, 78, 0.93)",
          }}
        >
          <div
            ref={thumbRef}
            className="absolute cursor-grab active:cursor-grabbing select-none"
            style={{
              width: CONFIG.thumbWidth,
              height: CONFIG.thumbHeight,
              borderRadius: CONFIG.thumbRadius,
              top: "50%",
              transform: `translateY(-50%) scale(${CONFIG.THUMB_REST_SCALE})`,
              backgroundColor: "white",
              boxShadow: "0 4px 22px rgba(0,0,0,0.1)",
              touchAction: "none",
              overflow: "hidden",
              zIndex: 2,
            }}
          >
            <div
              ref={cloneRef}
              className="absolute inset-0 overflow-hidden"
              style={{ borderRadius: "inherit", opacity: 0, zIndex: 1 }}
            >
              <div
                ref={cloneInnerRef}
                className="absolute top-0 left-0 pointer-events-none switch-thumb-clone-inner"
                style={BG_STYLE}
              />
            </div>
          </div>
        </div>
      </div>

      <GlassFilter
        filterId="switchGlassFilter"
        width={CONFIG.thumbWidth}
        height={CONFIG.thumbHeight}
        radius={CONFIG.thumbRadius}
        bezelWidth={CONFIG.bezelWidth}
        glassThickness={CONFIG.glassThickness}
        refractiveIndex={CONFIG.refractiveIndex}
        refractionScale={paramState.values.refractionScale}
        specularOpacity={paramState.values.specularOpacity}
        blur={paramState.values.blur}
        saturation={paramState.values.saturation}
      />

      <ParamControls
        params={PARAM_DEFS}
        values={paramState.values}
        onChange={paramState.onChange}
        onReset={paramState.onReset}
      />
    </div>
  );
}