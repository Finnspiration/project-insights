import { Sketch } from 'react-p5-wrapper';
import { BlobVisualData } from './blobMapping';

export interface BlobSketchProps {
  blobData: BlobVisualData;
  onHover?: (zone: string | null, x: number, y: number) => void;
  [key: string]: any;
}

export const blobSketch: Sketch<BlobSketchProps> = (p5) => {
  let blobData: BlobVisualData;
  let baseRadius = 120;
  let startTime = 0;
  let onHoverCallback: ((zone: string | null, x: number, y: number) => void) | undefined;
  
  p5.updateWithProps = (props: BlobSketchProps) => {
    blobData = props.blobData;
    onHoverCallback = props.onHover;
  };
  
  p5.setup = () => {
    p5.createCanvas(500, 500);
    p5.noFill();
    startTime = p5.millis();
  };
  
  p5.mouseMoved = () => {
    if (!blobData || !onHoverCallback) return;
    
    const centerX = p5.width / 2;
    const centerY = p5.height / 2;
    const mouseXRel = p5.mouseX - centerX;
    const mouseYRel = p5.mouseY - centerY;
    const distance = p5.dist(0, 0, mouseXRel, mouseYRel);
    const dynamicRadius = 120 * blobData.resourceScale;
    
    // Determine which zone the mouse is in
    let zone: string | null = null;
    
    if (distance > dynamicRadius * 1.3) {
      zone = 'outerGlow'; // Risk zone
    } else if (distance > dynamicRadius * 0.9) {
      zone = 'mainShape'; // Main blob
    } else if (distance > dynamicRadius * 0.6) {
      zone = 'culturalOverlay'; // Cultural layer
    } else if (distance > dynamicRadius * 0.3) {
      zone = 'innerPattern'; // Knowledge pattern
    } else if (distance <= dynamicRadius * 0.3) {
      zone = 'coreGlow'; // Development core
    }
    
    onHoverCallback(zone, p5.mouseX, p5.mouseY);
  };
  
  p5.draw = () => {
    if (!blobData) return;
    
    p5.clear();
    p5.background(0, 0, 0, 0); // Transparent background
    
    p5.push();
    p5.translate(p5.width / 2, p5.height / 2);
    
    // Dynamic radius based on resources
    const dynamicRadius = 120 * blobData.resourceScale;
    
    // Apply rotation based on change intensity
    const elapsedSeconds = (p5.millis() - startTime) / 1000;
    if (blobData.rotationSpeed > 0) {
      p5.rotate(p5.radians(elapsedSeconds * blobData.rotationSpeed));
    }
    
    // Pulse effect based on temporal dimension
    const pulsePhase = (elapsedSeconds / blobData.pulseSpeed) * p5.TWO_PI;
    const pulseFactor = 1 + 0.1 * p5.sin(pulsePhase);
    
    // Draw outer glow (risk)
    drawOuterGlow(p5, blobData, dynamicRadius * pulseFactor);
    
    // Draw main blob shape
    drawBlobShape(p5, blobData, dynamicRadius * pulseFactor, elapsedSeconds);
    
    // Draw cultural gradient overlay
    drawCulturalGradient(p5, blobData, dynamicRadius * pulseFactor);
    
    // Draw inner pattern
    drawInnerPattern(p5, blobData, dynamicRadius * pulseFactor * 0.6);
    
    // Draw core glow
    drawCoreGlow(p5, blobData, dynamicRadius * pulseFactor * 0.3);
    
    p5.pop();
  };
};

