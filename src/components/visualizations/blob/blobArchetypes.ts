import { BlobVisualData } from './blobMapping';

export interface BlobArchetype {
  name: string;
  nameKey: string; // Translation key
  icon: string;
  color: string;
  descriptionKey: string;
}

export function detectArchetype(blobData: BlobVisualData): BlobArchetype {
  // The Seed: Small, simple, low complexity
  if (blobData.roughness < 0.3 && blobData.arms <= 3 && blobData.noiseIntensity < 0.4) {
    return {
      name: 'The Seed',
      nameKey: 'visualizations.blob.archetypes.seed.name',
      icon: '🌱',
      color: '#10B981',
      descriptionKey: 'visualizations.blob.archetypes.seed.description'
    };
  }
  
  // The Crystal: High symmetry, low noise, balanced
  if (blobData.symmetry > 0.7 && blobData.noiseIntensity < 0.4 && blobData.roughness < 0.5) {
    return {
      name: 'The Crystal',
      nameKey: 'visualizations.blob.archetypes.crystal.name',
      icon: '💎',
      color: '#06B6D4',
      descriptionKey: 'visualizations.blob.archetypes.crystal.description'
    };
  }
  
  // The Jellyfish: Many arms, asymmetric, colorful
  if (blobData.arms >= 6 && blobData.colorSpread >= 3 && blobData.symmetry < 0.5) {
    return {
      name: 'The Jellyfish',
      nameKey: 'visualizations.blob.archetypes.jellyfish.name',
      icon: '🪼',
      color: '#8B5CF6',
      descriptionKey: 'visualizations.blob.archetypes.jellyfish.description'
    };
  }
  
  // The Storm Cloud: High roughness, high noise, high risk
  if (blobData.roughness > 0.7 && blobData.noiseIntensity > 0.6 && blobData.outerGlowIntensity > 0.7) {
    return {
      name: 'The Storm Cloud',
      nameKey: 'visualizations.blob.archetypes.storm.name',
      icon: '⛈️',
      color: '#EF4444',
      descriptionKey: 'visualizations.blob.archetypes.storm.description'
    };
  }
  
  // The Octopus: Many arms, high rotation, transformational
  if (blobData.arms >= 7 && blobData.rotationSpeed > 60) {
    return {
      name: 'The Octopus',
      nameKey: 'visualizations.blob.archetypes.octopus.name',
      icon: '🐙',
      color: '#F97316',
      descriptionKey: 'visualizations.blob.archetypes.octopus.description'
    };
  }
  
  // Default: Unknown Form
  return {
    name: 'Unknown Form',
    nameKey: 'visualizations.blob.archetypes.unknown.name',
    icon: '❓',
    color: '#6B7280',
    descriptionKey: 'visualizations.blob.archetypes.unknown.description'
  };
}
