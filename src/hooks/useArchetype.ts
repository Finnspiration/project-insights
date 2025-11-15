import { useQuery } from '@tanstack/react-query';
import { detectArchetype } from '@/components/visualizations/blob/blobArchetypes';
import { mapMorphologyToBlob } from '@/components/visualizations/blob/blobMapping';

export function useArchetype(morphology: any, language: 'en' | 'da') {
  return useQuery({
    queryKey: ['archetype', morphology, language],
    queryFn: async () => {
      const blobData = mapMorphologyToBlob(morphology);
      return await detectArchetype(blobData, morphology, language);
    },
    enabled: !!morphology,
    staleTime: 5 * 60 * 1000, // 5 minutes cache
    retry: 2
  });
}
