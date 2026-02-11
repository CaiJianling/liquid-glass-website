"use client";

import { useEffect, useRef, useCallback, useState } from "react";
import { Spring } from "@/lib/liquid-glass";
import { GlassFilter } from "./glass-filter";
import { ParamControls, useParamState } from "./param-controls";

const DEFAULTS = {
  specularOpacity: 0.5,
  saturation: 9,
  refractionScale: 1.0,
};

const PARAM_DEFS = [
  { key: "specularOpacity", label: "Specular Opacity", min: 0, max: 1, step: 0.01, defaultValue: DEFAULTS.specularOpacity },
  { key: "saturation", label: "Saturation", min: 0, max: 20, step: 0.1, defaultValue: DEFAULTS.saturation },
  { key: "refractionScale", label: "Refraction Level", min: 0, max: 3, step: 0.01, defaultValue: DEFAULTS.refractionScale },
];

const GLASS = {
  objectWidth: 200,
  objectHeight: 140,
  radius: 70,
  bezelWidth: 30,
  glassThickness: 150,
  refractiveIndex: 1.5,
};

function BackgroundContent() {
  return (
    <div className="absolute inset-0 grid grid-cols-1 md:grid-cols-2 gap-8 p-8">
      <div className="flex flex-col justify-center">
        <div className="flex items-center gap-3 text-red-500 mb-4">
          <div className="h-0.5 w-10 bg-current" />
          <span className="uppercase tracking-[0.25em] text-[11px] font-medium">
            Optics Study
          </span>
        </div>
        <h3 className="text-[clamp(2rem,5vw,3.5rem)] font-extrabold leading-[0.95] mb-4">
          Liquid Glass {" "}
          <span className="opacity-40">{"--"} Precision Lens</span>
        </h3>
        <div className="text-base leading-relaxed text-[var(--lg-text-secondary)]">
          <p className="mb-3">
            Drag the capsule to bend the page. This lens is a compact SVG
            displacement rig that refracts whatever sits beneath it.
          </p>
          <p className="mb-3">
            The field comes from a rounded bezel profile; pixels are pushed
            along its gradient, then topped with a subtle specular bloom for
            depth.
          </p>
          <p>
            Sweep across strong edges {"--"} high contrast makes the bend snap.
          </p>
        </div>
      </div>
      <div className="relative rounded-xl overflow-hidden shadow-lg">
        <div className="w-full h-full bg-gradient-to-br from-[#667eea] to-[#764ba2] flex items-center justify-center">
          <div className="text-center text-white p-6">
            <div className="text-6xl font-extrabold mb-2">LG</div>
            <div className="text-sm opacity-80">Liquid Glass Demo</div>
          </div>
        </div>
      </div>
    </div>
  );
}

const BG_STYLE = {
  backgroundImage:
    "linear-gradient(to right, rgba(0,0,0,0.03) 1px, transparent 1px), linear-gradient(to bottom, rgba(0,0,0,0.03) 1px, transparent 1px), radial-gradient(120% 100% at 10% 0%, var(--lg-bg-primary), var(--lg-bg-secondary))",
  backgroundSize: "24px 24px, 24px 24px, 100% 100%",
  backgroundPosition: "12px 12px, 12px 12px, 0 0",
};

