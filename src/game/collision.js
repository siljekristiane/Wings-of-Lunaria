import { WORLD_BOUNDS, VALE_LANDMARKS, TREES, ROCKS } from '../data/gameData.js';

export function circleRectCollide(cx, cy, r, rect) {
  const closestX = Math.max(rect.x - rect.w / 2, Math.min(cx, rect.x + rect.w / 2));
  const closestY = Math.max(rect.y - rect.h / 2, Math.min(cy, rect.y + rect.h / 2));
  const dx = cx - closestX;
  const dy = cy - closestY;
  return dx * dx + dy * dy < r * r;
}

export function resolveVale(x, y, radius, opts = {}) {
  let nx = x;
  let ny = y;

  nx = Math.max(WORLD_BOUNDS.minX + radius, Math.min(WORLD_BOUNDS.maxX - radius, nx));
  ny = Math.max(WORLD_BOUNDS.minY + radius, Math.min(WORLD_BOUNDS.maxY - radius, ny));

  // Academy building solid block (unless entering through the door zone)
  const b = VALE_LANDMARKS.academyBuilding;
  const nearDoor = Math.abs(nx - VALE_LANDMARKS.academyDoor.x) < VALE_LANDMARKS.academyDoor.w / 2 &&
    Math.abs(ny - VALE_LANDMARKS.academyDoor.y) < 30;
  if (!nearDoor && !opts.enteringAcademy) {
    const halfW = b.w / 2, halfH = b.h / 2;
    if (Math.abs(nx - b.x) < halfW + radius && Math.abs(ny - b.y) < halfH + radius) {
      // push out along shortest axis
      const dxLeft = nx - (b.x - halfW - radius);
      const dxRight = (b.x + halfW + radius) - nx;
      const dyTop = ny - (b.y - halfH - radius);
      const dyBottom = (b.y + halfH + radius) - ny;
      const min = Math.min(dxLeft, dxRight, dyTop, dyBottom);
      if (min === dxLeft) nx = b.x - halfW - radius;
      else if (min === dxRight) nx = b.x + halfW + radius;
      else if (min === dyTop) ny = b.y - halfH - radius;
      else ny = b.y + halfH + radius;
    }
  }

  // River is impassable except at the bridge
  const riverY = riverYAt(nx);
  const onBridge = Math.abs(nx - VALE_LANDMARKS.bridge.x) < VALE_LANDMARKS.bridge.w / 2;
  if (!onBridge && Math.abs(ny - riverY) < VALE_LANDMARKS.river.width / 2 + radius) {
    if (y < riverY) ny = riverY - VALE_LANDMARKS.river.width / 2 - radius;
    else ny = riverY + VALE_LANDMARKS.river.width / 2 + radius;
  }

  // Trees (only nearby ones for perf)
  for (const t of TREES) {
    if (Math.abs(t.x - nx) > 60 || Math.abs(t.y - ny) > 60) continue;
    const trunkR = 16 * t.scale;
    const dx = nx - t.x;
    const dy = ny - (t.y + 18 * t.scale);
    const dist = Math.hypot(dx, dy);
    const minDist = trunkR + radius;
    if (dist < minDist && dist > 0.001) {
      nx = t.x + (dx / dist) * minDist;
      ny = t.y + 18 * t.scale + (dy / dist) * minDist;
    }
  }
  for (const r of ROCKS) {
    if (Math.abs(r.x - nx) > 50 || Math.abs(r.y - ny) > 50) continue;
    const rockR = 14 * r.scale;
    const dx = nx - r.x;
    const dy = ny - r.y;
    const dist = Math.hypot(dx, dy);
    const minDist = rockR + radius;
    if (dist < minDist && dist > 0.001) {
      nx = r.x + (dx / dist) * minDist;
      ny = r.y + (dy / dist) * minDist;
    }
  }

  return { x: nx, y: ny };
}

export function riverYAt(x) {
  const pts = VALE_LANDMARKS.river.points;
  for (let i = 0; i < pts.length - 1; i++) {
    const [x1, y1] = pts[i];
    const [x2, y2] = pts[i + 1];
    if (x >= x1 && x <= x2) {
      const t = (x - x1) / (x2 - x1);
      return y1 + (y2 - y1) * t;
    }
  }
  return pts[pts.length - 1][1];
}
