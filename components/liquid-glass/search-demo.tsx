"use client";

import { useEffect, useRef, useCallback, useState } from "react";
import { Search } from "lucide-react";
import { GlassFilter } from "./glass-filter";
import { ParamControls, useParamState } from "./param-controls";

const CONFIG = {
  width: 400,
  height: 48,
  radius: 24,
  bezelWidth: 18,
  glassThickness: 60,
  refractiveIndex: 1.35,
};

const DEFAULTS = {
  specularOpacity: 0.20,
  saturation: 4,
  refractionScale: 0.70,
  blur: 1.0,
};

const PARAM_DEFS = [
  { key: "specularOpacity", label: "Specular Opacity", min: 0, max: 1, step: 0.01, defaultValue: DEFAULTS.specularOpacity },
  { key: "saturation", label: "Specular Saturation", min: 0, max: 20, step: 0.1, defaultValue: DEFAULTS.saturation },
  { key: "refractionScale", label: "Refraction Level", min: 0, max: 3, step: 0.01, defaultValue: DEFAULTS.refractionScale },
  { key: "blur", label: "Blur Level", min: 0, max: 2, step: 0.01, defaultValue: DEFAULTS.blur },
];

export function SearchDemo() {
  const areaRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLDivElement>(null);
  const cloneRef = useRef<HTMLDivElement>(null);
  const cloneInnerRef = useRef<HTMLDivElement>(null);
  const [ready, setReady] = useState(false);
  const [query, setQuery] = useState("");
  const paramState = useParamState(DEFAULTS);

  const updateClonePosition = useCallback(() => {
    const search = searchRef.current;
    const cloneInner = cloneInnerRef.current;
    const area = areaRef.current;
    if (!search || !cloneInner || !area) return;

    const areaRect = area.getBoundingClientRect();
    const searchRect = search.getBoundingClientRect();

    cloneInner.style.width = areaRect.width + "px";
    cloneInner.style.height = areaRect.height + "px";
    cloneInner.style.transform = `translate(${-(searchRect.left - areaRect.left)}px, ${-(searchRect.top - areaRect.top)}px)`;
  }, []);

  useEffect(() => {
    const clone = cloneRef.current;
    if (!clone) return;

    clone.style.filter = "url(#searchGlassFilter)";
    updateClonePosition();
    setReady(true);

    const handleResize = () => updateClonePosition();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [updateClonePosition]);

  return (
    <div>
      <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
        <span className="w-1 h-5 rounded-sm bg-gradient-to-b from-[#667eea] to-[#764ba2]" />
        Search Box
      </h2>
      <div
        ref={areaRef}
        className="relative h-[200px] rounded-2xl overflow-hidden border border-[var(--lg-border)] flex items-center justify-center"
        style={{
          backgroundImage:
            "linear-gradient(135deg, #667eea 0%, #764ba2 50%, #f093fb 100%)",
          opacity: ready ? 1 : 0,
          transition: "opacity 0.3s",
        }}
      >
        {/* Background text */}
        <div className="absolute inset-0 p-8 flex flex-col justify-center">
          <div className="text-white text-3xl font-bold mb-2">Discover</div>
          <div className="text-white/60 text-sm">
            Search for anything you need
          </div>
        </div>

        {/* Search bar glass */}
        <div
          ref={searchRef}
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
                backgroundImage:
                  "linear-gradient(135deg, #667eea 0%, #764ba2 50%, #f093fb 100%)",
              }}
            >
              <div className="p-8 flex flex-col justify-center h-full">
                <div className="text-white text-3xl font-bold mb-2">
                  Discover
                </div>
                <div className="text-white/60 text-sm">
                  Search for anything you need
                </div>
              </div>
            </div>
          </div>

          {/* Glass inner shadow */}
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              borderRadius: "inherit",
              zIndex: 2,
              boxShadow:
                "0 2px 12px rgba(0,0,0,0.15), inset 0 1px 0 rgba(255,255,255,0.3), inset 0 -1px 0 rgba(0,0,0,0.1)",
            }}
          />

          {/* Input */}
          <div className="relative flex items-center h-full px-4 gap-3" style={{ zIndex: 3 }}>
            <Search className="w-5 h-5 text-white/70 flex-shrink-0" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search..."
              className="bg-transparent border-none outline-none text-white placeholder:text-white/50 text-sm flex-1"
            />
          </div>
        </div>
      </div>

      {/* SVG Filter */}
      <GlassFilter
        filterId="searchGlassFilter"
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