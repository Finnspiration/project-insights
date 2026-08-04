import * as THREE from 'three';

// How the blob's layers are allowed to combine.
//
// Every layer in this visualization draws on the same few hundred pixels in the
// middle of the frame, and until now almost all of them used additive blending:
//
//     result = destination + source * alpha
//
// Additive only ever adds. There is no combination of additive layers that
// comes out darker than one of them alone, so the centre climbs towards white
// as a project's assessment turns more elements on — and once it reaches white
// it stops responding entirely. Past saturation, adding a twelfth dimension to
// the picture changes nothing anyone can see.
//
// That is the exact opposite of the promise this blob makes. It claims to show
// twelve dimensions, so all twelve have to stay readable in every combination,
// including the busy ones. Busy is when a reader needs it most.
//
// So the rule is:
//
//   AREA layers  - anything that covers a meaningful part of the silhouette:
//                  auras, shells, fresnel glows, filled discs, the core.
//                  These composite normally. Normal alpha blending is bounded
//                  by construction - the result is a weighted average of the
//                  two colours, never brighter than the brighter one - and a
//                  nearer layer occludes a farther one, which is what keeps two
//                  overlapping elements looking like two elements.
//
//   ACCENT layers - small, sparse, genuinely light-like marks: orbiting
//                  particles, thin rings, spark trails. Additive is right for
//                  these and they cover too few pixels to stack. Their opacity
//                  still passes through accentOpacity() so no single one can
//                  blow out on its own.
//
// The test in blobCompositing.test.ts holds the other half of the contract:
// that every dimension still changes the picture, so none of the twelve is
// silently doing nothing.

/** For anything that covers area. Bounded: never brighter than its inputs. */
export const AREA_BLENDING = THREE.NormalBlending;

/** For small sparse light-like marks only. */
export const ACCENT_BLENDING = THREE.AdditiveBlending;

/**
 * Ceiling for a single additive accent.
 *
 * Chosen so that three accents can overlap before the sum reaches 1. Sparse
 * marks rarely stack three deep, so this is headroom rather than a limit that
 * bites in practice.
 */
export const ACCENT_MAX_OPACITY = 0.33;

/** Clamp an accent's opacity into the additive budget. */
export function accentOpacity(value: number): number {
  return Math.min(ACCENT_MAX_OPACITY, Math.max(0, value));
}

/**
 * Ceiling for an area layer's alpha.
 *
 * Below 1 on purpose: an area layer that can reach fully opaque hides whatever
 * is behind it, which loses an element just as effectively as burning it out.
 */
export const AREA_MAX_OPACITY = 0.75;

/** Clamp an area layer's opacity so it always leaves what is behind it visible. */
export function areaOpacity(value: number): number {
  return Math.min(AREA_MAX_OPACITY, Math.max(0, value));
}
