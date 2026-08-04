import { useId, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { buildBlobSignature } from '@/lib/blobSignature';
import { mapMorphologyTo3DBlob } from './blob3d/blobMapping3D';
import type { RawMorphology } from '@shared/morphology.ts';

// The blob as a flat mark, for the gallery. Same five gestures and the same
// stage colour as the full 3D portrait, so a project is recognisably itself in
// both places — but as plain SVG, because twelve WebGL contexts on one page is
// not a thing browsers will do.

interface BlobSignatureMarkProps {
  morphology: RawMorphology;
  className?: string;
}

export function BlobSignatureMark({ morphology, className }: BlobSignatureMarkProps) {
  const { t } = useTranslation('common');

  // SVG ids are document-global. Keying the gradient on the path length and
  // orbit count collided as soon as the gallery drew a second mark with the
  // same shape budget, and the colliding marks silently rendered the first
  // one's stage colour — a green project came out pink.
  const haloId = `blob-halo-${useId().replace(/:/g, '')}`;

  // The stage tints the field; the body is ink.
  //
  // Deliberately not blob.primaryColor: that is hue 210 for every project on
  // record — only its saturation and lightness move — so using it would make
  // twelve portraits twelve blue shapes. Drawing the body in the foreground
  // colour instead puts the whole burden of recognition on the silhouette,
  // which is the point of a portrait and the thing colour kept doing for it.
  const { signature, stageColor } = useMemo(() => ({
    signature: buildBlobSignature(morphology),
    stageColor: mapMorphologyTo3DBlob(morphology).backgroundColors.top,
  }), [morphology]);

  const { lobes, orbits, fillOpacity, strain, gestures } = signature;

  // How far the body actually reaches, so the pressure ring can follow it.
  const bodyExtent = Math.max(
    ...lobes.map((lobe) => Math.hypot(lobe.cx - 50, lobe.cy - 50) + lobe.r),
  );

  // The alt text is the reading, not a description of the drawing.
  const description = [
    t(`visualizations.blobSignature.cohesion.${gestures.cohesion > 0.6 ? 'whole' : 'split'}`),
    t(`visualizations.blobSignature.roughness.${gestures.roughness > 0.5 ? 'agitated' : 'smooth'}`),
    t(`visualizations.blobSignature.strain.${gestures.strain > 0.5 ? 'strained' : 'calm'}`),
    orbits.length > 0
      ? t('visualizations.blobSignature.orbit.circling')
      : t('visualizations.blobSignature.orbit.still'),
  ].join(', ');

  return (
    <svg viewBox="0 0 100 100" className={className} role="img" aria-label={description}>
      <defs>
        <radialGradient id={haloId}>
          <stop offset="0%" stopColor={stageColor} stopOpacity="0.6" />
          <stop offset="62%" stopColor={stageColor} stopOpacity="0.42" />
          <stop offset="100%" stopColor={stageColor} stopOpacity="0" />
        </radialGradient>
      </defs>

      {/* The stage, as a soft field rather than a filled disc. */}
      <circle
        cx="50"
        cy="50"
        r="48"
        fill={`url(#${haloId})`}
      />

      {/* Pressure, drawn hugging the body rather than out in the field. At
          radius 44 it was a big coloured circle that read as the mark's main
          colour — pressure on the form has to sit on the form. */}
      {strain > 0.35 && (
        <circle
          cx="50"
          cy="50"
          r={bodyExtent + 4 - strain * 1.5}
          fill="none"
          stroke="hsl(var(--destructive))"
          strokeOpacity={0.14 + strain * 0.24}
          strokeWidth={0.5 + strain * 0.7}
          strokeDasharray={strain > 0.7 ? '2.5 2' : undefined}
        />
      )}

      {orbits.map((orbit, i) => (
        <ellipse
          key={i}
          cx="50"
          cy="50"
          rx={orbit.rx}
          ry={orbit.ry}
          fill="none"
          stroke="hsl(var(--foreground))"
          strokeOpacity={0.3 - i * 0.06}
          strokeWidth="0.9"
          transform={`rotate(${orbit.rotation} 50 50)`}
        />
      ))}

      {lobes.map((lobe, i) => (
        <path
          key={i}
          d={lobe.path}
          fill="hsl(var(--foreground))"
          fillOpacity={fillOpacity * 0.82}
          stroke="hsl(var(--foreground))"
          strokeOpacity={0.9}
          strokeWidth="0.8"
          strokeLinejoin="round"
        />
      ))}
    </svg>
  );
}
