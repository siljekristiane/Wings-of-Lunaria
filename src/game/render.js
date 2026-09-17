import { VALE_LANDMARKS, TREES, ROCKS, FLOWER_PATCHES, PATHS } from '../data/gameData.js';
import { riverYAt } from './collision.js';

const FLOWER_HUES = ['#d98fa3', '#a89bd9', '#d9b45c', '#8fb3c9', '#eef0f7', '#e8a15c'];

export function drawSky(ctx, w, h, t, scene) {
  const grad = ctx.createLinearGradient(0, 0, 0, h);
  if (scene === 'vale') {
    const auroraShift = Math.sin(t * 0.05) * 0.06;
    grad.addColorStop(0, `hsl(238, 42%, ${16 + auroraShift * 20}%)`);
    grad.addColorStop(0.45, '#3c3a68');
    grad.addColorStop(1, '#6f6a97');
  } else if (scene === 'academyHall') {
    grad.addColorStop(0, '#2c2a4a');
    grad.addColorStop(1, '#463f6e');
  } else {
    grad.addColorStop(0, '#332f52');
    grad.addColorStop(1, '#4a4670');
  }
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, w, h);
}

export function drawAurora(ctx, w, h, t) {
  ctx.save();
  ctx.globalCompositeOperation = 'screen';
  for (let i = 0; i < 3; i++) {
    const yBase = h * 0.08 + i * 18;
    const hue = 150 + i * 60 + Math.sin(t * 0.08 + i) * 20;
    const grad = ctx.createLinearGradient(0, yBase - 40, 0, yBase + 90);
    grad.addColorStop(0, `hsla(${hue},70%,70%,0)`);
    grad.addColorStop(0.5, `hsla(${hue},70%,72%,${0.10 + 0.04 * Math.sin(t * 0.3 + i)})`);
    grad.addColorStop(1, `hsla(${hue},70%,70%,0)`);
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.moveTo(0, yBase);
    for (let x = 0; x <= w; x += 40) {
      const y = yBase + Math.sin(x * 0.01 + t * 0.6 + i * 2) * 22;
      ctx.lineTo(x, y);
    }
    ctx.lineTo(w, yBase + 140);
    ctx.lineTo(0, yBase + 140);
    ctx.closePath();
    ctx.fill();
  }
  ctx.restore();
}

export function drawShootingStars(ctx, stars) {
  ctx.save();
  for (const s of stars) {
    if (s.life <= 0) continue;
    const alpha = Math.min(1, s.life / s.maxLife);
    const grad = ctx.createLinearGradient(s.x, s.y, s.x - s.vx * 6, s.y - s.vy * 6);
    grad.addColorStop(0, `rgba(255,250,230,${alpha})`);
    grad.addColorStop(1, 'rgba(255,250,230,0)');
    ctx.strokeStyle = grad;
    ctx.lineWidth = 2.4;
    ctx.beginPath();
    ctx.moveTo(s.x, s.y);
    ctx.lineTo(s.x - s.vx * 6, s.y - s.vy * 6);
    ctx.stroke();
  }
  ctx.restore();
}

