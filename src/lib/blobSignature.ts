import { gestureValues, lerp, type GestureKey } from './blobGestures';
import { morphologyValue, MORPHOLOGY_DIMENSION_KEYS, type RawMorphology } from '@shared/morphology.ts';

// A flat silhouette of the blob, for places where twelve of them appear at once.
//
// The gallery cannot mount twelve WebGL contexts — browsers cap them at around
// sixteen and each one costs a scene, a renderer and an animation loop. But the
// deeper reason for a 2D mark is that at thumbnail size none of the 3D detail
// survives anyway: what you can still see is the outline. If the five gestures
// cannot produce a distinguishable silhouette, they are the wrong five, so this
// is also the test of the portrait rather than merely a cheaper version of it.
//
// Everything here is deterministic: the same assessment always draws the same
// mark, in the gallery and across reloads.

export interface SignatureLobe {
  /** Closed SVG path in a 100x100 box. */
  path: string;
  cx: number;
  cy: number;
  r: number;
}

export interface SignatureOrbit {
  rx: number;
  ry: number;
  /** Degrees. */
  rotation: number;
}

export interface BlobSignature {
  lobes: SignatureLobe[];
  orbits: SignatureOrbit[];
  /** 0-1, how solid the body reads. */
  fillOpacity: number;
  /** 0-1, strength of the pressure halo. */
  strain: number;
  gestures: Record<GestureKey, number>;
}

const CENTRE = 50;
/** Points around each lobe outline. Enough to show a wobble, cheap enough for a list. */
const OUTLINE_POINTS = 48;

/**
 * Small deterministic hash of the assessment, so a project's mark is stable
 * without storing anything: same answers, same silhouette, every time.
 */
function seedFrom(morphology: RawMorphology): number {
  let hash = 2166136261;
  for (const key of MORPHOLOGY_DIMENSION_KEYS) {
    const value = morphologyValue(morphology, key) ?? '';
    for (let i = 0; i < value.length; i++) {
      hash ^= value.charCodeAt(i);
      hash = Math.imul(hash, 16777619);
    }
    hash ^= 0x2d;
  }
  return (hash >>> 0) / 0xffffffff;
}

/** Deterministic noise: three octaves of sine, no allocation, no Math.random. */
function wobble(angle: number, seed: number, roughness: number): number {
  const a = Math.sin(angle * 3 + seed * 11.7) * 0.55;
  const b = Math.sin(angle * 7 + seed * 23.3) * 0.3;
  const c = Math.sin(angle * 13 + seed * 41.1) * 0.15;
  return (a + b + c) * roughness;
}

function lobeOutline(cx: number, cy: number, r: number, seed: number, roughness: number): string {
  const points: string[] = [];
  for (let i = 0; i < OUTLINE_POINTS; i++) {
    const angle = (i / OUTLINE_POINTS) * Math.PI * 2;
    // Up to 30% deviation at full roughness — enough to read as agitated,
    // never enough to stop reading as one body.
    const radius = r * (1 + wobble(angle, seed, roughness) * 0.3);
    const x = cx + Math.cos(angle) * radius;
    const y = cy + Math.sin(angle) * radius;
    points.push(`${x.toFixed(2)},${y.toFixed(2)}`);
  }
  return `M${points.join('L')}Z`;
}

export function buildBlobSignature(morphology: RawMorphology): BlobSignature {
  const g = gestureValues(morphology);
  const seed = seedFrom(morphology);

  // WHOLE <-> SPLIT APART. One body, or up to four drifting from the centre.
  const lobeCount = Math.max(1, Math.round(lerp(4, 1, g.cohesion)));
  const spread = lerp(20, 0, g.cohesion);
  // Keep the total ink roughly constant so a split project does not simply
  // look smaller than a whole one.
  const lobeRadius = lerp(15, 30, g.cohesion) / Math.sqrt(lobeCount) + (lobeCount > 1 ? 6 : 0);

  const lobes: SignatureLobe[] = [];
  for (let i = 0; i < lobeCount; i++) {
    const angle = (i / lobeCount) * Math.PI * 2 + seed * Math.PI * 2;
    const cx = CENTRE + Math.cos(angle) * spread;
    const cy = CENTRE + Math.sin(angle) * spread;
    lobes.push({
      cx: Number(cx.toFixed(2)),
      cy: Number(cy.toFixed(2)),
      r: Number(lobeRadius.toFixed(2)),
      path: lobeOutline(cx, cy, lobeRadius, seed + i * 0.37, g.roughness),
    });
  }

  // STILL <-> CIRCLING. Floor rather than round, so the stillest projects get
  // no orbit at all: "nothing is circling this" is a reading in its own right,
  // and rounding gave every project at least one ring.
  const orbitCount = Math.floor(lerp(0, 3.5, g.orbit));
  const orbits: SignatureOrbit[] = Array.from({ length: orbitCount }, (_, i) => ({
    rx: Number((38 + i * 3).toFixed(2)),
    ry: Number(((38 + i * 3) * lerp(0.9, 0.24, (i + 1) / (orbitCount + 1))).toFixed(2)),
    rotation: Number(((seed * 180 + i * 55) % 180).toFixed(1)),
  }));

  return {
    lobes,
    orbits,
    // OPAQUE <-> SEE-THROUGH.
    fillOpacity: Number(lerp(0.92, 0.34, g.clarity).toFixed(2)),
    strain: g.strain,
    gestures: g,
  };
}