function drawOuterGlow(p5: any, data: BlobVisualData, radius: number) {
  if (data.outerGlowIntensity <= 0) return;
  
  // Pulse effect for high-risk projects
  const pulseFactor = data.outerGlowIntensity > 0.7 
    ? 1 + 0.15 * p5.sin(p5.frameCount * 0.1) 
    : 1;
  
  const glowSize = radius * 1.5 * pulseFactor;
  const alpha = data.outerGlowIntensity * 120;
  
  const color = p5.color(data.outerGlowColor);
  
  // More glow layers for dramatic effect
  for (let i = 0; i < 5; i++) {
    p5.noFill();
    p5.stroke(p5.red(color), p5.green(color), p5.blue(color), alpha / (i + 1));
    p5.strokeWeight(25 - i * 4);
    p5.circle(0, 0, glowSize + i * 25);
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
  const h = data.baseHue;
  const s = data.saturation;
  const b = data.brightness;
  
  p5.colorMode(p5.HSB, 360, 100, 100);
  
  switch (data.innerPattern) {
    case 'grid':
      // Structured grid pattern
      p5.push();
      p5.stroke(h, s * 0.6, b - 20, 150);
      p5.strokeWeight(1);
      
      const gridSize = 20;
      const gridExtent = radius;
      
      // Vertical lines
      for (let x = -gridExtent; x <= gridExtent; x += gridSize) {
        p5.line(x, -gridExtent, x, gridExtent);
      }
      
      // Horizontal lines
      for (let y = -gridExtent; y <= gridExtent; y += gridSize) {
        p5.line(-gridExtent, y, gridExtent, y);
      }
      
      p5.pop();
      break;
    
    case 'waves':
      // Animated wave pattern with noise intensity
      p5.push();
      p5.noFill();
      p5.stroke(h, s * 0.7, b - 15, 180);
      p5.strokeWeight(2);
      
      const waveCount = 5;
      const waveAmplitude = radius * 0.2 * data.noiseIntensity;
      
      for (let i = 0; i < waveCount; i++) {
        p5.beginShape();
        for (let x = -radius; x <= radius; x += 10) {
          const y = -radius + (i * radius * 2 / waveCount) + 
                    waveAmplitude * p5.sin(x * 0.05 + p5.frameCount * 0.02);
          p5.vertex(x, y);
        }
        p5.endShape();
      }
      
      p5.pop();
      break;
    
    case 'particles':
      // Animated particles
      p5.push();
      p5.fill(h, s * 0.8, b + 10, 200);
      p5.noStroke();
      
      const particleCount = 30;
      const particleRadius = radius * 0.8;
      
      for (let i = 0; i < particleCount; i++) {
        const angle = (i / particleCount) * p5.TWO_PI;
        const r = particleRadius * (0.3 + 0.7 * p5.noise(i * 0.5, p5.frameCount * 0.01));
        const x = r * p5.cos(angle);
        const y = r * p5.sin(angle);
        const size = 3 + 5 * p5.noise(i * 0.3, p5.frameCount * 0.02);
        
        p5.circle(x, y, size);
      }
      
      p5.pop();
      break;
    
    case 'chaos':
      // Glitchy lines with noise intensity
      p5.push();
      p5.stroke(h, s * 0.9, b, 150);
      p5.strokeWeight(1);
      
      const chaosLines = Math.floor(40 * data.noiseIntensity);
      
      for (let i = 0; i < chaosLines; i++) {
        const x1 = p5.random(-radius, radius);
        const y1 = p5.random(-radius, radius);
        const x2 = x1 + p5.random(-30, 30);
        const y2 = y1 + p5.random(-30, 30);
        
        p5.line(x1, y1, x2, y2);
      }
      
      p5.pop();
      break;
  }
  
  p5.colorMode(p5.RGB, 255);
}

function drawCoreGlow(p5: any, data: BlobVisualData, radius: number) {
  p5.push();
  
  // Multiple glow layers for depth
  const layers = 5;
  const maxRadius = radius;
  
  p5.colorMode(p5.HSB, 360, 100, 100);
  
  for (let i = layers; i > 0; i--) {
    const r = (i / layers) * maxRadius;
    const alpha = (data.coreGlow * 80) * (i / layers);
    
    // Warmer glow color for inner development
    const glowHue = 50; // Warm golden color
    const glowSat = 80;
    const glowBright = 90;
    
    p5.fill(glowHue, glowSat, glowBright, alpha);
    p5.noStroke();
    p5.circle(0, 0, r * 2);
  }
  
  p5.colorMode(p5.RGB, 255);
  p5.pop();
}

function drawCulturalGradient(p5: any, data: BlobVisualData, radius: number) {
  if (data.colorSpread <= 1) return; // Mono = no gradient
  
  p5.push();
  
  // Create radial gradient with multiple colors for multicultural projects
  const colors = data.colorSpread;
  const angleStep = p5.TWO_PI / colors;
  
  p5.colorMode(p5.HSB, 360, 100, 100);
  
  for (let i = 0; i < colors; i++) {
    const startAngle = i * angleStep;
    const endAngle = (i + 1) * angleStep;
    const hueShift = (360 / colors) * i;
    const h = (data.baseHue + hueShift) % 360;
    
    p5.fill(h, data.saturation * 0.3, data.brightness, 30); // Subtle overlay
    p5.noStroke();
    
    p5.arc(0, 0, radius * 2, radius * 2, startAngle, endAngle, p5.PIE);
  }
  
  p5.colorMode(p5.RGB, 255);
  p5.pop();
}
