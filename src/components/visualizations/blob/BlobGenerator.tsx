import { Sketch } from 'react-p5-wrapper';
import { BlobVisualData } from './blobMapping';

export interface BlobSketchProps {
  blobData: BlobVisualData;
  onHover?: (zone: string | null, x: number, y: number) => void;
  selectedZone?: string | null;
  [key: string]: any;
}

export const blobSketch: Sketch<BlobSketchProps> = (p5) => {
  let blobData: BlobVisualData;
  let baseRadius = 120;
  let startTime = 0;
  let onHoverCallback: ((zone: string | null, x: number, y: number) => void) | undefined;
  let selectedZone: string | null = null;
  let mouseParallaxX = 0;
  let mouseParallaxY = 0;
  
  p5.updateWithProps = (props: BlobSketchProps) => {
    blobData = props.blobData;
    onHoverCallback = props.onHover;
    selectedZone = props.selectedZone || null;
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
    
    // PARALLAX CALCULATION
    mouseParallaxX = mouseXRel * 0.015;
    mouseParallaxY = mouseYRel * 0.015;
    
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
    p5.background(0, 0, 0, 0);
    
    const dynamicRadius = 120 * blobData.resourceScale;
    const elapsedSeconds = (p5.millis() - startTime) / 1000;
    const pulsePhase = (elapsedSeconds / blobData.pulseSpeed) * p5.TWO_PI;
    const pulseFactor = 1 + 0.1 * p5.sin(pulsePhase);
    
    // LAYER 1: Outer glow (background, moves least)
    p5.push();
    p5.translate(p5.width / 2 + mouseParallaxX * 0.3, p5.height / 2 + mouseParallaxY * 0.3);
    if (blobData.rotationSpeed > 0) {
      p5.rotate(p5.radians(elapsedSeconds * blobData.rotationSpeed));
    }
    drawOuterGlow(p5, blobData, dynamicRadius * pulseFactor, selectedZone === 'outerGlow');
    p5.pop();
    
    // LAYER 2: Main shape (mid-ground)
    p5.push();
    p5.translate(p5.width / 2 + mouseParallaxX * 0.7, p5.height / 2 + mouseParallaxY * 0.7);
    if (blobData.rotationSpeed > 0) {
      p5.rotate(p5.radians(elapsedSeconds * blobData.rotationSpeed));
    }
    drawBlobShape(p5, blobData, dynamicRadius * pulseFactor, elapsedSeconds, selectedZone === 'mainShape');
    drawCulturalGradient(p5, blobData, dynamicRadius * pulseFactor, selectedZone === 'culturalOverlay');
    p5.pop();
    
    // LAYER 3: Inner pattern (foreground, moves most)
    p5.push();
    p5.translate(p5.width / 2 + mouseParallaxX * 1.1, p5.height / 2 + mouseParallaxY * 1.1);
    if (blobData.rotationSpeed > 0) {
      p5.rotate(p5.radians(elapsedSeconds * blobData.rotationSpeed));
    }
    drawInnerPattern(p5, blobData, dynamicRadius * pulseFactor * 0.6, selectedZone === 'innerPattern');
    drawCoreGlow(p5, blobData, dynamicRadius * pulseFactor * 0.3, selectedZone === 'coreGlow');
    p5.pop();
  };
};

