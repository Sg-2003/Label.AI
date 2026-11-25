import React, { useEffect, useRef, useCallback } from 'react';

/**
 * 3D Vector Math Helpers
 */
function rotateX(p, angle) {
  const cos = Math.cos(angle);
  const sin = Math.sin(angle);
  return {
    x: p.x,
    y: p.y * cos - p.z * sin,
    z: p.y * sin + p.z * cos,
  };
}

function rotateY(p, angle) {
  const cos = Math.cos(angle);
  const sin = Math.sin(angle);
  return {
    x: p.x * cos + p.z * sin,
    y: p.y,
    z: -p.x * sin + p.z * cos,
  };
}

function rotateZ(p, angle) {
  const cos = Math.cos(angle);
  const sin = Math.sin(angle);
  return {
    x: p.x * cos - p.y * sin,
    y: p.x * sin + p.y * cos,
    z: p.z,
  };
}

function project(p, width, height, fov = 480, cameraZ = 340) {
  const z = p.z + cameraZ;
  if (z <= 10) return null;
  const scale = fov / z;
  return {
    x: width / 2 + p.x * scale,
    y: height / 2 + p.y * scale,
    scale,
    z,
  };
}

// 3D CAD Excavator Bucket / Mechanical Part Geometry
const BASE_VERTICES = [
  // Front Lip & Teeth (Bottom-front)
  { id: 'lip_l', x: -140, y: 70, z: -90 },
  { id: 'lip_fl', x: -70, y: 72, z: -105 },
  { id: 'lip_c', x: 0, y: 75, z: -115 },
  { id: 'lip_fr', x: 70, y: 72, z: -105 },
  { id: 'lip_r', x: 140, y: 70, z: -90 },

  // Cutting Teeth Points (extending forward)
  { id: 'tooth_1', x: -125, y: 82, z: -130 },
  { id: 'tooth_2', x: -65, y: 84, z: -145 },
  { id: 'tooth_3', x: 0, y: 86, z: -155 },
  { id: 'tooth_4', x: 65, y: 84, z: -145 },
  { id: 'tooth_5', x: 125, y: 82, z: -130 },

  // Floor transition to back curve
  { id: 'floor_l', x: -135, y: 65, z: 20 },
  { id: 'floor_c', x: 0, y: 68, z: 25 },
  { id: 'floor_r', x: 135, y: 65, z: 20 },

  // Back Heel Curve
  { id: 'heel_l', x: -130, y: 35, z: 110 },
  { id: 'heel_c', x: 0, y: 38, z: 115 },
  { id: 'heel_r', x: 130, y: 35, z: 110 },

  // Back Top Spine
  { id: 'spine_l', x: -120, y: -50, z: 90 },
  { id: 'spine_c', x: 0, y: -45, z: 95 },
  { id: 'spine_r', x: 120, y: -50, z: 90 },

  // Side Wings / Top Edge
  { id: 'wing_top_l', x: -125, y: -65, z: -10 },
  { id: 'wing_top_r', x: 125, y: -65, z: -10 },
  { id: 'wing_front_l', x: -135, y: -10, z: -70 },
  { id: 'wing_front_r', x: 135, y: -10, z: -70 },

  // Top Mounting Brackets (Stick Mount Ears)
  { id: 'ear_fl_l', x: -55, y: -105, z: 35 },
  { id: 'ear_fr_l', x: -25, y: -105, z: 35 },
  { id: 'ear_fl_r', x: 25, y: -105, z: 35 },
  { id: 'ear_fr_r', x: 55, y: -105, z: 35 },

  { id: 'ear_bl_l', x: -55, y: -80, z: 75 },
  { id: 'ear_br_l', x: -25, y: -80, z: 75 },
  { id: 'ear_bl_r', x: 25, y: -80, z: 75 },
  { id: 'ear_br_r', x: 55, y: -80, z: 75 },

  // Mounting Pin Holes
  { id: 'pin_l1', x: -40, y: -100, z: 40 },
  { id: 'pin_r1', x: 40, y: -100, z: 40 },
  { id: 'pin_l2', x: -40, y: -78, z: 72 },
  { id: 'pin_r2', x: 40, y: -78, z: 72 },
];

