// Surface equations - define the height profile of the glass bezel
export const SurfaceEquations = {
  convex_circle: (x: number) => Math.sqrt(1 - Math.pow(1 - x, 2)),
  convex_squircle: (x: number) => Math.pow(1 - Math.pow(1 - x, 4), 1 / 4),
  concave: (x: number) => 1 - Math.sqrt(1 - Math.pow(x, 2)),
  lip: (x: number) => {
    const convex = Math.pow(1 - Math.pow(1 - Math.min(x * 2, 1), 4), 1 / 4);
    const concave = 1 - Math.sqrt(1 - Math.pow(1 - x, 2)) + 0.1;
    const smootherstep =
      6 * Math.pow(x, 5) - 15 * Math.pow(x, 4) + 10 * Math.pow(x, 3);
    return convex * (1 - smootherstep) + concave * smootherstep;
  },
};

export type SurfaceType = keyof typeof SurfaceEquations;

// Simple spring physics class
export class Spring {
  value: number;
  target: number;
  velocity: number;
  stiffness: number;
  damping: number;

  constructor(value: number, stiffness = 300, damping = 20) {
    this.value = value;
    this.target = value;
    this.velocity = 0;
    this.stiffness = stiffness;
    this.damping = damping;
  }

  setTarget(target: number) {
    this.target = target;
  }

  update(dt: number) {
    const force = (this.target - this.value) * this.stiffness;
    const dampingForce = this.velocity * this.damping;
    this.velocity += (force - dampingForce) * dt;
    this.value += this.velocity * dt;
    return this.value;
  }

  isSettled() {
    return (
      Math.abs(this.target - this.value) < 0.001 &&
      Math.abs(this.velocity) < 0.001
    );
  }
}

// Calculate displacement along a single radius using Snell's Law
export function calculateDisplacementMap1D(
  glassThickness: number,
  bezelWidth: number,
  surfaceFn: (x: number) => number,
  refractiveIndex: number,
  samples = 128,
): number[] {
  const eta = 1 / refractiveIndex;

  function refract(normalX: number, normalY: number): [number, number] | null {
    const dot = normalY;
    const k = 1 - eta * eta * (1 - dot * dot);
    if (k < 0) return null;
    const kSqrt = Math.sqrt(k);
    return [
      -(eta * dot + kSqrt) * normalX,
      eta - (eta * dot + kSqrt) * normalY,
    ];
  }

  const result: number[] = [];
  for (let i = 0; i < samples; i++) {
    const x = i / samples;
    const y = surfaceFn(x);
    const dx = x < 1 ? 0.0001 : -0.0001;
    const y2 = surfaceFn(Math.max(0, Math.min(1, x + dx)));
    const derivative = (y2 - y) / dx;
    const magnitude = Math.sqrt(derivative * derivative + 1);
    const normal: [number, number] = [-derivative / magnitude, -1 / magnitude];
    const refracted = refract(normal[0], normal[1]);

    if (!refracted) {
      result.push(0);
    } else {
      const remainingHeightOnBezel = y * bezelWidth;
      const remainingHeight = remainingHeightOnBezel + glassThickness;
      result.push(refracted[0] * (remainingHeight / refracted[1]));
    }
  }
  return result;
}

