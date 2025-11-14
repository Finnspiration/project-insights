import { Sketch } from 'react-p5-wrapper';
import { BlobVisualData } from './blobMapping';

export interface BlobSketchProps {
  blobData: BlobVisualData;
  [key: string]: any;
}

export const blobSketch: Sketch<BlobSketchProps> = (p5) => {
  let blobData: BlobVisualData;
  let baseRadius = 120;
  let startTime = 0;
  
  p5.updateWithProps = (props: BlobSketchProps) => {
    blobData = props.blobData;
  };
  
  p5.setup = () => {
    p5.createCanvas(500, 500);
    p5.noFill();
    startTime = p5.millis();
  };
  
  p5.draw = () => {
    if (!blobData) return;
    
    p5.clear();
    p5.background(0, 0, 0, 0); // Transparent background
    
    p5.push();
    p5.translate(p5.width / 2, p5.height / 2);
    
    // Apply rotation based on change intensity
    const elapsedSeconds = (p5.millis() - startTime) / 1000;
    if (blobData.rotationSpeed > 0) {
      p5.rotate(p5.radians(elapsedSeconds * blobData.rotationSpeed));
    }
    
    // Pulse effect based on temporal dimension
    const pulsePhase = (elapsedSeconds / blobData.pulseSpeed) * p5.TWO_PI;
    const pulseFactor = 1 + 0.1 * p5.sin(pulsePhase);
    
    // Draw outer glow (risk)
    drawOuterGlow(p5, blobData, baseRadius * pulseFactor);
    
    // Draw main blob shape
    drawBlobShape(p5, blobData, baseRadius * pulseFactor, elapsedSeconds);
    
    // Draw inner pattern
    drawInnerPattern(p5, blobData, baseRadius * pulseFactor * 0.6);
    
    // Draw core glow
    drawCoreGlow(p5, blobData, baseRadius * pulseFactor * 0.3);
    
    p5.pop();
  };
};

function drawOuterGlow(p5: any, data: BlobVisualData, radius: number) {
  if (data.outerGlowIntensity <= 0) return;
  
  const glowSize = radius * 1.5;
  const alpha = data.outerGlowIntensity * 100;
  
  // Parse the hex color
  const color = p5.color(data.outerGlowColor);
  
  for (let i = 0; i < 3; i++) {
    p5.noFill();
    p5.stroke(p5.red(color), p5.green(color), p5.blue(color), alpha / (i + 1));
    p5.strokeWeight(20 - i * 5);
    p5.circle(0, 0, glowSize + i * 20);
  }
}

function drawBlobShape(p5: any, data: BlobVisualData, radius: number, time: number) {
  p5.beginShape();
  
  const angleStep = 0.05;
  
  for (let angle = 0; angle < p5.TWO_PI; angle += angleStep) {
    // Arm modulation - creates tentacles/lobes
    const armPhase = angle * (data.arms / 2);
    const armMod = 1 + 0.3 * p5.sin(armPhase);
    
    // Perlin noise for roughness/complexity
    const noiseScale = data.roughness * 2;
    const noiseVal = p5.noise(
      angle * noiseScale,
      time * 0.3
    );
    
    // Symmetry adjustment - lerp between noise and smooth
    const symmetryFactor = p5.lerp(noiseVal, 0.5, data.symmetry);
    
    // Calculate radius with all modulations
    const r = radius * armMod * (0.7 + 0.6 * symmetryFactor);
    const x = r * p5.cos(angle);
    const y = r * p5.sin(angle);
    
    p5.vertex(x, y);
  }
  
  p5.endShape(p5.CLOSE);
  
  // Fill with base color
  const h = data.baseHue;
  const s = data.saturation;
  const b = data.brightness;
  
  p5.colorMode(p5.HSB, 360, 100, 100);
  p5.fill(h, s, b, 80);
  p5.stroke(h, s, b - 10);
  p5.strokeWeight(2);
  
  // Redraw to apply fill
  p5.beginShape();
  for (let angle = 0; angle < p5.TWO_PI; angle += angleStep) {
    const armPhase = angle * (data.arms / 2);
    const armMod = 1 + 0.3 * p5.sin(armPhase);
    const noiseScale = data.roughness * 2;
    const noiseVal = p5.noise(angle * noiseScale, time * 0.3);
    const symmetryFactor = p5.lerp(noiseVal, 0.5, data.symmetry);
    const r = radius * armMod * (0.7 + 0.6 * symmetryFactor);
    const x = r * p5.cos(angle);
    const y = r * p5.sin(angle);
    p5.vertex(x, y);
  }
  p5.endShape(p5.CLOSE);
  
  p5.colorMode(p5.RGB, 255);
}

function drawInnerPattern(p5: any, data: BlobVisualData, radius: number) {
  p5.push();
  
  const alpha = data.noiseIntensity * 150;
  
  switch (data.innerPattern) {
    case 'grid':
      // Grid pattern for routine work
      p5.stroke(255, 255, 255, alpha);
      p5.strokeWeight(1);
      const gridSize = radius / 5;
      for (let x = -radius; x < radius; x += gridSize) {
        p5.line(x, -radius, x, radius);
      }
      for (let y = -radius; y < radius; y += gridSize) {
        p5.line(-radius, y, radius, y);
      }
      break;
      
    case 'waves':
      // Wave pattern for adaptive work
      p5.stroke(255, 255, 255, alpha);
      p5.strokeWeight(2);
      p5.noFill();
      for (let i = 0; i < 5; i++) {
        p5.beginShape();
        for (let x = -radius; x < radius; x += 10) {
          const y = p5.sin(x * 0.05 + i) * (radius / 5) - radius + i * (radius / 2.5);
          p5.vertex(x, y);
        }
        p5.endShape();
      }
      break;
      
    case 'particles':
      // Particle pattern for innovative work
      p5.fill(255, 255, 255, alpha);
      p5.noStroke();
      for (let i = 0; i < 30; i++) {
        const angle = p5.random(p5.TWO_PI);
        const r = p5.random(radius * 0.8);
        const x = r * p5.cos(angle);
        const y = r * p5.sin(angle);
        p5.circle(x, y, p5.random(2, 6));
      }
      break;
      
    case 'chaos':
      // Chaotic pattern for breakthrough work
      p5.stroke(255, 255, 255, alpha);
      p5.strokeWeight(1);
      for (let i = 0; i < 20; i++) {
        const x1 = p5.random(-radius, radius);
        const y1 = p5.random(-radius, radius);
        const x2 = p5.random(-radius, radius);
        const y2 = p5.random(-radius, radius);
        p5.line(x1, y1, x2, y2);
      }
      break;
  }
  
  p5.pop();
}

function drawCoreGlow(p5: any, data: BlobVisualData, radius: number) {
  const glowIntensity = data.coreGlow * 255;
  
  // Radial gradient for inner glow
  for (let r = radius; r > 0; r -= 5) {
    const alpha = p5.map(r, 0, radius, glowIntensity, 0);
    p5.fill(255, 255, 200, alpha);
    p5.noStroke();
    p5.circle(0, 0, r * 2);
  }
}