function drawOuterGlow(p5: any, data: BlobVisualData, radius: number, isSelected: boolean = false) {
  if (data.outerGlowIntensity <= 0 && !isSelected) return;
  
  // SELECTION HIGHLIGHT
  if (isSelected) {
    const pulseAlpha = 150 + 105 * p5.sin(p5.frameCount * 0.15);
    p5.noFill();
    p5.stroke(255, 220, 0, pulseAlpha);
    p5.strokeWeight(6);
    p5.circle(0, 0, radius * 1.5);
    
    p5.stroke(255, 220, 0, pulseAlpha * 0.5);
    p5.strokeWeight(10);
    p5.circle(0, 0, radius * 1.55);
  }
  
  if (data.outerGlowIntensity <= 0) return;
  
  const pulseFactor = data.outerGlowIntensity > 0.7 
    ? 1 + 0.25 * p5.sin(p5.frameCount * 0.08)
    : 1 + 0.1 * p5.sin(p5.frameCount * 0.05);
  
  const glowSize = radius * 1.6 * pulseFactor;
  const baseAlpha = Math.min(data.outerGlowIntensity * 220, 255);
  const color = p5.color(data.outerGlowColor);
  
  p5.noFill();
  p5.stroke(255, 255, 255, baseAlpha * 0.3);
  p5.strokeWeight(3);
  p5.circle(0, 0, radius * 1.35);
  
  for (let i = 0; i < 8; i++) {
    const layerAlpha = baseAlpha / Math.pow(i + 1, 0.8);
    const layerSize = glowSize + i * 20;
    
    p5.stroke(
      p5.red(color), 
      p5.green(color), 
      p5.blue(color), 
      layerAlpha
    );
    p5.strokeWeight(Math.max(30 - i * 3, 2));
    p5.circle(0, 0, layerSize);
  }
  
  if (data.outerGlowIntensity > 0.7) {
    p5.stroke(
      p5.red(color), 
      p5.green(color), 
      p5.blue(color), 
      50
    );
    p5.strokeWeight(50);
    p5.circle(0, 0, glowSize * 1.3);
  }
}

function drawBlobShape(p5: any, data: BlobVisualData, radius: number, time: number, isSelected: boolean = false) {
  const angleStep = 0.05;
  const points = [];
  
  for (let angle = 0; angle < p5.TWO_PI; angle += angleStep) {
    const armPhase = angle * data.arms;
    const armMod = 1 + 0.3 * p5.sin(armPhase);
    const noiseScale = data.roughness * 2;
    const noiseVal = p5.noise(angle * noiseScale, time * 0.3);
    const symmetryFactor = p5.lerp(noiseVal, 0.5, data.symmetry);
    const r = radius * armMod * (0.7 + 0.6 * symmetryFactor);
    const x = r * p5.cos(angle);
    const y = r * p5.sin(angle);
    points.push({ x, y, angle, dist: r });
  }
  
  const h = data.baseHue;
  const s = data.saturation;
  const b = data.brightness;
  
  // DROP SHADOW (3D effect)
  p5.push();
  p5.drawingContext.shadowBlur = 25;
  p5.drawingContext.shadowColor = 'rgba(0, 0, 0, 0.25)';
  p5.drawingContext.shadowOffsetX = 8;
  p5.drawingContext.shadowOffsetY = 8;
  
  p5.colorMode(p5.HSB, 360, 100, 100);
  p5.fill(h, s, b, 80);
  p5.stroke(h, s, b - 10);
  p5.strokeWeight(2);
  
  p5.beginShape();
  points.forEach(p => p5.vertex(p.x, p.y));
  p5.endShape(p5.CLOSE);
  p5.pop();
  
  // INNER GRADIENT (depth simulation)
  p5.push();
  const gradient = p5.drawingContext.createRadialGradient(
    -radius * 0.25, -radius * 0.25, 0,
    0, 0, radius * 1.1
  );
  gradient.addColorStop(0, `hsla(${h}, 60%, 85%, 0.3)`);
  gradient.addColorStop(0.7, `hsla(${h}, 50%, 60%, 0)`);
  gradient.addColorStop(1, `hsla(${h}, 40%, 35%, 0.35)`);
  
  p5.drawingContext.fillStyle = gradient;
  p5.noStroke();
  p5.beginShape();
  points.forEach(p => p5.vertex(p.x, p.y));
  p5.endShape(p5.CLOSE);
  p5.pop();
  
  // SPECULAR HIGHLIGHTS
  p5.push();
  p5.noStroke();
  
  const peaks = points.filter((p, i) => {
    if (i % 15 !== 0) return false;
    const nextDist = points[(i + 1) % points.length].dist;
    const prevDist = points[(i - 1 + points.length) % points.length].dist;
    return p.dist > nextDist && p.dist > prevDist;
  });
  
  peaks.forEach(peak => {
    const highlightGradient = p5.drawingContext.createRadialGradient(
      peak.x - 3, peak.y - 3, 0,
      peak.x, peak.y, 18
    );
    highlightGradient.addColorStop(0, 'rgba(255, 255, 255, 0.6)');
    highlightGradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
    
    p5.drawingContext.fillStyle = highlightGradient;
    p5.circle(peak.x, peak.y, 30);
  });
  p5.pop();
  
  // SELECTION HIGHLIGHT
  if (isSelected) {
    const pulseAlpha = 120 + 80 * p5.sin(p5.frameCount * 0.12);
    p5.colorMode(p5.RGB, 255);
    p5.noFill();
    p5.stroke(255, 220, 0, pulseAlpha);
    p5.strokeWeight(5);
    p5.beginShape();
    points.forEach(p => p5.vertex(p.x, p.y));
    p5.endShape(p5.CLOSE);
  }
  
  p5.colorMode(p5.RGB, 255);
}

