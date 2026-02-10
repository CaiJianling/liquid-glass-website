"use client";

import { useEffect, useRef, useCallback, useState } from "react";
import { Spring } from "@/lib/liquid-glass";
import { GlassFilter } from "./glass-filter";
import { ParamControls, useParamState } from "./param-controls";

const DEFAULTS = {
  specularOpacity: 0.4,
  saturation: 1.0,
  refractionScale: 1.0,
  blur: 0.0,
};

const PARAM_DEFS = [
  { key: "specularOpacity", label: "Specular Opacity", min: 0, max: 1, step: 0.01, defaultValue: DEFAULTS.specularOpacity },
  { key: "saturation", label: "Saturation", min: 0, max: 20, step: 0.1, defaultValue: DEFAULTS.saturation },
  { key: "refractionScale", label: "Refraction Level", min: 0, max: 3, step: 0.01, defaultValue: DEFAULTS.refractionScale },
  { key: "blur", label: "Blur Level", min: 0, max: 5, step: 0.1, defaultValue: DEFAULTS.blur },
];

const CONFIG = {
  thumbWidth: 90,
  thumbHeight: 60,
  thumbRadius: 30,
  trackWidth: 330,
  trackHeight: 14,
  bezelWidth: 16,
  glassThickness: 80,
  refractiveIndex: 1.45,
  SCALE_REST: 0.6,
  SCALE_DRAG: 1,
};

const BG_STYLE = {
  backgroundImage:
    "linear-gradient(to right, rgba(0,0,0,0.03) 1px, transparent 1px), linear-gradient(to bottom, rgba(0,0,0,0.03) 1px, transparent 1px), radial-gradient(120% 100% at 10% 0%, var(--lg-bg-primary), var(--lg-bg-secondary))",
  backgroundSize: "24px 24px, 24px 24px, 100% 100%",
  backgroundPosition: "12px 12px, 12px 12px, 0 0",
};

