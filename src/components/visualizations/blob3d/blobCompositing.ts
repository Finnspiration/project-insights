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
//   ACCENT layers - small marks: orbiting particles, rings, spikes. Same
//                  compositing, but allowed a much higher alpha, because a
//                  mark that only tints the background does not read as its
//                  own colour and so does not carry its own dimension.
//
// The test in blobMapping3D.test.ts holds the other half of the contract: that
// every dimension still changes the picture, so none of the twelve is silently
// doing nothing.

// Second pass, after seeing it: additive is wrong here for ALL of them, not
// just the big ones. Additive simulates light emitted into darkness, and this
// scene's stage is paper — a pale tinted field. Over a light background the
// only direction additive can go is white:
//
//   #FF6600 "intense orange" over the teal stage
//     additive  a=0.33  ->  rgb(254,239,200)   pale cream
//     additive  a=0.60  ->  rgb(255,255,200)   saturated; alpha does nothing now
//     normal    a=0.85  ->  rgb(242,117,30)    orange, which is what it means
//
// So high risk was drawing itself as a soft cream band. The element was
// visible — it just no longer said anything. Both tiers composite normally
// now; what separates them is how much of the background they are allowed to
// take, not how they combine with it.

/** Anything covering a meaningful part of the silhouette. */
export const AREA_BLENDING = THREE.NormalBlending;

/** Small marks: rings, particles, spikes. Same maths, more of it. */
export const ACCENT_BLENDING = THREE.NormalBlending;

/**
 * Ceiling for a mark.
 *
 * High on purpose. Normal blending is bounded whatever the alpha, so the old
 * additive budget of 0.33 is no longer protecting anything — it was only
 * draining the colour out of every ring and particle. A mark has to reach
 * roughly 0.8 before it reads as its own hue rather than a tint of whatever
 * is behind it.
 */
export const ACCENT_MAX_OPACITY = 0.9;

/** Clamp a mark's opacity to the ceiling. */
export function accentOpacity(value: number): number {
  return Math.min(ACCENT_MAX_OPACITY, Math.max(0, value));
}

/**
 * Ceiling for an area layer's alpha.
 *
 * Below 1 on purpose: an area layer that can reach fully opaque hides whatever
 * is behind it, which loses an element just as effectively as burning it out.
 */
export const AREA_MAX_OPACITY = 0.55;

/** Clamp an area layer's opacity so it always leaves what is behind it visible. */
export function areaOpacity(value: number): number {
  return Math.min(AREA_MAX_OPACITY, Math.max(0, value));
}
