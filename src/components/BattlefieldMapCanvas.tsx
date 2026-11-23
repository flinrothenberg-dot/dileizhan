import React, { useEffect, useRef } from 'react';
import { TerrainType } from '../types/game';

interface BattlefieldMapCanvasProps {
  tiles: TerrainType[][];
  width: number;
  height: number;
}

function hash2D(x: number, y: number, seed = 1337): number {
  let n = Math.sin(x * 127.1 + y * 311.7 + seed * 74.7) * 43758.5453123;
  return n - Math.floor(n);
}

function smoothNoise(x: number, y: number, seed = 1337): number {
  const ix = Math.floor(x);
  const iy = Math.floor(y);
  const fx = x - ix;
  const fy = y - iy;
  const ux = fx * fx * (3 - 2 * fx);
  const uy = fy * fy * (3 - 2 * fy);
  const a = hash2D(ix, iy, seed);
  const b = hash2D(ix + 1, iy, seed);
  const c = hash2D(ix, iy + 1, seed);
  const d = hash2D(ix + 1, iy + 1, seed);
  return a + (b - a) * ux + (c - a) * uy + (a - b - c + d) * ux * uy;
}

export const BattlefieldMapCanvas: React.FC<BattlefieldMapCanvasProps> = ({
  tiles,
  width,
  height,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const cellSize = 128;
    const cw = width * cellSize;
    const ch = height * cellSize;
    canvas.width = cw;
    canvas.height = ch;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const at = (x: number, y: number): TerrainType | null =>
      x >= 0 && y >= 0 && x < width && y < height ? tiles[y][x] : null;

    const isRoadConnect = (t: TerrainType | null) =>
      t === 'dirt_road' || t === 'bridge' || t === 'courtyard';

    // 1. Seamless Hand-Painted North China Countryside Ground
    const baseGrad = ctx.createLinearGradient(0, 0, cw, ch);
    baseGrad.addColorStop(0, '#6a7c45');
    baseGrad.addColorStop(0.5, '#5f723c');
    baseGrad.addColorStop(1, '#526534');
    ctx.fillStyle = baseGrad;
    ctx.fillRect(0, 0, cw, ch);

    // Organic terrain texture blotches & painterly brushstrokes across whole canvas
    for (let i = 0; i < 1800; i++) {
      const rx = hash2D(i, 1, 91) * cw;
      const ry = hash2D(i, 2, 91) * ch;
      const rad = 14 + hash2D(i, 3, 91) * 44;
      const tone = hash2D(i, 4, 91);
      ctx.fillStyle =
        tone < 0.35
          ? 'rgba(130, 118, 66, 0.11)'
          : tone < 0.7
          ? 'rgba(84, 110, 52, 0.14)'
          : 'rgba(54, 74, 34, 0.13)';
      ctx.beginPath();
      ctx.ellipse(rx, ry, rad, rad * 0.68, tone * Math.PI, 0, Math.PI * 2);
      ctx.fill();
    }

    // Grass tufts & crop hints on grass cells
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const t = tiles[y][x];
        const cx = x * cellSize;
        const cy = y * cellSize;
        if (t === 'grass') {
          // Subtle field furrows on some tiles
          if (hash2D(x, y, 21) > 0.55) {
            ctx.strokeStyle = 'rgba(72, 96, 40, 0.25)';
            ctx.lineWidth = 2;
            for (let r = 18; r < cellSize; r += 22) {
              ctx.beginPath();
              ctx.moveTo(cx + 8, cy + r);
              ctx.lineTo(cx + cellSize - 8, cy + r);
              ctx.stroke();
            }
          }
          // Grass blades
          for (let g = 0; g < 8; g++) {
            const gx = cx + 14 + hash2D(x * 11 + g, y, 5) * (cellSize - 28);
            const gy = cy + 16 + hash2D(x, y * 13 + g, 7) * (cellSize - 28);
            ctx.strokeStyle = 'rgba(165, 192, 98, 0.35)';
            ctx.lineWidth = 1.8;
            ctx.beginPath();
            ctx.moveTo(gx, gy);
            ctx.lineTo(gx - 3, gy - 8);
            ctx.moveTo(gx, gy);
            ctx.lineTo(gx + 3, gy - 7);
            ctx.stroke();
          }
        }
      }
    }

    // 2. Village Courtyards (packed loess threshing ground & stone slabs)
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        if (tiles[y][x] !== 'courtyard') continue;
        const cx = x * cellSize;
        const cy = y * cellSize;
        const g = ctx.createRadialGradient(
          cx + cellSize / 2,
          cy + cellSize / 2,
          10,
          cx + cellSize / 2,
          cy + cellSize / 2,
          cellSize * 0.72
        );
        g.addColorStop(0, '#c8ac7d');
        g.addColorStop(1, '#a7895c');
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.roundRect(cx - 4, cy - 4, cellSize + 8, cellSize + 8, 18);
        ctx.fill();

        // Flagstone paver accents
        ctx.strokeStyle = 'rgba(92, 68, 38, 0.22)';
        ctx.lineWidth = 2;
        for (let r = 0; r < 3; r++) {
          for (let c = 0; c < 3; c++) {
            if (hash2D(x * 3 + c, y * 3 + r, 44) > 0.35) {
              ctx.strokeRect(
                cx + 10 + c * 36,
                cy + 10 + r * 36,
                32,
                32
              );
            }
          }
        }
      }
    }

    // 3. Seamless Connected Dirt Roads
    const drawRoadLayer = (strokeColor: string, roadWidth: number) => {
      ctx.strokeStyle = strokeColor;
      ctx.fillStyle = strokeColor;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.lineWidth = roadWidth;

      for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
          if (tiles[y][x] !== 'dirt_road') continue;
          const mx = x * cellSize + cellSize / 2;
          const my = y * cellSize + cellSize / 2;

          ctx.beginPath();
          ctx.arc(mx, my, roadWidth / 2, 0, Math.PI * 2);
          ctx.fill();

          const dirs: [number, number][] = [
            [1, 0],
            [-1, 0],
            [0, 1],
            [0, -1],
          ];
          for (const [dx, dy] of dirs) {
            if (isRoadConnect(at(x + dx, y + dy))) {
              ctx.beginPath();
              ctx.moveTo(mx, my);
              ctx.lineTo(mx + dx * (cellSize / 2 + 2), my + dy * (cellSize / 2 + 2));
              ctx.stroke();
            }
          }
        }
      }
    };

    drawRoadLayer('rgba(96, 68, 36, 0.55)', 86);
    drawRoadLayer('#a9824f', 74);
    drawRoadLayer('#be9762', 52);

    // Subtle wheel ruts & pebbles on dirt roads
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        if (tiles[y][x] !== 'dirt_road') continue;
        const cx = x * cellSize;
        const cy = y * cellSize;
        for (let p = 0; p < 10; p++) {
          const px = cx + 22 + hash2D(x * 17 + p, y, 77) * (cellSize - 44);
          const py = cy + 22 + hash2D(x, y * 19 + p, 77) * (cellSize - 44);
          ctx.fillStyle = p % 2 === 0 ? 'rgba(92, 64, 34, 0.35)' : 'rgba(232, 206, 164, 0.28)';
          ctx.beginPath();
          ctx.arc(px, py, 2 + hash2D(p, x + y, 12) * 2.4, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    }

    // 4. River Water & Stone Bridges
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const t = tiles[y][x];
        if (t !== 'water' && t !== 'bridge') continue;
        const cx = x * cellSize;
        const cy = y * cellSize;

        // Muddy riverbank border
        ctx.fillStyle = '#736244';
        ctx.fillRect(cx - 6, cy, cellSize + 12, cellSize);

        // Deep river gradient
        const wg = ctx.createLinearGradient(cx, cy, cx + cellSize, cy);
        wg.addColorStop(0, '#2a6882');
        wg.addColorStop(0.5, '#1d546e');
        wg.addColorStop(1, '#2b6b85');
        ctx.fillStyle = wg;
        ctx.fillRect(cx + 6, cy, cellSize - 12, cellSize);

        // Water ripples
        ctx.strokeStyle = 'rgba(186, 230, 253, 0.24)';
        ctx.lineWidth = 2;
        for (let w = 0; w < 4; w++) {
          const wy = cy + 20 + w * 28;
          const wx = cx + 18 + hash2D(x, y * 7 + w, 33) * 32;
          ctx.beginPath();
          ctx.moveTo(wx, wy);
          ctx.quadraticCurveTo(wx + 22, wy - 5, wx + 44, wy);
          ctx.stroke();
        }

        if (t === 'bridge') {
          // Cast shadow on water
          ctx.fillStyle = 'rgba(8, 22, 34, 0.45)';
          ctx.fillRect(cx - 4, cy + 18, cellSize + 8, cellSize - 16);

          // Stone bridge deck
          const bg = ctx.createLinearGradient(cx, cy + 12, cx, cy + cellSize - 12);
          bg.addColorStop(0, '#c7baa2');
          bg.addColorStop(0.5, '#b2a287');
          bg.addColorStop(1, '#8c7d65');
          ctx.fillStyle = bg;
          ctx.fillRect(cx - 8, cy + 14, cellSize + 16, cellSize - 28);

          // Stone slab plank joints
          ctx.strokeStyle = 'rgba(54, 46, 36, 0.45)';
          ctx.lineWidth = 2;
          for (let sx = 0; sx <= cellSize; sx += 22) {
            ctx.beginPath();
            ctx.moveTo(cx + sx, cy + 16);
            ctx.lineTo(cx + sx, cy + cellSize - 16);
            ctx.stroke();
          }

          // Top & bottom stone parapets
          ctx.fillStyle = '#dcd2be';
          ctx.strokeStyle = '#4a4134';
          ctx.lineWidth = 2.5;
          ctx.fillRect(cx - 8, cy + 10, cellSize + 16, 14);
          ctx.strokeRect(cx - 8, cy + 10, cellSize + 16, 14);
          ctx.fillRect(cx - 8, cy + cellSize - 24, cellSize + 16, 14);
          ctx.strokeRect(cx - 8, cy + cellSize - 24, cellSize + 16, 14);
        }
      }
    }

    // 5. Cast Shadows + Detailed 2.5D Architecture, Trees, Watchtowers, Rocks
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const t = tiles[y][x];
        const cx = x * cellSize;
        const cy = y * cellSize;

        if (t === 'rock') {
          // Cast shadow
          ctx.fillStyle = 'rgba(18, 18, 14, 0.35)';
          ctx.beginPath();
          ctx.ellipse(cx + 72, cy + 88, 52, 26, 0.15, 0, Math.PI * 2);
          ctx.fill();

          // Main chiseled rock outcrop
          const rg = ctx.createLinearGradient(cx + 16, cy + 18, cx + 108, cy + 108);
          rg.addColorStop(0, '#9a9488');
          rg.addColorStop(0.55, '#6e685e');
          rg.addColorStop(1, '#433f39');
          ctx.fillStyle = rg;
          ctx.strokeStyle = '#292622';
          ctx.lineWidth = 3;
          ctx.beginPath();
          ctx.moveTo(cx + 18, cy + 92);
          ctx.lineTo(cx + 12, cy + 56);
          ctx.lineTo(cx + 42, cy + 20);
          ctx.lineTo(cx + 88, cy + 26);
          ctx.lineTo(cx + 114, cy + 68);
          ctx.lineTo(cx + 102, cy + 100);
          ctx.closePath();
          ctx.fill();
          ctx.stroke();

          // Sunlit facet
          ctx.fillStyle = 'rgba(235, 224, 198, 0.25)';
          ctx.beginPath();
          ctx.moveTo(cx + 42, cy + 20);
          ctx.lineTo(cx + 88, cy + 26);
          ctx.lineTo(cx + 68, cy + 56);
          ctx.lineTo(cx + 30, cy + 52);
          ctx.closePath();
          ctx.fill();
        }

        if (t === 'house') {
          // Ground shadow + small yard patch
          ctx.fillStyle = 'rgba(130, 108, 76, 0.48)';
          ctx.beginPath();
          ctx.roundRect(cx + 6, cy + 12, cellSize - 12, cellSize - 12, 12);
          ctx.fill();

          ctx.fillStyle = 'rgba(16, 14, 10, 0.42)';
          ctx.beginPath();
          ctx.roundRect(cx + 22, cy + 28, cellSize - 20, cellSize - 24, 8);
          ctx.fill();

          // Front earthen/brick wall
          const wallGrad = ctx.createLinearGradient(cx + 18, cy + 66, cx + 18, cy + 112);
          wallGrad.addColorStop(0, '#cdb28d');
          wallGrad.addColorStop(1, '#9b7f5d');
          ctx.fillStyle = wallGrad;
          ctx.strokeStyle = '#382a1e';
          ctx.lineWidth = 2.5;
          ctx.fillRect(cx + 18, cy + 66, cellSize - 36, 44);
          ctx.strokeRect(cx + 18, cy + 66, cellSize - 36, 44);

          // Wooden door & warm lattice windows
          ctx.fillStyle = '#5c3420';
          ctx.fillRect(cx + 54, cy + 78, 20, 32);
          ctx.strokeRect(cx + 54, cy + 78, 20, 32);

          ctx.fillStyle = '#f3d48a';
          ctx.fillRect(cx + 27, cy + 76, 18, 16);
          ctx.strokeRect(cx + 27, cy + 76, 18, 16);
          ctx.fillRect(cx + 83, cy + 76, 18, 16);
          ctx.strokeRect(cx + 83, cy + 76, 18, 16);

          // Pitched Northern Grey Tile Roof
          const roofGrad = ctx.createLinearGradient(cx + 10, cy + 14, cx + 10, cy + 72);
          roofGrad.addColorStop(0, '#5a6370');
          roofGrad.addColorStop(0.6, '#3c434d');
          roofGrad.addColorStop(1, '#262b33');
          ctx.fillStyle = roofGrad;
          ctx.strokeStyle = '#181c22';
          ctx.lineWidth = 2.5;
          ctx.beginPath();
          ctx.moveTo(cx + 8, cy + 70);
          ctx.lineTo(cx + 24, cy + 18);
          ctx.lineTo(cx + cellSize - 24, cy + 18);
          ctx.lineTo(cx + cellSize - 8, cy + 70);
          ctx.closePath();
          ctx.fill();
          ctx.stroke();

          // Roof tile ribs
          ctx.strokeStyle = 'rgba(203, 213, 225, 0.22)';
          ctx.lineWidth = 1.6;
          for (let rx = 24; rx <= cellSize - 24; rx += 11) {
            ctx.beginPath();
            ctx.moveTo(cx + rx, cy + 20);
            ctx.lineTo(cx + rx + (rx - cellSize / 2) * 0.22, cy + 68);
            ctx.stroke();
          }

          // Whitewashed ridge beam
          ctx.strokeStyle = '#e5e7eb';
          ctx.lineWidth = 4;
          ctx.beginPath();
          ctx.moveTo(cx + 22, cy + 18);
          ctx.lineTo(cx + cellSize - 22, cy + 18);
          ctx.stroke();
        }

        if (t === 'watchtower') {
          // Ground shadow + sandbags
          ctx.fillStyle = 'rgba(14, 14, 14, 0.48)';
          ctx.beginPath();
          ctx.ellipse(cx + 76, cy + 96, 52, 26, 0.1, 0, Math.PI * 2);
          ctx.fill();

          // Sandbag perimeter
          for (let sb = 0; sb < 6; sb++) {
            ctx.fillStyle = sb % 2 === 0 ? '#a8946e' : '#8d7a58';
            ctx.strokeStyle = '#3d3324';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.ellipse(cx + 24 + sb * 16, cy + 104, 11, 6, 0, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();
          }

          // Brick/stone tower body
          const twGrad = ctx.createLinearGradient(cx + 28, cy + 26, cx + 100, cy + 104);
          twGrad.addColorStop(0, '#9ca3af');
          twGrad.addColorStop(0.55, '#6b7280');
          twGrad.addColorStop(1, '#374151');
          ctx.fillStyle = twGrad;
          ctx.strokeStyle = '#1f2937';
          ctx.lineWidth = 3;
          ctx.beginPath();
          ctx.moveTo(cx + 28, cy + 102);
          ctx.lineTo(cx + 34, cy + 32);
          ctx.lineTo(cx + 94, cy + 32);
          ctx.lineTo(cx + 100, cy + 102);
          ctx.closePath();
          ctx.fill();
          ctx.stroke();

          // Turret top parapet
          ctx.fillStyle = '#4b5563';
          ctx.fillRect(cx + 24, cy + 16, 80, 20);
          ctx.strokeRect(cx + 24, cy + 16, 80, 20);

          // Gun slits
          ctx.fillStyle = '#090d16';
          ctx.fillRect(cx + 43, cy + 48, 12, 26);
          ctx.fillRect(cx + 73, cy + 48, 12, 26);
          ctx.fillRect(cx + 58, cy + 21, 12, 10);
        }

        if (t === 'forest') {
          // Lush hand-painted organic woodland cluster (no geometric spheres!)
          const trees = [
            { ox: 34, oy: 42, scale: 1.0 },
            { ox: 90, oy: 46, scale: 0.94 },
            { ox: 62, oy: 84, scale: 1.06 },
          ];
          // Ground shadows
          for (const tr of trees) {
            const jx = (hash2D(x + tr.ox, y, 51) - 0.5) * 14;
            const jy = (hash2D(x, y + tr.oy, 51) - 0.5) * 14;
            ctx.fillStyle = 'rgba(12, 22, 8, 0.36)';
            ctx.beginPath();
            ctx.ellipse(
              cx + tr.ox + jx + 12,
              cy + tr.oy + jy + 18,
              30 * tr.scale,
              18 * tr.scale,
              0.12,
              0,
              Math.PI * 2
            );
            ctx.fill();
          }

          // Bark trunks + multi-tuft painted foliage canopies
          for (let ti = 0; ti < trees.length; ti++) {
            const tr = trees[ti];
            const jx = (hash2D(x + tr.ox, y, 51) - 0.5) * 14;
            const jy = (hash2D(x, y + tr.oy, 51) - 0.5) * 14;
            const tx = cx + tr.ox + jx;
            const ty = cy + tr.oy + jy;
            const s = tr.scale;

            // Textured bark trunk & roots
            ctx.fillStyle = '#472f1c';
            ctx.beginPath();
            ctx.moveTo(tx - 6 * s, ty + 24 * s);
            ctx.lineTo(tx - 4 * s, ty + 2 * s);
            ctx.lineTo(tx + 4 * s, ty + 2 * s);
            ctx.lineTo(tx + 7 * s, ty + 24 * s);
            ctx.closePath();
            ctx.fill();

            // Outer dark foliage lobes (irregular natural crown silhouette)
            const lobes = 11;
            for (let li = 0; li < lobes; li++) {
              const ang = (li / lobes) * Math.PI * 2 + hash2D(x + ti, y + li, 63) * 0.4;
              const dist = (11 + hash2D(x * 3 + li, y + ti, 64) * 9) * s;
              const lr = (13 + hash2D(x + li, y * 5 + ti, 65) * 7) * s;
              const lx = tx + Math.cos(ang) * dist;
              const ly = ty + Math.sin(ang) * dist * 0.85;
              ctx.fillStyle = li % 2 === 0 ? '#23461a' : '#2d5721';
              ctx.beginPath();
              ctx.arc(lx, ly, lr, 0, Math.PI * 2);
              ctx.fill();
            }

            // Mid-tone leafy body tufts
            for (let mi = 0; mi < 9; mi++) {
              const ang = (mi / 9) * Math.PI * 2 + 0.3;
              const dist = (6 + hash2D(x + mi, y + ti, 68) * 9) * s;
              const mr = (11 + hash2D(mi, x + y, 69) * 5) * s;
              const mx = tx + Math.cos(ang) * dist - 2 * s;
              const my = ty + Math.sin(ang) * dist * 0.82 - 3 * s;
              ctx.fillStyle = mi % 3 === 0 ? '#4c8432' : '#3d6e28';
              ctx.beginPath();
              ctx.arc(mx, my, mr, 0, Math.PI * 2);
              ctx.fill();
            }

            // Sunlit upper-left leaf clusters
            for (let hi = 0; hi < 6; hi++) {
              const hx = tx - (4 + hash2D(hi, x, 71) * 12) * s + (hi % 2) * 8 * s;
              const hy = ty - (6 + hash2D(y, hi, 72) * 12) * s;
              const hr = (6 + hash2D(hi, ti, 73) * 5) * s;
              ctx.fillStyle = hi % 2 === 0 ? 'rgba(146, 198, 78, 0.72)' : 'rgba(182, 224, 102, 0.55)';
              ctx.beginPath();
              ctx.arc(hx, hy, hr, 0, Math.PI * 2);
              ctx.fill();
            }
          }
        }
      }
    }

    // 6. Faint Tactical Grid Guides + Warm Dusk Lighting Wash
    const sunWash = ctx.createLinearGradient(0, 0, cw, ch);
    sunWash.addColorStop(0, 'rgba(255, 224, 150, 0.08)');
    sunWash.addColorStop(1, 'rgba(15, 20, 30, 0.14)');
    ctx.fillStyle = sunWash;
    ctx.fillRect(0, 0, cw, ch);

    ctx.strokeStyle = 'rgba(255, 246, 214, 0.13)';
    ctx.lineWidth = 1.5;
    for (let x = 1; x < width; x++) {
      ctx.beginPath();
      ctx.moveTo(x * cellSize, 0);
      ctx.lineTo(x * cellSize, ch);
      ctx.stroke();
    }
    for (let y = 1; y < height; y++) {
      ctx.beginPath();
      ctx.moveTo(0, y * cellSize);
      ctx.lineTo(cw, y * cellSize);
      ctx.stroke();
    }

    // Extra subtle noise check to make sure smoothNoise is used without unused-var lint
    void smoothNoise(1, 1);
  }, [tiles, width, height]);

  return (
    <canvas
      ref={canvasRef}
      className="battlefield-bg-canvas"
      aria-hidden="true"
    />
  );
};