// Polygonal Faces for Wireframe & Segmentation Masks
const FACES = [
  // Teeth polygons (Segmentation: LIP)
  { indices: [0, 5, 1], type: 'lip' },
  { indices: [1, 6, 2], type: 'lip' },
  { indices: [2, 7, 3], type: 'lip' },
  { indices: [3, 8, 4], type: 'lip' },

  // Lip Plate
  { indices: [0, 1, 2, 3, 4, 12, 11, 10], type: 'lip' },

  // Interior Bucket Body Cavity
  { indices: [10, 11, 12, 15, 14, 13], type: 'body' },
  { indices: [13, 14, 15, 18, 17, 16], type: 'body' },

  // Left Side Wing (B-WING)
  { indices: [0, 10, 13, 16, 19, 21], type: 'wing_l' },

  // Right Side Wing (B-WING)
  { indices: [4, 12, 15, 18, 20, 22], type: 'wing_r' },

  // Top Mounting Ears (STICK MOUNT)
  { indices: [23, 24, 28, 27], type: 'mount' },
  { indices: [25, 26, 30, 29], type: 'mount' },
  { indices: [17, 23, 27, 16], type: 'mount' },
  { indices: [17, 25, 29, 18], type: 'mount' },
];

// Edges for 3D Neon Wireframe
const EDGES = [
  // Lip & teeth
  [0, 5], [5, 1], [1, 6], [6, 2], [2, 7], [7, 3], [3, 8], [8, 4], [4, 9],
  [0, 1], [1, 2], [2, 3], [3, 4],
  // Floor & back
  [0, 10], [1, 11], [2, 11], [3, 11], [4, 12],
  [10, 11], [11, 12],
  [10, 13], [11, 14], [12, 15],
  [13, 14], [14, 15],
  [13, 16], [14, 17], [15, 18],
  [16, 17], [17, 18],
  // Side wings
  [0, 21], [21, 19], [19, 16],
  [4, 22], [22, 20], [20, 18],
  [21, 10], [19, 13],
  [22, 12], [20, 15],
  // Top ears
  [23, 24], [24, 28], [28, 27], [27, 23],
  [25, 26], [26, 30], [30, 29], [29, 25],
  [23, 16], [24, 17], [25, 17], [26, 18],
  [27, 16], [28, 17], [29, 17], [30, 18],
  // Pin circles cross
  [31, 32], [33, 34]
];

// HUD Callout Targets attached to 3D Vertex indices
const HUD_TARGETS = [
  {
    vertexIndex: 7, // Tooth 3 / Lip
    code: 'LIP',
    label: 'COMPONENT: TOOTH & LIP',
    meta: 'SEGMENT_ID: #01-A | CONF: 99.8%',
    vTag: 'V1',
    lineOffset: { dx: -120, dy: 70 },
  },
  {
    vertexIndex: 19, // Left Wing Top
    code: 'U-EDGE',
    label: 'U-EDGE [3D MESH]',
    meta: 'CURVE_TOL: 0.02mm | IOU: 0.96',
    vTag: 'V1',
    lineOffset: { dx: -130, dy: -60 },
  },
  {
    vertexIndex: 20, // Right Wing Top
    code: 'B-WING',
    label: 'B-WING [SIDE PANEL]',
    meta: 'THICKNESS: 24mm | HARDENED',
    vTag: 'V2',
    lineOffset: { dx: 130, dy: -50 },
  },
  {
    vertexIndex: 31, // Left Pin
    code: 'STICK',
    label: 'STICK MOUNT PIVOT',
    meta: 'BORE: Ø90mm | DUAL-SHEAR',
    vTag: 'V1',
    lineOffset: { dx: -140, dy: -90 },
  },
  {
    vertexIndex: 22, // Right Wing Front
    code: 'POINT',
    label: 'CORNER APEX [POINT]',
    meta: '00:03:42 09.849182',
    vTag: 'V2',
    lineOffset: { dx: 140, dy: 60 },
  },
];