// Calculate 2D displacement map on canvas and return data URL
export function generateDisplacementMapURL(
  canvasWidth: number,
  canvasHeight: number,
  objectWidth: number,
  objectHeight: number,
  radius: number,
  bezelWidth: number,
  maximumDisplacement: number,
  precomputedMap: number[],
): string {
  const canvas = document.createElement("canvas");
  canvas.width = canvasWidth;
  canvas.height = canvasHeight;
  const ctx = canvas.getContext("2d")!;

  // Fill with neutral displacement (128, 128 = no displacement)
  ctx.fillStyle = "rgb(128, 128, 0)";
  ctx.fillRect(0, 0, canvasWidth, canvasHeight);

  const imageData = ctx.getImageData(0, 0, canvasWidth, canvasHeight);
  const data = imageData.data;

  const radiusSquared = radius * radius;
  const radiusPlusOneSquared = (radius + 1) * (radius + 1);
  const radiusMinusBezelSquared = Math.max(
    0,
    (radius - bezelWidth) * (radius - bezelWidth),
  );
  const widthBetweenRadiuses = objectWidth - radius * 2;
  const heightBetweenRadiuses = objectHeight - radius * 2;
  const objectX = (canvasWidth - objectWidth) / 2;
  const objectY = (canvasHeight - objectHeight) / 2;

  for (let y1 = 0; y1 < objectHeight; y1++) {
    for (let x1 = 0; x1 < objectWidth; x1++) {
      const idx = ((objectY + y1) * canvasWidth + objectX + x1) * 4;
      const isOnLeftSide = x1 < radius;
      const isOnRightSide = x1 >= objectWidth - radius;
      const isOnTopSide = y1 < radius;
      const isOnBottomSide = y1 >= objectHeight - radius;

      const x = isOnLeftSide
        ? x1 - radius
        : isOnRightSide
          ? x1 - radius - widthBetweenRadiuses
          : 0;
      const y = isOnTopSide
        ? y1 - radius
        : isOnBottomSide
          ? y1 - radius - heightBetweenRadiuses
          : 0;

      const distanceToCenterSquared = x * x + y * y;
      const isInBezel =
        distanceToCenterSquared <= radiusPlusOneSquared &&
        distanceToCenterSquared >= radiusMinusBezelSquared;

      if (isInBezel) {
        const opacity =
          distanceToCenterSquared < radiusSquared
            ? 1
            : 1 -
              (Math.sqrt(distanceToCenterSquared) - Math.sqrt(radiusSquared)) /
                (Math.sqrt(radiusPlusOneSquared) - Math.sqrt(radiusSquared));
        const distanceFromCenter = Math.sqrt(distanceToCenterSquared);
        const distanceFromSide = radius - distanceFromCenter;
        const cos = distanceFromCenter > 0 ? x / distanceFromCenter : 0;
        const sin = distanceFromCenter > 0 ? y / distanceFromCenter : 0;
        const bezelRatio = Math.max(
          0,
          Math.min(1, distanceFromSide / bezelWidth),
        );
        const bezelIndex = Math.floor(bezelRatio * precomputedMap.length);
        const distance =
          precomputedMap[
            Math.max(0, Math.min(bezelIndex, precomputedMap.length - 1))
          ] || 0;
        const dX =
          maximumDisplacement > 0 ? (-cos * distance) / maximumDisplacement : 0;
        const dY =
          maximumDisplacement > 0 ? (-sin * distance) / maximumDisplacement : 0;

        data[idx] = Math.max(0, Math.min(255, 128 + dX * 127 * opacity));
        data[idx + 1] = Math.max(0, Math.min(255, 128 + dY * 127 * opacity));
        data[idx + 2] = 0;
        data[idx + 3] = 255;
      }
    }
  }

  ctx.putImageData(imageData, 0, 0);
  return canvas.toDataURL("image/png");
}