function drawInnerPattern(p5: any, data: BlobVisualData, radius: number, isSelected: boolean = false) {
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
  
  // SELECTION HIGHLIGHT
  if (isSelected) {
    const pulseAlpha = 130 + 90 * p5.sin(p5.frameCount * 0.13);
    p5.noFill();
    p5.colorMode(p5.RGB, 255);
    p5.stroke(255, 220, 0, pulseAlpha);
    p5.strokeWeight(4);
    p5.circle(0, 0, radius * 1.1);
    p5.colorMode(p5.HSB, 360, 100, 100);
  }
  
  p5.colorMode(p5.RGB, 255);
}

function drawCoreGlow(p5: any, data: BlobVisualData, radius: number, isSelected: boolean = false) {
  p5.push();
  
  const layers = 5;
  const maxRadius = radius;
  
  p5.colorMode(p5.HSB, 360, 100, 100);
  
  for (let i = layers; i > 0; i--) {
    const r = (i / layers) * maxRadius;
    const alpha = (data.coreGlow * 80) * (i / layers);
    
    const glowHue = 50;
    const glowSat = 80;
    const glowBright = 90;
    
    p5.fill(glowHue, glowSat, glowBright, alpha);
    p5.noStroke();
    p5.circle(0, 0, r * 2);
  }
  
  // SELECTION HIGHLIGHT
  if (isSelected) {
    const pulseAlpha = 140 + 100 * p5.sin(p5.frameCount * 0.14);
    p5.colorMode(p5.RGB, 255);
    p5.noFill();
    p5.stroke(255, 220, 0, pulseAlpha);
    p5.strokeWeight(3);
    p5.circle(0, 0, radius * 1.2);
    p5.colorMode(p5.HSB, 360, 100, 100);
  }
  
  p5.colorMode(p5.RGB, 255);
  p5.pop();
}

function drawCulturalGradient(p5: any, data: BlobVisualData, radius: number, isSelected: boolean = false) {
  if (data.colorSpread <= 1 && !isSelected) return;
  
  p5.push();
  
  if (data.colorSpread > 1) {
    const colors = data.colorSpread;
    const angleStep = p5.TWO_PI / colors;
    
    p5.colorMode(p5.HSB, 360, 100, 100);
    
    for (let i = 0; i < colors; i++) {
      const startAngle = i * angleStep;
      const endAngle = (i + 1) * angleStep;
      const hueShift = (360 / colors) * i;
      const h = (data.baseHue + hueShift) % 360;
      
      p5.fill(h, data.saturation * 0.3, data.brightness, 30);
      p5.noStroke();
      
      p5.arc(0, 0, radius * 2, radius * 2, startAngle, endAngle, p5.PIE);
    }
    
    p5.colorMode(p5.RGB, 255);
  }
  
  // SELECTION HIGHLIGHT
  if (isSelected) {
    const pulseAlpha = 100 + 70 * p5.sin(p5.frameCount * 0.1);
    p5.noFill();
    p5.stroke(255, 220, 0, pulseAlpha);
    p5.strokeWeight(4);
    p5.circle(0, 0, radius * 0.85);
  }
  
  p5.pop();
}
