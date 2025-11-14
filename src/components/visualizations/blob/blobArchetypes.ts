import { BlobVisualData } from './blobMapping';
import { supabase } from '@/integrations/supabase/client';

export interface BlobArchetype {
  name: string;
  nameKey?: string; // Translation key (optional, for hardcoded)
  icon: string;
  color: string;
  descriptionKey?: string; // Translation key (optional, for hardcoded)
  description?: string; // Direct text (for AI-generated)
}

function detectHardcodedArchetype(blobData: BlobVisualData): BlobArchetype | null {
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
  
  // No hardcoded match
  return null;
}

export async function detectArchetype(
  blobData: BlobVisualData,
  morphology: any,
  language: 'en' | 'da'
): Promise<BlobArchetype> {
  // Check hardcoded archetypes first (fast fallback)
  const hardcoded = detectHardcodedArchetype(blobData);
  if (hardcoded) {
    return hardcoded;
  }
  
  // Try to fetch/generate AI archetype
  try {
    const { data, error } = await supabase.functions.invoke('generate-archetype', {
      body: { morphology, language }
    });
    
    if (error) throw error;
    
    const archetype = data.archetype;
    return {
      name: archetype.name[language] || archetype.name.en || archetype.name.da || Object.values(archetype.name)[0],
      icon: archetype.icon,
      color: archetype.color,
      description: archetype.description[language] || archetype.description.en || archetype.description.da || Object.values(archetype.description)[0]
    };
  } catch (error) {
    console.error('Failed to generate archetype:', error);
    // Fallback to "Unknown Form"
    return {
      name: 'Unknown Form',
      nameKey: 'visualizations.blob.archetypes.unknown.name',
      icon: '❓',
      color: '#6B7280',
      descriptionKey: 'visualizations.blob.archetypes.unknown.description'
    };
  }
}