export function SliderDemo() {
  const areaRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const fillRef = useRef<HTMLDivElement>(null);
  const thumbRef = useRef<HTMLDivElement>(null);
  const cloneRef = useRef<HTMLDivElement>(null);
  const cloneInnerRef = useRef<HTMLDivElement>(null);
  const [ready, setReady] = useState(false);
  const paramState = useParamState(DEFAULTS);

  const stateRef = useRef({
    value: 40,
    pointerDown: false,
  });

  const springsRef = useRef({
    scale: new Spring(CONFIG.SCALE_REST, 2000, 80),
    backgroundOpacity: new Spring(1, 2000, 80),
  });

  const animFrameRef = useRef<number | null>(null);

  const updateSliderUI = useCallback(() => {
    const s = stateRef.current;
    const fill = fillRef.current;
    const thumb = thumbRef.current;
    const cloneInner = cloneInnerRef.current;
    const area = areaRef.current;

    if (!fill || !thumb || !cloneInner || !area) return;

    fill.style.width = s.value + "%";

    const thumbWidthRest = CONFIG.thumbWidth * CONFIG.SCALE_REST;
    const ratio = s.value / 100;
    const x0 = thumbWidthRest / 2;
    const x100 = CONFIG.trackWidth - thumbWidthRest / 2;
    const thumbCenterX = x0 + ratio * (x100 - x0);
    const thumbX = thumbCenterX - CONFIG.thumbWidth / 2;
    thumb.style.left = thumbX + "px";

    const areaRect = area.getBoundingClientRect();
    const containerLeft = (areaRect.width - CONFIG.trackWidth) / 2;
    const containerTop = (areaRect.height - CONFIG.thumbHeight) / 2;

    cloneInner.style.width = areaRect.width + "px";
    cloneInner.style.height = areaRect.height + "px";
    cloneInner.style.transform = `translate(${-(containerLeft + thumbX)}px, ${-containerTop}px)`;

    const trackTop = (CONFIG.thumbHeight - CONFIG.trackHeight) / 2;
    cloneInner.style.setProperty("--track-left", `${containerLeft}px`);
    cloneInner.style.setProperty("--track-top", `${containerTop + trackTop}px`);
    cloneInner.style.setProperty("--fill-width", String(s.value));
  }, []);

  const animationLoop = useCallback(() => {
    const dt = Math.min(0.032, 1 / 60);
    const s = stateRef.current;
    const sp = springsRef.current;
    const thumb = thumbRef.current;
    const clone = cloneRef.current;

    if (!thumb || !clone) return;

    const isActive = s.pointerDown;
    sp.scale.setTarget(isActive ? CONFIG.SCALE_DRAG : CONFIG.SCALE_REST);
    sp.backgroundOpacity.setTarget(isActive ? 0.1 : 1);

    const scale = sp.scale.update(dt);
    const backgroundOpacity = sp.backgroundOpacity.update(dt);

    thumb.style.transform = `scale(${scale})`;
    thumb.style.backgroundColor = `rgba(255, 255, 255, ${backgroundOpacity})`;

    const cloneOpacity = 1 - backgroundOpacity;
    clone.style.opacity = String(cloneOpacity);

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

    clone.style.filter = "url(#sliderGlassFilter)";
    updateSliderUI();
    startAnimation();
    setReady(true);

    const s = stateRef.current;
    const thumbWidthRest = CONFIG.thumbWidth * CONFIG.SCALE_REST;

    const onPointerDown = (e: MouseEvent | TouchEvent) => {
      e.preventDefault();
      s.pointerDown = true;
      startAnimation();
    };

    const onPointerMove = (e: MouseEvent | TouchEvent) => {
      if (!s.pointerDown) return;
      e.preventDefault();

      const clientX = "touches" in e ? e.touches[0].clientX : e.clientX;
      const trackRect = track.getBoundingClientRect();

      const x0 = trackRect.left + thumbWidthRest / 2;
      const x100 = trackRect.right - thumbWidthRest / 2;
      const trackInsideWidth = x100 - x0;

      const x = Math.max(x0, Math.min(x100, clientX));
      const ratio = (x - x0) / trackInsideWidth;
      s.value = Math.max(0, Math.min(100, ratio * 100));

      updateSliderUI();
    };

    const onPointerUp = () => {
      s.pointerDown = false;
      startAnimation();
    };

    const trackDown = (e: MouseEvent) => {
      onPointerDown(e);
      onPointerMove(e);
    };

    thumb.addEventListener("mousedown", onPointerDown);
    thumb.addEventListener("touchstart", onPointerDown, { passive: false });
    track.addEventListener("mousedown", trackDown);
    window.addEventListener("mousemove", onPointerMove);
    window.addEventListener("touchmove", onPointerMove, { passive: false });
    window.addEventListener("mouseup", onPointerUp);
    window.addEventListener("touchend", onPointerUp);

    const handleResize = () => updateSliderUI();
    window.addEventListener("resize", handleResize);

    return () => {
      thumb.removeEventListener("mousedown", onPointerDown);
      thumb.removeEventListener("touchstart", onPointerDown);
      track.removeEventListener("mousedown", trackDown);
      window.removeEventListener("mousemove", onPointerMove);
      window.removeEventListener("touchmove", onPointerMove);
      window.removeEventListener("mouseup", onPointerUp);
      window.removeEventListener("touchend", onPointerUp);
      window.removeEventListener("resize", handleResize);
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [updateSliderUI, startAnimation]);

  return (
    <div>
      <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
        <span className="w-1 h-5 rounded-sm bg-gradient-to-b from-[#667eea] to-[#764ba2]" />
        Slider
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
            height: CONFIG.thumbHeight,
            display: "flex",
            alignItems: "center",
          }}
        >
          <div
            className="absolute rounded-full"
            style={{
              width: CONFIG.trackWidth,
              height: CONFIG.trackHeight,
              top: (CONFIG.thumbHeight - CONFIG.trackHeight) / 2,
              left: 0,
              backgroundColor: "rgba(148, 148, 159, 0.3)",
            }}
          >
            <div
              ref={fillRef}
              className="h-full rounded-full bg-[#667eea]"
              style={{ width: "40%", transition: "none" }}
            />
          </div>

          <div
            ref={thumbRef}
            className="absolute cursor-grab active:cursor-grabbing select-none"
            style={{
              width: CONFIG.thumbWidth,
              height: CONFIG.thumbHeight,
              borderRadius: CONFIG.thumbRadius,
              backgroundColor: "white",
              boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
              touchAction: "none",
              overflow: "hidden",
              zIndex: 2,
              transform: `scale(${CONFIG.SCALE_REST})`,
            }}
          >
            <div
              ref={cloneRef}
              className="absolute inset-0 overflow-hidden"
              style={{ borderRadius: "inherit", opacity: 0, zIndex: 1 }}
            >
              <div
                ref={cloneInnerRef}
                className="absolute top-0 left-0 pointer-events-none slider-thumb-clone-inner"
                style={BG_STYLE}
              />
            </div>
          </div>
        </div>
      </div>

      <GlassFilter
        filterId="sliderGlassFilter"
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