// Calculate specular highlight and return data URL
export function generateSpecularMapURL(
  objectWidth: number,
  objectHeight: number,
  radius: number,
  bezelWidth: number,
  specularAngle = Math.PI / 3,
): string {
  const canvas = document.createElement("canvas");
  canvas.width = objectWidth;
  canvas.height = objectHeight;
  const ctx = canvas.getContext("2d")!;

  const imageData = ctx.getImageData(0, 0, objectWidth, objectHeight);
  const d = imageData.data;

  const specularVector = [Math.cos(specularAngle), Math.sin(specularAngle)];
  const specularThickness = 1.5;
  const radiusSquared = radius * radius;
  const radiusPlusOneSquared = (radius + 1) * (radius + 1);
  const radiusMinusSpecularSquared = Math.max(
    0,
    (radius - specularThickness) * (radius - specularThickness),
  );
  const widthBetweenRadiuses = objectWidth - radius * 2;
  const heightBetweenRadiuses = objectHeight - radius * 2;

  for (let y1 = 0; y1 < objectHeight; y1++) {
    for (let x1 = 0; x1 < objectWidth; x1++) {
      const idx = (y1 * objectWidth + x1) * 4;
      const isOnLeftSide = x1 < radius;
      const isOnRightSide = x1 >= objectWidth - radius;
      const isOnTopSide = y1 < radius;
      const isOnBottomSide = y1 >= objectHeight - radius;

      const x = isOnLeftSide
        ? x1 - radius
        : isOnRightSide
          ? x1 - radius - widthBetweenRadiuses
          : 0;
      const y = isOnTopSide
        ? y1 - radius
        : isOnBottomSide
          ? y1 - radius - heightBetweenRadiuses
          : 0;

      const distanceToCenterSquared = x * x + y * y;
      const isNearEdge =
        distanceToCenterSquared <= radiusPlusOneSquared &&
        distanceToCenterSquared >= radiusMinusSpecularSquared;

      if (isNearEdge) {
        const distanceFromCenter = Math.sqrt(distanceToCenterSquared);
        const distanceFromSide = radius - distanceFromCenter;
        const opacity =
          distanceToCenterSquared < radiusSquared
            ? 1
            : 1 -
              (distanceFromCenter - Math.sqrt(radiusSquared)) /
                (Math.sqrt(radiusPlusOneSquared) - Math.sqrt(radiusSquared));
        const cos = distanceFromCenter > 0 ? x / distanceFromCenter : 0;
        const sin = distanceFromCenter > 0 ? -y / distanceFromCenter : 0;
        const dotProduct = Math.abs(
          cos * specularVector[0] + sin * specularVector[1],
        );
        const edgeRatio = Math.max(
          0,
          Math.min(1, distanceFromSide / specularThickness),
        );
        const sharpFalloff = Math.sqrt(1 - (1 - edgeRatio) * (1 - edgeRatio));
        const coefficient = dotProduct * sharpFalloff;
        const color = Math.min(255, 255 * coefficient);
        const finalOpacity = Math.min(255, color * coefficient * opacity);

        d[idx] = color;
        d[idx + 1] = color;
        d[idx + 2] = color;
        d[idx + 3] = finalOpacity;
      }
    }
  }

  ctx.putImageData(imageData, 0, 0);
  return canvas.toDataURL("image/png");
}

// Precompute all filter assets for a given glass shape
export interface GlassFilterAssets {
  displacementURL: string;
  specularURL: string;
  maximumDisplacement: number;
}

export function computeGlassFilterAssets(params: {
  objectWidth: number;
  objectHeight: number;
  radius: number;
  bezelWidth: number;
  glassThickness: number;
  refractiveIndex: number;
  surfaceType?: SurfaceType;
}): GlassFilterAssets {
  const {
    objectWidth,
    objectHeight,
    radius,
    bezelWidth,
    glassThickness,
    refractiveIndex,
    surfaceType = "convex_squircle",
  } = params;

  const surfaceFn = SurfaceEquations[surfaceType];
  const precomputed = calculateDisplacementMap1D(
    glassThickness,
    bezelWidth,
    surfaceFn,
    refractiveIndex,
  );
  const maximumDisplacement = Math.max(...precomputed.map(Math.abs));

  const displacementURL = generateDisplacementMapURL(
    objectWidth,
    objectHeight,
    objectWidth,
    objectHeight,
    radius,
    bezelWidth,
    maximumDisplacement || 1,
    precomputed,
  );

  const specularURL = generateSpecularMapURL(
    objectWidth,
    objectHeight,
    radius,
    bezelWidth,
  );

  return { displacementURL, specularURL, maximumDisplacement };
}
