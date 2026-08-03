import { ReactNode } from 'react';
import { GroupedControls } from './GroupedControls';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from '@/components/ui/resizable';
import type { RawMorphology, Morphology } from '@shared/morphology.ts';
import type { IDGScores } from '@/types/project';

interface CompactSplitLayoutProps {
  morphology: RawMorphology;
  onMorphologyChange: (newMorphology: Morphology) => void;
  weatherMapContent: ReactNode;
  idgScores?: any;
  onIdgScoresChange?: (newScores: IDGScores) => void;
}

export function CompactSplitLayout({ 
  morphology, 
  onMorphologyChange, 
  weatherMapContent,
  idgScores,
  onIdgScoresChange
}: CompactSplitLayoutProps) {
  console.log('📊 CompactSplitLayout received IDG scores:', idgScores);
  
  return (
    <ResizablePanelGroup direction="horizontal" className="min-h-[600px] w-full">
      {/* Controls Panel - Left Side */}
      <ResizablePanel defaultSize={35} minSize={25} maxSize={45}>
        <div className="h-full border-r border-border/50 bg-muted/20 min-w-[240px] @container">
          <ScrollArea className="h-full">
            <div className="p-3 @md:p-4">
              <GroupedControls 
                morphology={morphology}
                onMorphologyChange={onMorphologyChange}
                idgScores={idgScores}
                onIdgScoresChange={onIdgScoresChange}
              />
            </div>
          </ScrollArea>
        </div>
      </ResizablePanel>

      <ResizableHandle withHandle />

      {/* Weather Map - Right Side */}
      <ResizablePanel defaultSize={65} minSize={55}>
        <div className="h-full w-full">
          {weatherMapContent}
        </div>
      </ResizablePanel>
    </ResizablePanelGroup>
  );
}