export default function AnimatedBackground() {
  const canvasRef = useRef(null);
  const mouseRef = useRef({ x: 0, y: 0, targetX: 0, targetY: 0 });
  const scrollRef = useRef({ y: 0, targetY: 0 });
  const animFrameRef = useRef(null);

  // Neural Cloud Particles for background & dissolution phase
  const neuralNodesRef = useRef([]);

  const lerp = (a, b, t) => a + (b - a) * t;

  const initNeuralNodes = useCallback((width, height) => {
    const count = 75;
    const nodes = [];
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const dist = 80 + Math.random() * Math.max(width, height) * 0.45;
      nodes.push({
        x: Math.cos(angle) * dist,
        y: Math.sin(angle) * dist,
        z: (Math.random() - 0.5) * 350,
        baseX: Math.cos(angle) * dist,
        baseY: Math.sin(angle) * dist,
        baseZ: (Math.random() - 0.5) * 350,
        vx: (Math.random() - 0.5) * 0.4,
        vy: (Math.random() - 0.5) * 0.4,
        radius: Math.random() * 2 + 1,
        color: Math.random() > 0.4 ? '#00f3ff' : '#818cf8',
        pulseOffset: Math.random() * Math.PI * 2,
        pulseSpeed: 0.02 + Math.random() * 0.03,
      });
    }
    return nodes;
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    let width = window.innerWidth;
    let height = window.innerHeight;

    const resize = () => {
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = width;
      canvas.height = height;
      if (neuralNodesRef.current.length === 0) {
        neuralNodesRef.current = initNeuralNodes(width, height);
      }
    };
    resize();
    window.addEventListener('resize', resize);

    // Mouse movement
    const handleMouseMove = (e) => {
      mouseRef.current.targetX = (e.clientX - width / 2) / (width / 2);
      mouseRef.current.targetY = (e.clientY - height / 2) / (height / 2);
    };
    window.addEventListener('mousemove', handleMouseMove);

    // Scroll movement
    const handleScroll = () => {
      scrollRef.current.targetY = window.scrollY;
    };
    window.addEventListener('scroll', handleScroll, { passive: true });

    let time = 0;
    let sparkParticles = [];

    const animate = () => {
      time++;

      // Smooth interpolation for mouse & scroll
      mouseRef.current.x = lerp(mouseRef.current.x, mouseRef.current.targetX, 0.06);
      mouseRef.current.y = lerp(mouseRef.current.y, mouseRef.current.targetY, 0.06);
      scrollRef.current.y = lerp(scrollRef.current.y, scrollRef.current.targetY, 0.08);

      const mouseX = mouseRef.current.x;
      const mouseY = mouseRef.current.y;
      const scrollY = scrollRef.current.y;

      // Scroll progress (0 to 1 over first 700px)
      const scrollProgress = Math.min(1, Math.max(0, scrollY / 700));

      // Clear Canvas
      ctx.clearRect(0, 0, width, height);

      // Deep dark cybernetic background glow
      const bgGrad = ctx.createRadialGradient(
        width / 2 + mouseX * 50,
        height / 2 + mouseY * 50 - scrollProgress * 100,
        20,
        width / 2,
        height / 2,
        Math.max(width, height) * 0.7
      );
      bgGrad.addColorStop(0, 'rgba(10, 25, 47, 0.75)');
      bgGrad.addColorStop(0.5, 'rgba(8, 14, 28, 0.85)');
      bgGrad.addColorStop(1, '#0a0d14');
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, width, height);

      // Cybernetic Ambient Grid Dots
      const gridSpacing = 48;
      const gridShiftX = (mouseX * 15) % gridSpacing;
      const gridShiftY = (mouseY * 15 - scrollY * 0.15) % gridSpacing;
      ctx.fillStyle = 'rgba(0, 243, 255, 0.04)';
      for (let gx = -gridSpacing + gridShiftX; gx < width + gridSpacing; gx += gridSpacing) {
        for (let gy = -gridSpacing + gridShiftY; gy < height + gridSpacing; gy += gridSpacing) {
          ctx.beginPath();
          ctx.arc(gx, gy, 0.8, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      // 3D Object Rotation (Pitch & Yaw influenced by mouse and idle drift)
      const idleYaw = Math.sin(time * 0.008) * 0.15;
      const idlePitch = Math.cos(time * 0.006) * 0.08;
      const rotY = idleYaw + mouseX * 0.45;
      const rotX = -0.32 + idlePitch + mouseY * 0.35 + scrollProgress * 0.2;
      const rotZ = Math.sin(time * 0.005) * 0.04 - mouseX * 0.08;

      // Scale model based on viewport size & scroll
      const baseScale = Math.min(width, height) * 0.0024 * (1 + scrollProgress * 0.15);
      const centerOffsetY = -30 - scrollProgress * 40;

      // Transform Vertices
      const projectedVertices = [];
      const transformed3D = [];

      for (let i = 0; i < BASE_VERTICES.length; i++) {
        const v = BASE_VERTICES[i];
        let p = {
          x: v.x * baseScale,
          y: v.y * baseScale,
          z: v.z * baseScale,
        };

        // If scrolling heavily, morph slightly outward towards neural cloud
        if (scrollProgress > 0.4) {
          const explodeFactor = (scrollProgress - 0.4) * 0.6;
          p.x *= (1 + explodeFactor);
          p.y *= (1 + explodeFactor);
          p.z *= (1 + explodeFactor);
        }

        p = rotateZ(p, rotZ);
        p = rotateX(p, rotX);
        p = rotateY(p, rotY);
        p.y += centerOffsetY;

        transformed3D.push(p);

        const proj = project(p, width, height, 520, 380);
        projectedVertices.push(proj);
      }

      // Calculate Laser Scan Beam Position (moves continuously & tracks scroll)
      const scanCycle = ((time * 0.012 + scrollProgress * 1.5) % 2.4) - 1.2; // Normalized -1.2 to 1.2
      const scanYWorld = scanCycle * 130 * baseScale + centerOffsetY;
      const scanProjY = height / 2 + scanYWorld * (520 / 380);

      // 1. Draw Segmentation Fill Masks (translucent cybernetic colored faces)
      const sortedFaces = [...FACES].map((face, index) => {
        let avgZ = 0;
        let valid = true;
        face.indices.forEach((idx) => {
          if (!transformed3D[idx]) valid = false;
          else avgZ += transformed3D[idx].z;
        });
        avgZ /= face.indices.length;
        return { face, avgZ, valid, index };
      }).filter(f => f.valid);

      // Sort faces back-to-front
      sortedFaces.sort((a, b) => b.avgZ - a.avgZ);

      sortedFaces.forEach(({ face }) => {
        const pts = face.indices.map(i => projectedVertices[i]).filter(Boolean);
        if (pts.length < 3) return;

        ctx.beginPath();
        ctx.moveTo(pts[0].x, pts[0].y);
        for (let i = 1; i < pts.length; i++) {
          ctx.lineTo(pts[i].x, pts[i].y);
        }
        ctx.closePath();

        const faceAvgScreenY = pts.reduce((sum, pt) => sum + pt.y, 0) / pts.length;
        const distFromScan = faceAvgScreenY - scanProjY;
        const isScanned = distFromScan > -40;

        let fillColor = 'rgba(6, 182, 212, 0.08)';
        let strokeColor = 'rgba(6, 182, 212, 0.25)';

        if (face.type === 'lip') {
          fillColor = isScanned ? 'rgba(0, 243, 255, 0.28)' : 'rgba(0, 243, 255, 0.10)';
          strokeColor = 'rgba(0, 243, 255, 0.7)';
        } else if (face.type === 'wing_l' || face.type === 'wing_r') {
          fillColor = isScanned ? 'rgba(168, 85, 247, 0.22)' : 'rgba(168, 85, 247, 0.08)';
          strokeColor = 'rgba(168, 85, 247, 0.5)';
        } else if (face.type === 'mount') {
          fillColor = isScanned ? 'rgba(99, 102, 241, 0.24)' : 'rgba(99, 102, 241, 0.08)';
          strokeColor = 'rgba(99, 102, 241, 0.6)';
        } else {
          fillColor = isScanned ? 'rgba(14, 165, 233, 0.16)' : 'rgba(14, 165, 233, 0.05)';
        }

        ctx.fillStyle = fillColor;
        ctx.fill();

        ctx.strokeStyle = strokeColor;
        ctx.lineWidth = 0.75;
        ctx.stroke();
      });

      // 2. Draw 3D Wireframe Edges (Glowing Neon Cyan lines)
      ctx.lineWidth = 1.2;
      EDGES.forEach(([i, j]) => {
        const p1 = projectedVertices[i];
        const p2 = projectedVertices[j];
        if (!p1 || !p2) return;

        const edgeMidY = (p1.y + p2.y) / 2;
        const scanProximity = Math.max(0, 1 - Math.abs(edgeMidY - scanProjY) / 75);

        ctx.beginPath();
        ctx.moveTo(p1.x, p1.y);
        ctx.lineTo(p2.x, p2.y);

        if (scanProximity > 0.1) {
          ctx.strokeStyle = `rgba(0, 243, 255, ${0.4 + scanProximity * 0.6})`;
          ctx.shadowColor = '#00f3ff';
          ctx.shadowBlur = 8 * scanProximity;
        } else {
          ctx.strokeStyle = 'rgba(99, 102, 241, 0.35)';
          ctx.shadowBlur = 0;
        }
        ctx.stroke();
      });
      ctx.shadowBlur = 0;

      // 3. Draw Laser Scanline (Horizontal Electric Beam)
      if (scanProjY > height * 0.12 && scanProjY < height * 0.88) {
        ctx.save();
        const beamWidth = width * 0.75;
        const beamStartX = width / 2 - beamWidth / 2;
        const beamEndX = width / 2 + beamWidth / 2;

        const scanGrad = ctx.createLinearGradient(beamStartX, scanProjY, beamEndX, scanProjY);
        scanGrad.addColorStop(0, 'rgba(0, 243, 255, 0)');
        scanGrad.addColorStop(0.2, 'rgba(0, 243, 255, 0.5)');
        scanGrad.addColorStop(0.5, 'rgba(255, 255, 255, 0.95)');
        scanGrad.addColorStop(0.8, 'rgba(0, 243, 255, 0.5)');
        scanGrad.addColorStop(1, 'rgba(0, 243, 255, 0)');

        // Glow halo
        ctx.strokeStyle = 'rgba(0, 243, 255, 0.35)';
        ctx.lineWidth = 6;
        ctx.shadowColor = '#00f3ff';
        ctx.shadowBlur = 18;
        ctx.beginPath();
        ctx.moveTo(beamStartX, scanProjY);
        ctx.lineTo(beamEndX, scanProjY);
        ctx.stroke();

        // Core electric laser line with slight sine modulation
        ctx.strokeStyle = scanGrad;
        ctx.lineWidth = 1.8;
        ctx.shadowBlur = 8;
        ctx.beginPath();
        ctx.moveTo(beamStartX, scanProjY);
        for (let bx = beamStartX; bx <= beamEndX; bx += 25) {
          const jitter = Math.sin(bx * 0.05 + time * 0.4) * 1.5;
          ctx.lineTo(bx, scanProjY + jitter);
        }
        ctx.stroke();
        ctx.restore();

        // Spawn spark particles at the beam
        if (Math.random() < 0.6) {
          sparkParticles.push({
            x: width / 2 + (Math.random() - 0.5) * 240,
            y: scanProjY + (Math.random() - 0.5) * 6,
            vx: (Math.random() - 0.5) * 2.5,
            vy: (Math.random() - 0.5) * 2.5,
            life: 1,
            decay: 0.03 + Math.random() * 0.04,
            size: Math.random() * 2 + 1,
          });
        }
      }

      // Update & Render Sparks
      sparkParticles = sparkParticles.filter(p => p.life > 0);
      sparkParticles.forEach(p => {
        p.x += p.vx;
        p.y += p.vy;
        p.life -= p.decay;
        ctx.fillStyle = `rgba(0, 243, 255, ${p.life})`;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
      });

      // 4. Neural Network Constellation
      const nodes = neuralNodesRef.current;
      const centerScrX = width / 2;
      const centerScrY = height / 2 + centerOffsetY;

      ctx.lineWidth = 0.6;
      for (let i = 0; i < nodes.length; i++) {
        const nA = nodes[i];
        const screenX_A = centerScrX + nA.x + mouseX * 25;
        const screenY_A = centerScrY + nA.y + mouseY * 25;

        for (let j = i + 1; j < nodes.length; j++) {
          const nB = nodes[j];
          const screenX_B = centerScrX + nB.x + mouseX * 25;
          const screenY_B = centerScrY + nB.y + mouseY * 25;

          const dx = screenX_A - screenX_B;
          const dy = screenY_A - screenY_B;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < 135) {
            const edgeAlpha = (1 - dist / 135) * (0.12 + scrollProgress * 0.25);
            ctx.strokeStyle = `rgba(0, 243, 255, ${edgeAlpha})`;
            ctx.beginPath();
            ctx.moveTo(screenX_A, screenY_A);
            ctx.lineTo(screenX_B, screenY_B);
            ctx.stroke();

            // Data pulse packet along lines
            if ((i + j + Math.floor(time * 0.06)) % 11 === 0) {
              const tPulse = (time * 0.03) % 1;
              const px = screenX_A + (screenX_B - screenX_A) * tPulse;
              const py = screenY_A + (screenY_B - screenY_A) * tPulse;
              ctx.fillStyle = '#00f3ff';
              ctx.beginPath();
              ctx.arc(px, py, 1.4, 0, Math.PI * 2);
              ctx.fill();
            }
          }
        }

        const pulse = Math.sin(time * nA.pulseSpeed + nA.pulseOffset);
        const nodeAlpha = Math.max(0.15, 0.4 + pulse * 0.25 + scrollProgress * 0.35);

        ctx.fillStyle = nA.color;
        ctx.globalAlpha = nodeAlpha;
        ctx.beginPath();
        ctx.arc(screenX_A, screenY_A, nA.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1;
      }

      // 5. Draw Cybernetic Computer Vision HUD Callout Overlays
      HUD_TARGETS.forEach((target, index) => {
        const pt = projectedVertices[target.vertexIndex];
        if (!pt) return;

        const hudPulse = Math.sin(time * 0.05 + index * 1.5) * 0.5 + 0.5;
        const targetX = pt.x;
        const targetY = pt.y;

        const destX = targetX + target.lineOffset.dx;
        const destY = targetY + target.lineOffset.dy;
        const kneeX = targetX + target.lineOffset.dx * 0.4;
        const kneeY = destY;

        ctx.save();

        // Vertex Reticle Bracket `[ + ]`
        const reticleSize = 9;
        ctx.strokeStyle = 'rgba(0, 243, 255, 0.85)';
        ctx.lineWidth = 1.2;

        ctx.beginPath();
        // Top-left
        ctx.moveTo(targetX - reticleSize, targetY - reticleSize + 3);
        ctx.lineTo(targetX - reticleSize, targetY - reticleSize);
        ctx.lineTo(targetX - reticleSize + 3, targetY - reticleSize);
        // Top-right
        ctx.moveTo(targetX + reticleSize - 3, targetY - reticleSize);
        ctx.lineTo(targetX + reticleSize, targetY - reticleSize);
        ctx.lineTo(targetX + reticleSize, targetY - reticleSize + 3);
        // Bottom-left
        ctx.moveTo(targetX - reticleSize, targetY + reticleSize - 3);
        ctx.lineTo(targetX - reticleSize, targetY + reticleSize);
        ctx.lineTo(targetX - reticleSize + 3, targetY + reticleSize);
        // Bottom-right
        ctx.moveTo(targetX + reticleSize - 3, targetY + reticleSize);
        ctx.lineTo(targetX + reticleSize, targetY + reticleSize);
        ctx.lineTo(targetX + reticleSize, targetY + reticleSize - 3);
        ctx.stroke();

        // Center dot
        ctx.fillStyle = '#00f3ff';
        ctx.beginPath();
        ctx.arc(targetX, targetY, 2, 0, Math.PI * 2);
        ctx.fill();

        // V1 / V2 Tag next to bracket
        ctx.font = '600 9px "JetBrains Mono", monospace';
        ctx.fillStyle = 'rgba(0, 243, 255, 0.9)';
        ctx.fillText(target.vTag, targetX + 12, targetY - 4);

        // Angled Leader Line (target -> knee -> callout box)
        ctx.strokeStyle = 'rgba(0, 243, 255, 0.45)';
        ctx.lineWidth = 0.9;
        ctx.beginPath();
        ctx.moveTo(targetX, targetY);
        ctx.lineTo(kneeX, kneeY);
        ctx.lineTo(destX, destY);
        ctx.stroke();

        // Joint dot at knee
        ctx.fillStyle = '#00f3ff';
        ctx.beginPath();
        ctx.arc(kneeX, kneeY, 1.5, 0, Math.PI * 2);
        ctx.fill();

        // HUD Text Card
        const isLeft = target.lineOffset.dx < 0;
        const cardX = isLeft ? destX - 145 : destX + 5;
        const cardY = destY - 14;
        const cardW = 140;
        const cardH = 30;

        // Card Background Pill
        ctx.fillStyle = 'rgba(10, 16, 28, 0.85)';
        ctx.fillRect(cardX, cardY, cardW, cardH);

        // Card Border
        ctx.strokeStyle = hudPulse > 0.6 ? 'rgba(0, 243, 255, 0.7)' : 'rgba(99, 102, 241, 0.4)';
        ctx.lineWidth = 0.8;
        ctx.strokeRect(cardX, cardY, cardW, cardH);

        // Small Corner Accent
        ctx.fillStyle = '#00f3ff';
        ctx.fillRect(cardX, cardY, 3, 3);

        // Callout Title
        ctx.font = '700 9.5px "JetBrains Mono", monospace';
        ctx.fillStyle = '#f8fafc';
        ctx.fillText(target.code, cardX + 7, cardY + 12);

        // Metadata Subtext
        ctx.font = '500 7.5px "JetBrains Mono", monospace';
        ctx.fillStyle = 'rgba(148, 163, 184, 0.9)';
        ctx.fillText(target.meta, cardX + 7, cardY + 23);

        ctx.restore();
      });

      // 6. Center Light Flare & Core Consensus Burst
      if (scrollProgress > 0.25) {
        const flareAlpha = Math.min(0.65, (scrollProgress - 0.25) * 1.2);
        const flareGrad = ctx.createRadialGradient(
          centerScrX, centerScrY, 0,
          centerScrX, centerScrY, 180 * scrollProgress
        );
        flareGrad.addColorStop(0, `rgba(255, 255, 255, ${flareAlpha * 0.9})`);
        flareGrad.addColorStop(0.2, `rgba(0, 243, 255, ${flareAlpha * 0.7})`);
        flareGrad.addColorStop(0.6, `rgba(99, 102, 241, ${flareAlpha * 0.3})`);
        flareGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');

        ctx.fillStyle = flareGrad;
        ctx.beginPath();
        ctx.arc(centerScrX, centerScrY, 180 * scrollProgress, 0, Math.PI * 2);
        ctx.fill();
      }

      animFrameRef.current = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      window.removeEventListener('resize', resize);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('scroll', handleScroll);
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [initNeuralNodes]);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        zIndex: 0,
        pointerEvents: 'none',
      }}
    />
  );
}