export function drawGroundFog(ctx, w, h, t) {
  ctx.save();
  ctx.globalCompositeOperation = 'screen';
  for (let i = 0; i < 6; i++) {
    const px = ((Math.sin(i * 12.9 + t * 0.04) * 0.5 + 0.5) * (w + 400)) - 200;
    const py = h * 0.68 + Math.sin(i * 3.1 + t * 0.15) * 22 + i * 14;
    const r = 160 + Math.sin(t * 0.2 + i) * 30;
    const grad = ctx.createRadialGradient(px, py, 0, px, py, r);
    grad.addColorStop(0, 'rgba(220,225,255,0.16)');
    grad.addColorStop(1, 'rgba(220,225,255,0)');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(px, py, r, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

export function drawFireflies(ctx, particles, t) {
  for (const p of particles) {
    const flicker = 0.5 + 0.5 * Math.sin(t * 2 + p.seed * 10);
    ctx.beginPath();
    ctx.fillStyle = `rgba(255,244,200,${0.35 + 0.5 * flicker})`;
    ctx.arc(p.sx, p.sy, 2 + flicker * 1.5, 0, Math.PI * 2);
    ctx.fill();
  }
}

// ---- Vale ground & scenery ----

export function drawGround(ctx, w, h, camX, camY, zoom) {
  ctx.save();
  const grad = ctx.createLinearGradient(0, h * 0.32, 0, h);
  grad.addColorStop(0, '#3d5c47');
  grad.addColorStop(1, '#2c4635');
  ctx.fillStyle = grad;
  ctx.fillRect(0, h * 0.3, w, h * 0.7);

  // subtle tiling texture using seeded grid dots for ground variation
  ctx.globalAlpha = 0.12;
  const tile = 90 * zoom;
  const offX = (-camX * zoom) % tile;
  const offY = (-camY * zoom) % tile;
  ctx.fillStyle = '#1e3627';
  for (let x = offX - tile; x < w + tile; x += tile) {
    for (let y = Math.max(h * 0.3, offY - tile); y < h + tile; y += tile) {
      ctx.beginPath();
      ctx.ellipse(x, y, tile * 0.3, tile * 0.12, 0, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  ctx.globalAlpha = 1;
  ctx.restore();
}

export function drawPaths(ctx, toScreen) {
  for (const path of PATHS) {
    ctx.beginPath();
    const first = toScreen(path.left[0][0], path.left[0][1]);
    ctx.moveTo(first.x, first.y);
    for (const [x, y] of path.left) {
      const p = toScreen(x, y);
      ctx.lineTo(p.x, p.y);
    }
    for (let i = path.right.length - 1; i >= 0; i--) {
      const [x, y] = path.right[i];
      const p = toScreen(x, y);
      ctx.lineTo(p.x, p.y);
    }
    ctx.closePath();
    const grad = ctx.createLinearGradient(first.x, first.y - 40, first.x, first.y + 200);
    grad.addColorStop(0, '#8a7355');
    grad.addColorStop(1, '#6b5a42');
    ctx.fillStyle = grad;
    ctx.fill();
    ctx.strokeStyle = 'rgba(60,48,32,0.35)';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    for (const d of path.decor) {
      const p = toScreen(d.x, d.y);
      if (d.kind === 'stone') {
        ctx.fillStyle = '#8a8a90';
        ctx.beginPath();
        ctx.ellipse(p.x, p.y, 4 * d.scale, 3 * d.scale, 0, 0, Math.PI * 2);
        ctx.fill();
      } else {
        ctx.strokeStyle = 'rgba(150,190,140,0.6)';
        ctx.lineWidth = 1.6;
        ctx.beginPath();
        ctx.moveTo(p.x, p.y);
        ctx.lineTo(p.x + 3 * d.scale, p.y - 9 * d.scale);
        ctx.stroke();
      }
    }
  }
}

export function drawReed(ctx, p, prop, t) {
  const sway = Math.sin(t * 1.4 + prop.sway) * 5 * prop.scale;
  ctx.save();
  ctx.translate(p.x, p.y);
  ctx.fillStyle = 'rgba(10,20,15,0.2)';
  ctx.beginPath();
  ctx.ellipse(0, 4, 10 * prop.scale, 4 * prop.scale, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#4d7d57';
  ctx.lineWidth = 2 * prop.scale;
  for (const dx of [-4, 0, 4]) {
    ctx.beginPath();
    ctx.moveTo(dx * prop.scale, 4);
    ctx.quadraticCurveTo(dx * prop.scale + sway * 0.6, -10 * prop.scale, dx * prop.scale + sway, -22 * prop.scale);
    ctx.stroke();
  }
  ctx.restore();
}

export function drawGrassSway(ctx, toScreen, camX, camY, t, viewRadius) {
  let seed = 909;
  const rand = () => { seed = (seed * 9301 + 49297) % 233280; return seed / 233280; };
  const count = 220;
  for (let i = 0; i < count; i++) {
    const gx = camX + (rand() - 0.5) * viewRadius * 2.2;
    const gy = camY + (rand() - 0.5) * viewRadius * 1.4 + viewRadius * 0.25;
    const p = toScreen(gx, gy);
    if (p.x < -20 || p.x > p.vw + 20 || p.y < p.vh * 0.28 || p.y > p.vh + 20) continue;
    const sway = Math.sin(t * 1.6 + gx * 0.02) * 6;
    ctx.strokeStyle = 'rgba(150,190,140,0.55)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(p.x, p.y);
    ctx.quadraticCurveTo(p.x + sway * 0.5, p.y - 8, p.x + sway, p.y - 16);
    ctx.stroke();
  }
}

export function drawFlowers(ctx, toScreen) {
  for (const f of FLOWER_PATCHES) {
    const p = toScreen(f.x, f.y);
    if (p.x < -20 || p.x > p.vw + 20 || p.y < -20 || p.y > p.vh + 20) continue;
    ctx.fillStyle = FLOWER_HUES[f.hue];
    for (let k = 0; k < 3; k++) {
      ctx.beginPath();
      ctx.arc(p.x + k * 5 - 5, p.y + (k % 2) * 4, 2.6, 0, Math.PI * 2);
      ctx.fill();
    }
  }
}

export function drawTree(ctx, p, tree, t) {
  const sway = Math.sin(t * 0.8 + tree.sway) * 4 * tree.scale;
  const s = tree.scale;
  ctx.save();
  ctx.translate(p.x, p.y);
  // shadow
  ctx.fillStyle = 'rgba(10,20,15,0.28)';
  ctx.beginPath();
  ctx.ellipse(0, 4, 26 * s, 9 * s, 0, 0, Math.PI * 2);
  ctx.fill();
  // trunk
  ctx.fillStyle = '#5a4632';
  ctx.fillRect(-5 * s, -40 * s, 10 * s, 44 * s);
  // canopy (sways from top)
  ctx.translate(0, -46 * s);
  ctx.rotate(sway * 0.01);
  if (tree.kind === 'round') {
    ctx.fillStyle = '#3f6b4a';
    ctx.beginPath(); ctx.arc(-14 * s, 4 * s, 20 * s, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(14 * s, 4 * s, 20 * s, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#4d7d57';
    ctx.beginPath(); ctx.arc(0, -14 * s, 24 * s, 0, Math.PI * 2); ctx.fill();
  } else {
    ctx.fillStyle = '#3f6b4a';
    ctx.beginPath(); ctx.moveTo(-22 * s, 10 * s); ctx.lineTo(22 * s, 10 * s); ctx.lineTo(0, -40 * s); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#4d7d57';
    ctx.beginPath(); ctx.moveTo(-16 * s, -6 * s); ctx.lineTo(16 * s, -6 * s); ctx.lineTo(0, -48 * s); ctx.closePath(); ctx.fill();
  }
  ctx.restore();
}

export function drawRock(ctx, p, rock) {
  const s = rock.scale;
  ctx.save();
  ctx.translate(p.x, p.y);
  ctx.fillStyle = 'rgba(10,20,15,0.22)';
  ctx.beginPath(); ctx.ellipse(0, 6 * s, 16 * s, 5 * s, 0, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#6b7280';
  ctx.beginPath();
  ctx.moveTo(-14 * s, 4 * s); ctx.lineTo(-8 * s, -10 * s); ctx.lineTo(6 * s, -12 * s);
  ctx.lineTo(14 * s, 2 * s); ctx.lineTo(4 * s, 8 * s); ctx.closePath(); ctx.fill();
  ctx.fillStyle = '#828a96';
  ctx.beginPath();
  ctx.moveTo(-8 * s, -8 * s); ctx.lineTo(4 * s, -11 * s); ctx.lineTo(2 * s, -2 * s); ctx.closePath(); ctx.fill();
  ctx.restore();
}

export function drawRiverAndBridge(ctx, toScreen, camX, camY, t, viewRadius) {
  const pts = VALE_LANDMARKS.river.points;
  ctx.save();
  ctx.beginPath();
  const first = toScreen(pts[0][0], pts[0][1] - VALE_LANDMARKS.river.width / 2);
  ctx.moveTo(first.x, first.y);
  for (const [x, y] of pts) {
    const p = toScreen(x, y - VALE_LANDMARKS.river.width / 2);
    ctx.lineTo(p.x, p.y);
  }
  for (let i = pts.length - 1; i >= 0; i--) {
    const p = toScreen(pts[i][0], pts[i][1] + VALE_LANDMARKS.river.width / 2);
    ctx.lineTo(p.x, p.y);
  }
  ctx.closePath();
  const grad = ctx.createLinearGradient(0, 0, 0, 400);
  grad.addColorStop(0, '#3c6b8f');
  grad.addColorStop(1, '#2a4d68');
  ctx.fillStyle = grad;
  ctx.fill();

  // moving water ripples
  ctx.strokeStyle = 'rgba(220,240,255,0.28)';
  ctx.lineWidth = 2;
  for (let x = -viewRadius; x < viewRadius; x += 44) {
    const wx = camX + x;
    const wy = riverYAt(wx) + Math.sin(t * 2 + x * 0.05) * 6;
    const p1 = toScreen(wx, wy - 10);
    const p2 = toScreen(wx + 20, wy + 10);
    ctx.beginPath(); ctx.moveTo(p1.x, p1.y); ctx.lineTo(p2.x, p2.y); ctx.stroke();
  }
  ctx.restore();

  // bridge
  const br = VALE_LANDMARKS.bridge;
  const center = toScreen(br.x, br.y);
  ctx.save();
  ctx.translate(center.x, center.y);
  let seed = 55;
  const rand = () => { seed = (seed * 9301 + 49297) % 233280; return seed / 233280; };
  const plankCount = 9;
  for (let i = 0; i < plankCount; i++) {
    const py = -br.h / 2 + (i / (plankCount - 1)) * br.h;
    const jitterY = (rand() - 0.5) * 4;
    const jitterRot = (rand() - 0.5) * 0.05;
    const shade = 60 + rand() * 30;
    ctx.save();
    ctx.translate(0, py + jitterY);
    ctx.rotate(jitterRot);
    ctx.fillStyle = `rgb(${shade + 60},${shade + 30},${shade})`;
    ctx.fillRect(-br.w / 2, -6, br.w, 11);
    ctx.restore();
  }
  ctx.fillStyle = '#4a3a28';
  ctx.fillRect(-br.w / 2 - 6, -br.h / 2 - 6, 8, br.h + 12);
  ctx.fillRect(br.w / 2 - 2, -br.h / 2 - 6, 8, br.h + 12);
  ctx.restore();
}

export function drawFriendshipSquare(ctx, toScreen) {
  const sq = VALE_LANDMARKS.friendshipSquare;
  const p = toScreen(sq.x, sq.y);
  ctx.save();
  ctx.fillStyle = 'rgba(180,170,140,0.35)';
  ctx.beginPath();
  ctx.ellipse(p.x, p.y, sq.r, sq.r * 0.5, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = 'rgba(217,180,92,0.4)';
  ctx.lineWidth = 3;
  ctx.stroke();
  ctx.restore();
}

export function drawAcademy(ctx, toScreen, t) {
  const b = VALE_LANDMARKS.academyBuilding;
  const p = toScreen(b.x, b.y);
  const w = b.w, h = b.h;
  ctx.save();
  ctx.translate(p.x, p.y);
  // shadow
  ctx.fillStyle = 'rgba(10,15,25,0.3)';
  ctx.beginPath(); ctx.ellipse(0, h * 0.42, w * 0.52, 26, 0, 0, Math.PI * 2); ctx.fill();

  // main hall
  const grad = ctx.createLinearGradient(0, -h / 2, 0, h / 2);
  grad.addColorStop(0, '#8f8bb8');
  grad.addColorStop(1, '#6a6693');
  ctx.fillStyle = grad;
  ctx.fillRect(-w / 2, -h / 2, w, h);

  // side towers
  ctx.fillStyle = '#7975a3';
  ctx.fillRect(-w / 2 - 34, -h / 2 - 60, 60, h + 60);
  ctx.fillRect(w / 2 - 26, -h / 2 - 60, 60, h + 60);
  // tower roofs
  ctx.fillStyle = '#5a5688';
  ctx.beginPath(); ctx.moveTo(-w / 2 - 40, -h / 2 - 60); ctx.lineTo(-w / 2 + 32, -h / 2 - 60); ctx.lineTo(-w / 2 - 4, -h / 2 - 110); ctx.closePath(); ctx.fill();
  ctx.beginPath(); ctx.moveTo(w / 2 - 32, -h / 2 - 60); ctx.lineTo(w / 2 + 40, -h / 2 - 60); ctx.lineTo(w / 2 + 4, -h / 2 - 110); ctx.closePath(); ctx.fill();
  // spires glow
  ctx.fillStyle = `rgba(217,180,92,${0.6 + 0.3 * Math.sin(t * 1.5)})`;
  ctx.beginPath(); ctx.arc(-w / 2 - 4, -h / 2 - 116, 6, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(w / 2 + 4, -h / 2 - 116, 6, 0, Math.PI * 2); ctx.fill();

  // main roof
  ctx.fillStyle = '#524d80';
  ctx.beginPath();
  ctx.moveTo(-w / 2 - 10, -h / 2);
  ctx.lineTo(w / 2 + 10, -h / 2);
  ctx.lineTo(0, -h / 2 - 90);
  ctx.closePath();
  ctx.fill();

  // windows
  ctx.fillStyle = 'rgba(255,244,200,0.55)';
  for (let i = -1; i <= 1; i++) {
    ctx.beginPath();
    ctx.arc(i * 110, -h * 0.1, 16, 0, Math.PI * 2);
    ctx.fill();
  }

  // door
  ctx.fillStyle = '#3d3860';
  ctx.beginPath();
  ctx.moveTo(-34, h / 2);
  ctx.lineTo(-34, h * 0.14);
  ctx.quadraticCurveTo(0, h * 0.02, 34, h * 0.14);
  ctx.lineTo(34, h / 2);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = `rgba(217,180,92,${0.5 + 0.3 * Math.sin(t * 2)})`;
  ctx.beginPath(); ctx.arc(0, h * 0.3, 3, 0, Math.PI * 2); ctx.fill();

  ctx.restore();
}

export function drawPortal(ctx, p, t) {
  ctx.save();
  ctx.translate(p.x, p.y);
  ctx.fillStyle = 'rgba(10,15,25,0.25)';
  ctx.beginPath(); ctx.ellipse(0, 62, 46, 12, 0, 0, Math.PI * 2); ctx.fill();

  ctx.fillStyle = '#3a3560';
  ctx.beginPath();
  ctx.moveTo(-50, 60); ctx.lineTo(-42, -70); ctx.quadraticCurveTo(0, -100, 42, -70); ctx.lineTo(50, 60);
  ctx.closePath(); ctx.fill();

  const pulse = 0.5 + 0.5 * Math.sin(t * 1.4);
  const grad = ctx.createRadialGradient(0, -10, 4, 0, -10, 44);
  grad.addColorStop(0, `rgba(130,110,190,${0.5 + 0.2 * pulse})`);
  grad.addColorStop(1, 'rgba(40,30,70,0.9)');
  ctx.fillStyle = grad;
  ctx.beginPath(); ctx.ellipse(0, -10, 34, 56, 0, 0, Math.PI * 2); ctx.fill();

  ctx.strokeStyle = `rgba(200,190,255,${0.5 + 0.3 * pulse})`;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.ellipse(0, -10, 34, 56, 0, 0, Math.PI * 2);
  ctx.stroke();

  ctx.fillStyle = 'rgba(255,255,255,0.9)';
  ctx.font = 'bold 13px Georgia, serif';
  ctx.textAlign = 'center';
  ctx.fillText('Låst portal', 0, 82);
  ctx.restore();
}

export function drawCrystal(ctx, p, t, seedOffset = 0) {
  const pulse = 0.6 + 0.4 * Math.sin(t * 2 + seedOffset);
  ctx.save();
  ctx.translate(p.x, p.y);
  ctx.fillStyle = 'rgba(10,15,25,0.2)';
  ctx.beginPath(); ctx.ellipse(0, 10, 16, 5, 0, 0, Math.PI * 2); ctx.fill();
  const grad = ctx.createRadialGradient(0, -10, 0, 0, -10, 30);
  grad.addColorStop(0, `rgba(159,217,224,${0.5 * pulse})`);
  grad.addColorStop(1, 'rgba(159,217,224,0)');
  ctx.fillStyle = grad;
  ctx.beginPath(); ctx.arc(0, -10, 30, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#9fd9e0';
  ctx.beginPath();
  ctx.moveTo(0, -30); ctx.lineTo(10, -6); ctx.lineTo(0, 10); ctx.lineTo(-10, -6); ctx.closePath(); ctx.fill();
  ctx.fillStyle = 'rgba(255,255,255,0.6)';
  ctx.beginPath(); ctx.moveTo(0, -30); ctx.lineTo(4, -8); ctx.lineTo(0, -4); ctx.lineTo(-3, -10); ctx.closePath(); ctx.fill();
  ctx.restore();
}

export function drawLantern(ctx, p, t, seedOffset = 0) {
  const flicker = 0.7 + 0.3 * Math.sin(t * 3 + seedOffset);
  ctx.save();
  ctx.translate(p.x, p.y);
  ctx.fillStyle = '#4a3a28';
  ctx.fillRect(-3, -40, 6, 40);
  const grad = ctx.createRadialGradient(0, -48, 0, 0, -48, 26);
  grad.addColorStop(0, `rgba(255,225,150,${0.5 * flicker})`);
  grad.addColorStop(1, 'rgba(255,225,150,0)');
  ctx.fillStyle = grad;
  ctx.beginPath(); ctx.arc(0, -48, 26, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#3a2f22';
  ctx.fillRect(-8, -58, 16, 20);
  ctx.fillStyle = `rgba(255,225,150,${0.8 * flicker})`;
  ctx.fillRect(-5, -55, 10, 14);
  ctx.restore();
}

export function drawCollectibleGlow(ctx, p, t, color = '#d9b45c', seedOffset = 0) {
  const pulse = 0.6 + 0.4 * Math.sin(t * 3 + seedOffset);
  const bob = Math.sin(t * 2 + seedOffset) * 4;
  ctx.save();
  ctx.translate(p.x, p.y + bob);
  const grad = ctx.createRadialGradient(0, 0, 0, 0, 0, 22);
  grad.addColorStop(0, `${color}cc`);
  grad.addColorStop(1, `${color}00`);
  ctx.fillStyle = grad;
  ctx.beginPath(); ctx.arc(0, 0, 22 * pulse, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = color;
  ctx.beginPath();
  for (let i = 0; i < 4; i++) {
    const a = (i / 4) * Math.PI * 2 + t;
    ctx.lineTo(Math.cos(a) * 7, Math.sin(a) * 7);
  }
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

// ---- Characters ----

export function drawCharacter(ctx, p, params) {
  const { facing = 'down', walkPhase = 0, moving = false, colors, emote, emoteT = 0, scale = 1 } = params;
  const { skin, hair, top, bottom, shoes, eye, hairStyle } = colors;

  const bob = moving ? Math.sin(walkPhase) * 2 : 0;
  let armSwing = moving ? Math.sin(walkPhase) * 14 : 0;
  let legSwing = moving ? Math.sin(walkPhase) * 10 : 0;
  let raiseArms = 0;
  let bowAmount = 0;
  let jump = 0;

  if (emote === 'wave') {
    armSwing = 0;
  } else if (emote === 'cheer') {
    raiseArms = 1;
    jump = Math.abs(Math.sin(emoteT * 6)) * 10;
  } else if (emote === 'thanks') {
    bowAmount = Math.min(1, emoteT * 2) * (emoteT < 1.4 ? 1 : Math.max(0, 2 - emoteT));
  }

  ctx.save();
  ctx.translate(p.x, p.y - jump);
  ctx.scale(scale, scale);

  // shadow
  ctx.fillStyle = 'rgba(10,15,25,0.28)';
  ctx.beginPath();
  ctx.ellipse(0, 30 + jump, 16, 6, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.save();
  ctx.rotate(bowAmount * 0.35);
  ctx.translate(0, bowAmount * 6);

  // legs
  ctx.fillStyle = bottom;
  ctx.fillRect(-9, 6 + Math.max(0, legSwing) * 0.2, 7, 22 - Math.max(0, -legSwing) * 0.2);
  ctx.fillRect(2, 6 + Math.max(0, -legSwing) * 0.2, 7, 22 - Math.max(0, legSwing) * 0.2);
  ctx.fillStyle = shoes;
  ctx.fillRect(-9, 24, 7, 5);
  ctx.fillRect(2, 24, 7, 5);

  // back arm (behind torso) — only visible left/right facing
  if (facing === 'left' || facing === 'right') {
    ctx.fillStyle = top;
    ctx.beginPath();
    ctx.ellipse(facing === 'left' ? 6 : -6, 0 - armSwing * 0.3 + bob, 4, 12, 0, 0, Math.PI * 2);
    ctx.fill();
  }

  // torso
  ctx.fillStyle = top;
  ctx.beginPath();
  ctx.moveTo(-11, 8 + bob);
  ctx.quadraticCurveTo(-13, -14 + bob, -8, -18 + bob);
  ctx.lineTo(8, -18 + bob);
  ctx.quadraticCurveTo(13, -14 + bob, 11, 8 + bob);
  ctx.closePath();
  ctx.fill();

  // front arm
  ctx.fillStyle = top;
  const frontArmX = facing === 'left' ? -13 : facing === 'right' ? 13 : (emote === 'wave' ? 15 : -15 + armSwing * 0.4);
  if (emote === 'wave') {
    const waveAngle = Math.sin(emoteT * 8) * 0.5;
    ctx.save();
    ctx.translate(15, -12 + bob);
    ctx.rotate(-0.6 + waveAngle);
    ctx.fillRect(-3, 0, 6, 16);
    ctx.fillStyle = skin;
    ctx.beginPath(); ctx.arc(0, 17, 4, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
  } else if (raiseArms) {
    ctx.save();
    ctx.fillStyle = top;
    ctx.translate(-13, -14 + bob); ctx.rotate(-1.9); ctx.fillRect(-3, 0, 6, 16); ctx.restore();
    ctx.save();
    ctx.fillStyle = top;
    ctx.translate(13, -14 + bob); ctx.rotate(1.9); ctx.fillRect(-3, 0, 6, 16); ctx.restore();
    ctx.fillStyle = skin;
    ctx.beginPath(); ctx.arc(-13 - Math.sin(1.9) * 16, -14 + bob - Math.cos(1.9) * 16, 4, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(13 + Math.sin(1.9) * 16, -14 + bob - Math.cos(1.9) * 16, 4, 0, Math.PI * 2); ctx.fill();
  } else {
    ctx.save();
    ctx.translate(frontArmX * (facing === 'left' || facing === 'right' ? 0.6 : 1), -6 + bob + armSwing * 0.15);
    ctx.fillRect(-3, 0, 6, 16);
    ctx.fillStyle = skin;
    ctx.beginPath(); ctx.arc(0, 17, 4, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
  }

  // head
  ctx.translate(0, -24 + bob);
  ctx.fillStyle = skin;
  ctx.beginPath(); ctx.arc(0, 0, 10.5, 0, Math.PI * 2); ctx.fill();

  // hair back
  if (facing === 'up') {
    ctx.fillStyle = hair;
    ctx.beginPath(); ctx.arc(0, 0, 11, 0, Math.PI * 2); ctx.fill();
  } else {
    ctx.fillStyle = hair;
    ctx.beginPath(); ctx.arc(0, -3, 10.5, Math.PI, Math.PI * 2); ctx.fill();
    if (hairStyle && hairStyle.includes('Langt')) {
      ctx.fillRect(-11, -2, 5, 14);
      ctx.fillRect(6, -2, 5, 14);
    }
  }

  // face (only when not facing away)
  if (facing !== 'up') {
    const eyeOffset = facing === 'left' ? -2 : facing === 'right' ? 2 : 0;
    ctx.fillStyle = '#2a2333';
    ctx.beginPath(); ctx.arc(-3 + eyeOffset, 0, 1.4, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(3 + eyeOffset, 0, 1.4, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = eye;
    ctx.beginPath(); ctx.arc(-3 + eyeOffset, -0.2, 0.8, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(3 + eyeOffset, -0.2, 0.8, 0, Math.PI * 2); ctx.fill();
  }

  ctx.restore();
  ctx.restore();
}

export function drawCompanionCanvas(ctx, p, companion, params) {
  const { t = 0, moving = false, phase = 0 } = params;
  const bob = companion.movement === 'float'
    ? Math.sin(t * 2 + phase) * 5
    : (moving ? Math.abs(Math.sin(phase * 1.4)) * 3 : 0);

  ctx.save();
  ctx.translate(p.x, p.y - 14 + bob);

  ctx.fillStyle = 'rgba(10,15,25,0.22)';
  ctx.beginPath();
  ctx.ellipse(0, 16 - bob * 0.4, 13, 5, 0, 0, Math.PI * 2);
  ctx.fill();

  const grad = ctx.createRadialGradient(0, -2, 2, 0, -2, 22);
  grad.addColorStop(0, `${companion.glow}88`);
  grad.addColorStop(1, `${companion.glow}00`);
  ctx.fillStyle = grad;
  ctx.beginPath(); ctx.arc(0, -2, 22, 0, Math.PI * 2); ctx.fill();

  ctx.scale(0.62, 0.62);
  const c = companion.color, eye = companion.eyeColor;
  if (companion.type === 'lysrev') {
    ctx.fillStyle = c;
    ctx.beginPath(); ctx.ellipse(0, 4, 15, 11, 0, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.moveTo(-8, -10); ctx.lineTo(-14, -22); ctx.lineTo(-2, -12); ctx.closePath(); ctx.fill();
    ctx.beginPath(); ctx.moveTo(8, -10); ctx.lineTo(14, -22); ctx.lineTo(2, -12); ctx.closePath(); ctx.fill();
  } else if (companion.type === 'skykatt') {
    ctx.fillStyle = c;
    ctx.beginPath(); ctx.ellipse(0, 2, 16, 12, 0, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.moveTo(-7, -10); ctx.lineTo(-11, -20); ctx.lineTo(-1, -12); ctx.closePath(); ctx.fill();
    ctx.beginPath(); ctx.moveTo(7, -10); ctx.lineTo(11, -20); ctx.lineTo(1, -12); ctx.closePath(); ctx.fill();
  } else if (companion.type === 'maaneulv') {
    ctx.fillStyle = c;
    ctx.beginPath(); ctx.ellipse(0, 3, 16, 12, 0, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.moveTo(-8, -10); ctx.lineTo(-13, -20); ctx.lineTo(-2, -12); ctx.closePath(); ctx.fill();
    ctx.beginPath(); ctx.moveTo(8, -10); ctx.lineTo(13, -20); ctx.lineTo(2, -12); ctx.closePath(); ctx.fill();
  } else {
    ctx.fillStyle = c;
    ctx.beginPath(); ctx.ellipse(0, 2, 13, 11, 0, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.moveTo(-10, 2); ctx.lineTo(-20, -6); ctx.lineTo(-8, 6); ctx.closePath(); ctx.fill();
    ctx.beginPath(); ctx.moveTo(10, 2); ctx.lineTo(20, -6); ctx.lineTo(8, 6); ctx.closePath(); ctx.fill();
  }
  ctx.fillStyle = '#fdf7e3';
  ctx.beginPath(); ctx.ellipse(0, 8, 8, 6, 0, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = eye;
  ctx.beginPath(); ctx.arc(-4, 0, 2.6, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(4, 0, 2.6, 0, Math.PI * 2); ctx.fill();

  ctx.restore();
}

export function drawNameTag(ctx, p, name, opts = {}) {
  ctx.save();
  ctx.font = opts.font || '600 12px Georgia, serif';
  ctx.textAlign = 'center';
  const wpx = ctx.measureText(name).width;
  ctx.fillStyle = 'rgba(20,18,40,0.55)';
  ctx.beginPath();
  ctx.roundRect(p.x - wpx / 2 - 8, p.y - 12, wpx + 16, 20, 10);
  ctx.fill();
  ctx.fillStyle = '#f5f2ff';
  ctx.fillText(name, p.x, p.y + 3);
  ctx.restore();
}

export function drawInteractPrompt(ctx, p, text) {
  ctx.save();
  ctx.font = '600 14px Georgia, serif';
  ctx.textAlign = 'center';
  const tw = ctx.measureText(text).width;
  ctx.fillStyle = 'rgba(20,18,40,0.72)';
  ctx.beginPath();
  ctx.roundRect(p.x - tw / 2 - 12, p.y - 16, tw + 24, 30, 14);
  ctx.fill();
  ctx.strokeStyle = 'rgba(217,180,92,0.7)';
  ctx.lineWidth = 1.5;
  ctx.stroke();
  ctx.fillStyle = '#fff3d6';
  ctx.fillText(text, p.x, p.y + 4);
  ctx.restore();
}

export function drawAcademyHallInterior(ctx, toScreen, t) {
  const floor = ctx.createLinearGradient(0, 0, 0, 600);
  floor.addColorStop(0, '#3b3660');
  floor.addColorStop(1, '#2a2748');
  ctx.fillStyle = floor;
  ctx.fillRect(0, 0, 4000, 4000);

  // floor tiles
  ctx.strokeStyle = 'rgba(180,170,220,0.12)';
  for (let gx = -360; gx <= 360; gx += 60) {
    const p1 = toScreen(gx, -240), p2 = toScreen(gx, 240);
    ctx.beginPath(); ctx.moveTo(p1.x, p1.y); ctx.lineTo(p2.x, p2.y); ctx.stroke();
  }
  for (let gy = -240; gy <= 240; gy += 60) {
    const p1 = toScreen(-360, gy), p2 = toScreen(360, gy);
    ctx.beginPath(); ctx.moveTo(p1.x, p1.y); ctx.lineTo(p2.x, p2.y); ctx.stroke();
  }

  // pillars
  for (const px of [-150, 150]) {
    const p = toScreen(px, -40);
    ctx.save();
    ctx.translate(p.x, p.y);
    ctx.fillStyle = 'rgba(10,10,25,0.3)';
    ctx.beginPath(); ctx.ellipse(0, 62, 30, 8, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#8f8bb8';
    ctx.fillRect(-16, -60, 32, 120);
    ctx.fillStyle = '#5a5688';
    ctx.fillRect(-20, -68, 40, 12);
    ctx.restore();
  }

  // reception desk / stairs marker
  const desk = toScreen(0, -170);
  ctx.save();
  ctx.translate(desk.x, desk.y);
  ctx.fillStyle = '#6a6693';
  ctx.fillRect(-110, -18, 220, 36);
  ctx.fillStyle = `rgba(217,180,92,${0.5 + 0.3 * Math.sin(t * 1.5)})`;
  ctx.beginPath(); ctx.arc(0, -20, 5, 0, Math.PI * 2); ctx.fill();
  ctx.restore();

  const stairs = toScreen(300, -190);
  ctx.save();
  ctx.translate(stairs.x, stairs.y);
  ctx.fillStyle = '#4a4570';
  for (let i = 0; i < 4; i++) ctx.fillRect(-30 + i * 4, -12 + i * 6, 60 - i * 8, 10);
  ctx.fillStyle = '#e8e3d9';
  ctx.font = '600 11px Georgia, serif';
  ctx.textAlign = 'center';
  ctx.fillText('Til rommet ditt', 0, 30);
  ctx.restore();

  // exit door
  const exit = toScreen(0, 235);
  ctx.save();
  ctx.translate(exit.x, exit.y);
  ctx.fillStyle = '#2c2848';
  ctx.fillRect(-60, -10, 120, 20);
  ctx.fillStyle = `rgba(200,190,255,${0.4 + 0.2 * Math.sin(t * 2)})`;
  ctx.fillRect(-55, -6, 110, 12);
  ctx.restore();
}

export function drawRoomInterior(ctx, toScreen, t) {
  ctx.fillStyle = '#493f68';
  ctx.fillRect(0, 0, 4000, 4000);
  ctx.strokeStyle = 'rgba(230,220,255,0.1)';
  for (let gx = -300; gx <= 300; gx += 50) {
    const p1 = toScreen(gx, -200), p2 = toScreen(gx, 200);
    ctx.beginPath(); ctx.moveTo(p1.x, p1.y); ctx.lineTo(p2.x, p2.y); ctx.stroke();
  }

  // window/balcony with dale view
  const win = toScreen(0, -195);
  ctx.save();
  ctx.translate(win.x, win.y);
  ctx.fillStyle = '#241f3c';
  ctx.fillRect(-90, -46, 180, 70);
  const sky = ctx.createLinearGradient(0, -40, 0, 20);
  sky.addColorStop(0, '#4b4a80');
  sky.addColorStop(1, '#7a75a8');
  ctx.fillStyle = sky;
  ctx.fillRect(-82, -40, 164, 56);
  ctx.fillStyle = '#2f5c42';
  ctx.beginPath(); ctx.ellipse(-30, 12, 50, 14, 0, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.ellipse(40, 16, 60, 12, 0, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = `rgba(255,255,255,${0.6 + 0.3 * Math.sin(t)})`;
  ctx.beginPath(); ctx.arc(50, -20, 8, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = '#3a3358';
  ctx.lineWidth = 6;
  ctx.strokeRect(-90, -46, 180, 70);
  ctx.restore();

  // bed
  const bed = toScreen(-220, -130);
  ctx.save(); ctx.translate(bed.x, bed.y);
  ctx.fillStyle = 'rgba(10,10,25,0.25)';
  ctx.beginPath(); ctx.ellipse(0, 34, 70, 14, 0, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#7a6a9c';
  ctx.fillRect(-58, -32, 116, 62);
  ctx.fillStyle = '#a89bd9';
  ctx.fillRect(-58, -32, 116, 20);
  ctx.fillStyle = '#eef0f7';
  ctx.fillRect(-50, -28, 34, 14);
  ctx.restore();

  // desk
  const desk = toScreen(200, -140);
  ctx.save(); ctx.translate(desk.x, desk.y);
  ctx.fillStyle = 'rgba(10,10,25,0.2)';
  ctx.beginPath(); ctx.ellipse(0, 22, 46, 10, 0, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#5a4d78';
  ctx.fillRect(-42, -22, 84, 44);
  ctx.fillStyle = '#d9b45c';
  ctx.fillRect(-10, -34, 20, 14);
  ctx.restore();

  // mirror
  const mir = toScreen(80, -175);
  ctx.save(); ctx.translate(mir.x, mir.y);
  ctx.fillStyle = '#3a3358';
  ctx.beginPath(); ctx.ellipse(0, 0, 26, 34, 0, 0, Math.PI * 2); ctx.fill();
  const mgrad = ctx.createRadialGradient(-6, -10, 2, 0, 0, 30);
  mgrad.addColorStop(0, 'rgba(230,240,255,0.85)');
  mgrad.addColorStop(1, 'rgba(180,190,220,0.5)');
  ctx.fillStyle = mgrad;
  ctx.beginPath(); ctx.ellipse(0, 0, 20, 28, 0, 0, Math.PI * 2); ctx.fill();
  ctx.restore();

  // wardrobe
  const wd = toScreen(220, 60);
  ctx.save(); ctx.translate(wd.x, wd.y);
  ctx.fillStyle = 'rgba(10,10,25,0.22)';
  ctx.beginPath(); ctx.ellipse(0, 48, 40, 10, 0, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#4a3f68';
  ctx.fillRect(-32, -46, 64, 96);
  ctx.strokeStyle = '#2c2648';
  ctx.lineWidth = 2;
  ctx.strokeRect(-32, -46, 32, 96);
  ctx.strokeRect(0, -46, 32, 96);
  ctx.fillStyle = '#d9b45c';
  ctx.beginPath(); ctx.arc(-6, 2, 2.4, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(6, 2, 2.4, 0, Math.PI * 2); ctx.fill();
  ctx.restore();

  // chest
  const chest = toScreen(-230, 120);
  ctx.save(); ctx.translate(chest.x, chest.y);
  ctx.fillStyle = 'rgba(10,10,25,0.2)';
  ctx.beginPath(); ctx.ellipse(0, 26, 38, 9, 0, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#5a4632';
  ctx.fillRect(-34, -14, 68, 34);
  ctx.fillStyle = '#7a6242';
  ctx.beginPath(); ctx.ellipse(0, -14, 34, 12, 0, Math.PI, 0); ctx.fill();
  ctx.fillStyle = '#d9b45c';
  ctx.fillRect(-4, -6, 8, 8);
  ctx.restore();

  // small decorations: plant + rug
  const rug = toScreen(-60, 40);
  ctx.save(); ctx.translate(rug.x, rug.y);
  ctx.fillStyle = 'rgba(168,155,217,0.35)';
  ctx.beginPath(); ctx.ellipse(0, 0, 70, 30, 0, 0, Math.PI * 2); ctx.fill();
  ctx.restore();

  const plant = toScreen(-280, -40);
  ctx.save(); ctx.translate(plant.x, plant.y);
  ctx.fillStyle = '#5a4632'; ctx.fillRect(-10, 0, 20, 16);
  ctx.fillStyle = '#4d7d57';
  ctx.beginPath(); ctx.ellipse(-8, -10, 12, 18, 0.3, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.ellipse(8, -10, 12, 18, -0.3, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.ellipse(0, -20, 12, 20, 0, 0, Math.PI * 2); ctx.fill();
  ctx.restore();

  // exit door
  const exit = toScreen(-260, 180);
  ctx.save(); ctx.translate(exit.x, exit.y);
  ctx.fillStyle = '#241f3c';
  ctx.fillRect(-40, -30, 80, 55);
  ctx.fillStyle = `rgba(200,190,255,${0.4 + 0.2 * Math.sin(t * 2)})`;
  ctx.fillRect(-34, -24, 68, 44);
  ctx.restore();
}

export { TREES, ROCKS };