export function MagnifierDemo() {
  const demoAreaRef = useRef<HTMLDivElement>(null);
  const glassRef = useRef<HTMLDivElement>(null);
  const glassInnerRef = useRef<HTMLDivElement>(null);
  const cloneRef = useRef<HTMLDivElement>(null);
  const cloneInnerRef = useRef<HTMLDivElement>(null);
  const stateRef = useRef({
    isDragging: false,
    dragOffset: { x: 0, y: 0 },
    velocityX: 0,
    velocityY: 0,
    lastX: 0,
    lastY: 0,
    lastTime: 0,
  });
  const springsRef = useRef({
    scale: new Spring(0.85, 400, 25),
    scaleX: new Spring(1, 400, 30),
    scaleY: new Spring(1, 400, 30),
    shadowOffsetX: new Spring(0, 400, 30),
    shadowOffsetY: new Spring(4, 400, 30),
    shadowBlur: new Spring(12, 400, 30),
    shadowAlpha: new Spring(0.15, 300, 25),
  });
  const animFrameRef = useRef<number | null>(null);
  const [ready, setReady] = useState(false);
  const paramState = useParamState(DEFAULTS);

  const updateClonePosition = useCallback(() => {
    const glass = glassRef.current;
    const cloneInner = cloneInnerRef.current;
    const area = demoAreaRef.current;
    if (!glass || !cloneInner || !area) return;

    const areaRect = area.getBoundingClientRect();
    const glassLeft = parseFloat(glass.style.left) || 0;
    const glassTop = parseFloat(glass.style.top) || 0;

    cloneInner.style.width = areaRect.width + "px";
    cloneInner.style.height = areaRect.height + "px";
    cloneInner.style.transform = `translate(${-glassLeft}px, ${-glassTop}px)`;
  }, []);

  const animationLoop = useCallback(() => {
    const dt = Math.min(0.032, 1 / 60);
    const s = stateRef.current;
    const sp = springsRef.current;
    const glass = glassRef.current;
    const glassInner = glassInnerRef.current;

    if (!glass || !glassInner) return;

    if (s.isDragging) {
      sp.scale.setTarget(1.0);
      sp.shadowOffsetX.setTarget(4);
      sp.shadowOffsetY.setTarget(16);
      sp.shadowBlur.setTarget(24);
      sp.shadowAlpha.setTarget(0.22);
    } else {
      sp.scale.setTarget(0.85);
      sp.shadowOffsetX.setTarget(0);
      sp.shadowOffsetY.setTarget(4);
      sp.shadowBlur.setTarget(12);
      sp.shadowAlpha.setTarget(0.15);
    }

    const velocityMagnitude = Math.sqrt(s.velocityX ** 2 + s.velocityY ** 2);
    const squishAmount = Math.min(0.15, velocityMagnitude / 3000);

    if (velocityMagnitude > 50) {
      const vxNorm = s.velocityX / velocityMagnitude;
      const vyNorm = s.velocityY / velocityMagnitude;
      sp.scaleX.setTarget(1 + squishAmount * Math.abs(vxNorm) - squishAmount * 0.5 * Math.abs(vyNorm));
      sp.scaleY.setTarget(1 + squishAmount * Math.abs(vyNorm) - squishAmount * 0.5 * Math.abs(vxNorm));
    } else {
      sp.scaleX.setTarget(1);
      sp.scaleY.setTarget(1);
    }

    const scale = sp.scale.update(dt);
    const scaleX = sp.scaleX.update(dt);
    const scaleY = sp.scaleY.update(dt);
    const shadowOffsetX = sp.shadowOffsetX.update(dt);
    const shadowOffsetY = sp.shadowOffsetY.update(dt);
    const shadowBlur = sp.shadowBlur.update(dt);
    const shadowAlpha = sp.shadowAlpha.update(dt);

    glass.style.transform = `scale(${scale * scaleX}, ${scale * scaleY})`;
    
    // Apply outer shadow to the glass container
    glass.style.boxShadow = `${shadowOffsetX}px ${shadowOffsetY}px ${shadowBlur}px rgba(0, 0, 0, ${shadowAlpha})`;

    const insetAlpha = shadowAlpha * 0.6;
    glassInner.style.boxShadow = `
      inset ${shadowOffsetX * 0.3}px ${shadowOffsetY * 0.4}px 16px rgba(0, 0, 0, ${insetAlpha}),
      inset ${-shadowOffsetX * 0.3}px ${-shadowOffsetY * 0.4}px 16px rgba(255, 255, 255, ${insetAlpha * 0.8})
    `;

    if (!s.isDragging) {
      s.velocityX *= 0.95;
      s.velocityY *= 0.95;
    }

    const allSettled = 
      Object.values(sp).every((spring) => spring.isSettled()) &&
      Math.abs(s.velocityX) < 1 &&
      Math.abs(s.velocityY) < 1;

    if (!allSettled) {
      animFrameRef.current = requestAnimationFrame(animationLoop);
    } else {
      animFrameRef.current = null;
    }
  }, []);

  const startAnimationLoop = useCallback(() => {
    if (!animFrameRef.current) {
      animFrameRef.current = requestAnimationFrame(animationLoop);
    }
  }, [animationLoop]);

  useEffect(() => {
    const glass = glassRef.current;
    const area = demoAreaRef.current;
    const clone = cloneRef.current;
    if (!glass || !area || !clone) return;

    const areaRect = area.getBoundingClientRect();
    glass.style.left = (areaRect.width - GLASS.objectWidth) / 2 + "px";
    glass.style.top = (areaRect.height - GLASS.objectHeight) / 2 + "px";

    clone.style.filter = "url(#magGlassFilter)";

    updateClonePosition();
    springsRef.current.scale.value = 0.85;
    springsRef.current.scale.target = 0.85;
    startAnimationLoop();
    setReady(true);

    const s = stateRef.current;

    const startDrag = (e: MouseEvent | TouchEvent) => {
      e.preventDefault();
      s.isDragging = true;

      const clientX = "touches" in e ? e.touches[0].clientX : e.clientX;
      const clientY = "touches" in e ? e.touches[0].clientY : e.clientY;
      const rect = glass.getBoundingClientRect();
      const currentScale = springsRef.current.scale.value;

      s.dragOffset.x = (clientX - rect.left) / currentScale;
      s.dragOffset.y = (clientY - rect.top) / currentScale;
      s.lastX = clientX;
      s.lastY = clientY;
      s.lastTime = performance.now();
      s.velocityX = 0;
      s.velocityY = 0;

      startAnimationLoop();
    };

    const drag = (e: MouseEvent | TouchEvent) => {
      if (!s.isDragging) return;
      e.preventDefault();

      const clientX = "touches" in e ? e.touches[0].clientX : e.clientX;
      const clientY = "touches" in e ? e.touches[0].clientY : e.clientY;
      const aRect = area.getBoundingClientRect();

      const now = performance.now();
      const dt = Math.max(1, now - s.lastTime) / 1000;
      s.velocityX = (clientX - s.lastX) / dt;
      s.velocityY = (clientY - s.lastY) / dt;
      s.lastX = clientX;
      s.lastY = clientY;
      s.lastTime = now;

      let newX = clientX - aRect.left - s.dragOffset.x;
      let newY = clientY - aRect.top - s.dragOffset.y;

      const maxX = aRect.width - GLASS.objectWidth;
      const maxY = aRect.height - GLASS.objectHeight;

      if (newX < 0) newX = newX * 0.3;
      else if (newX > maxX) newX = maxX + (newX - maxX) * 0.3;
      if (newY < 0) newY = newY * 0.3;
      else if (newY > maxY) newY = maxY + (newY - maxY) * 0.3;

      glass.style.left = newX + "px";
      glass.style.top = newY + "px";
      updateClonePosition();
    };

    const endDrag = () => {
      if (!s.isDragging) return;
      s.isDragging = false;

      const aRect = area.getBoundingClientRect();
      let currentX = parseFloat(glass.style.left) || 0;
      let currentY = parseFloat(glass.style.top) || 0;
      const maxX = aRect.width - GLASS.objectWidth;
      const maxY = aRect.height - GLASS.objectHeight;
      currentX = Math.max(0, Math.min(currentX, maxX));
      currentY = Math.max(0, Math.min(currentY, maxY));
      glass.style.left = currentX + "px";
      glass.style.top = currentY + "px";
      updateClonePosition();
      startAnimationLoop();
    };

    glass.addEventListener("mousedown", startDrag);
    glass.addEventListener("touchstart", startDrag, { passive: false });
    document.addEventListener("mousemove", drag);
    document.addEventListener("touchmove", drag, { passive: false });
    document.addEventListener("mouseup", endDrag);
    document.addEventListener("touchend", endDrag);

    return () => {
      glass.removeEventListener("mousedown", startDrag);
      glass.removeEventListener("touchstart", startDrag);
      document.removeEventListener("mousemove", drag);
      document.removeEventListener("touchmove", drag);
      document.removeEventListener("mouseup", endDrag);
      document.removeEventListener("touchend", endDrag);
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [updateClonePosition, startAnimationLoop]);

  return (
    <div>
      <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
        <span className="w-1 h-5 rounded-sm bg-gradient-to-b from-[#667eea] to-[#764ba2]" /> 
        Magnifying Glass
      </h2>
      <div
        ref={demoAreaRef}
        className="relative h-[500px] rounded-2xl overflow-hidden border border-[var(--lg-border)]"
        style={BG_STYLE}
      >
        <BackgroundContent />

        <div
          ref={glassRef}
          className="absolute cursor-grab active:cursor-grabbing select-none"
          style={{
            width: GLASS.objectWidth,
            height: GLASS.objectHeight,
            borderRadius: GLASS.radius + "px",
            touchAction: "none",
            willChange: "transform",
            overflow: "hidden",
            opacity: ready ? 1 : 0,
            transition: "opacity 0.3s",
          }}
        >
          <div
            ref={cloneRef}
            className="absolute inset-0 overflow-hidden"
            style={{ borderRadius: "inherit", zIndex: 1 }}
          >
            <div
              ref={cloneInnerRef}
              className="absolute top-0 left-0 pointer-events-none"
              style={BG_STYLE}
            >
              <BackgroundContent />
            </div>
          </div>

          <div
            ref={glassInnerRef}
            className="absolute inset-0 pointer-events-none"
            style={{ borderRadius: "inherit", zIndex: 3 }}
          />
        </div>

        <GlassFilter
          filterId="magGlassFilter"
          width={GLASS.objectWidth}
          height={GLASS.objectHeight}
          radius={GLASS.radius}
          bezelWidth={GLASS.bezelWidth}
          glassThickness={GLASS.glassThickness}
          refractiveIndex={GLASS.refractiveIndex}
          refractionScale={paramState.values.refractionScale}
          specularOpacity={paramState.values.specularOpacity}
          blur={0}
          saturation={paramState.values.saturation}
        />
      </div>
      <ParamControls
        params={PARAM_DEFS}
        values={paramState.values}
        onChange={paramState.onChange}
        onReset={paramState.onReset}
      />
    </div>
  );
}