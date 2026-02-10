"use client";

import { useEffect, useState } from "react";
import { computeGlassFilterAssets, type SurfaceType } from "@/lib/liquid-glass";

interface GlassFilterProps {
  filterId: string;
  width: number;
  height: number;
  radius: number;
  bezelWidth: number;
  glassThickness: number;
  refractiveIndex: number;
  refractionScale?: number;
  specularOpacity?: number;
  blur?: number;
  saturation?: number;
  surfaceType?: SurfaceType;
  /** Extra background opacity layer (0=transparent, 1=opaque white) */
  glassBgOpacity?: number;
  /** Progressive blur intensity (0=no progressive effect, 1=full progressive effect) */
  progressiveBlurIntensity?: number;
}

export function GlassFilter({
  filterId,
  width,
  height,
  radius,
  bezelWidth,
  glassThickness,
  refractiveIndex,
  refractionScale = 1,
  specularOpacity = 0.6,
  blur = 0,
  saturation,
  surfaceType = "convex_squircle",
  glassBgOpacity,
  progressiveBlurIntensity,
}: GlassFilterProps) {
  const [assets, setAssets] = useState<{
    displacementURL: string;
    specularURL: string;
    maximumDisplacement: number;
  } | null>(null);

  useEffect(() => {
    const result = computeGlassFilterAssets({
      objectWidth: width,
      objectHeight: height,
      radius,
      bezelWidth,
      glassThickness,
      refractiveIndex,
      surfaceType,
    });
    setAssets(result);
  }, [width, height, radius, bezelWidth, glassThickness, refractiveIndex, surfaceType]);

  if (!assets) return null;

  const scale = assets.maximumDisplacement * refractionScale;

  return (
    <svg
      style={{ position: "absolute", width: 0, height: 0, overflow: "hidden", pointerEvents: "none" }}
      aria-hidden="true"
    >
      <defs>
        {/* Radial gradient for progressive blur */}
        {progressiveBlurIntensity != null && progressiveBlurIntensity > 0 && (
          <radialGradient id={`${filterId}-progressive-mask`} cx="50%" cy="50%" r="50%" fx="50%" fy="50%">
            <stop offset="0%" stopColor="white" stopOpacity="1" />
            <stop offset="100%" stopColor="white" stopOpacity={String(1 - progressiveBlurIntensity)} />
          </radialGradient>
        )}
        
        <filter
          id={filterId}
          filterUnits="userSpaceOnUse"
          colorInterpolationFilters="sRGB"
          x="0"
          y="0"
          width={width}
          height={height}
        >
          {/* Load displacement map */}
          <feImage
            href={assets.displacementURL}
            width={width}
            height={height}
            result="displacementMap"
          />
          {/* Apply displacement to source graphic (refraction) */}
          <feDisplacementMap
            in="SourceGraphic"
            in2="displacementMap"
            xChannelSelector="R"
            yChannelSelector="G"
            scale={scale}
            result="displaced"
          />
          {/* Optional blur for glass softness */}
          {blur > 0 ? (
            <>
              {/* Apply base blur */}
              <feGaussianBlur in="displaced" stdDeviation={blur} result="blurredImage" />
              
              {/* Progressive blur effect */}
              {progressiveBlurIntensity != null && progressiveBlurIntensity > 0 ? (
                <>
                  {/* Create a radial gradient for progressive blur mask */}
                  <feGaussianBlur in="displaced" stdDeviation={blur * (1 + progressiveBlurIntensity)} result="moreBlurredImage" />
                  
                  {/* Create mask using the gradient */}
                  <feFlood floodColor="white" floodOpacity="1" result="flood" />
                  <feComposite in="flood" in2={`url(#${filterId}-progressive-mask)`} operator="in" result="mask" />
                  
                  {/* Blend the two blur levels using the mask */}
                  <feBlend in="blurredImage" in2="moreBlurredImage" mode="normal" result="blended" />
                  <feComposite in="blended" in2="mask" operator="in" result="postBlur" />
                </>
              ) : (
                <feOffset in="blurredImage" result="postBlur" />
              )}
            </>
          ) : (
            <feOffset in="displaced" result="postBlur" />
          )}
          {/* Optional glass background opacity overlay (white tint) */}
          {glassBgOpacity != null && glassBgOpacity > 0 ? (
            <>
              <feFlood floodColor="white" floodOpacity={glassBgOpacity} result="bgFlood" />
              <feBlend in="postBlur" in2="bgFlood" mode="screen" result="postBg" />
            </>
          ) : (
            <feOffset in="postBlur" result="postBg" />
          )}
          {/* Load specular highlight map */}
          <feImage
            href={assets.specularURL}
            width={width}
            height={height}
            result="specularMap"
          />
          {/* Apply color tint to specular highlight (convert grayscale to colored with blue/purple tint) */}
          <feColorMatrix
            in="specularMap"
            type="matrix"
            values="0 0 0 0 1   0 0 0 0 0.7   0 0 0 0 1   0 0 0 1 0"
            result="coloredSpecular"
          />
          {/* Adjust specular saturation if provided */}
          {saturation != null ? (
            <feColorMatrix
              in="coloredSpecular"
              type="saturate"
              values={String(saturation)}
              result="saturatedSpecular"
            />
          ) : (
            <feOffset in="coloredSpecular" result="saturatedSpecular" />
          )}
          {/* Adjust specular opacity */}
          <feComponentTransfer in="saturatedSpecular" result="adjustedSpecular">
            <feFuncA type="linear" slope={specularOpacity} />
          </feComponentTransfer>
          {/* Blend specular on top */}
          <feBlend
            in="postBg"
            in2="adjustedSpecular"
            mode="screen"
          />
        </filter>
      </defs>
    </svg>
  );
}