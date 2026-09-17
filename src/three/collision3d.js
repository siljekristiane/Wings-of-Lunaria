import { VALE_LANDMARKS, TREES, ROCKS } from '../data/gameData.js';
import { sx } from './scale.js';

const ACADEMY = {
  x: sx(VALE_LANDMARKS.academyBuilding.x), z: sx(VALE_LANDMARKS.academyBuilding.y),
  w: sx(VALE_LANDMARKS.academyBuilding.w), h: sx(VALE_LANDMARKS.academyBuilding.h),
};
const DOOR = { x: sx(VALE_LANDMARKS.academyDoor.x), z: sx(VALE_LANDMARKS.academyDoor.y), w: sx(VALE_LANDMARKS.academyDoor.w) };
const BRIDGE = { x: sx(VALE_LANDMARKS.bridge.x), z: sx(VALE_LANDMARKS.bridge.y), w: sx(VALE_LANDMARKS.bridge.w) };
const RIVER_POINTS = VALE_LANDMARKS.river.points.map(([x, z]) => [sx(x), sx(z)]);
const RIVER_WIDTH = sx(VALE_LANDMARKS.river.width);
const TREES_S = TREES.map((t) => ({ x: sx(t.x), z: sx(t.y), scale: t.scale }));
const ROCKS_S = ROCKS.map((r) => ({ x: sx(r.x), z: sx(r.y), scale: r.scale }));

function riverZAt(x) {
  for (let i = 0; i < RIVER_POINTS.length - 1; i++) {
    const [x1, z1] = RIVER_POINTS[i];
    const [x2, z2] = RIVER_POINTS[i + 1];
    if (x >= x1 && x <= x2) {
      const t = (x - x1) / (x2 - x1);
      return z1 + (z2 - z1) * t;
    }
  }
  return RIVER_POINTS[RIVER_POINTS.length - 1][1];
}

// No hard world-bounds clamp here on purpose — the terrain streams forever,
// so beyond the authored vale content the player simply walks into open,
// procedurally rolling wilderness rather than hitting an invisible wall.
export function resolveValeXZ(x, z, radius) {
  let nx = x, nz = z;

  const nearDoor = Math.abs(nx - DOOR.x) < DOOR.w / 2 + 1.5 && Math.abs(nz - DOOR.z) < 2.2;
  if (!nearDoor) {
    const halfW = ACADEMY.w / 2, halfH = ACADEMY.h / 2;
    if (Math.abs(nx - ACADEMY.x) < halfW + radius && Math.abs(nz - ACADEMY.z) < halfH + radius) {
      const dxLeft = nx - (ACADEMY.x - halfW - radius);
      const dxRight = (ACADEMY.x + halfW + radius) - nx;
      const dzTop = nz - (ACADEMY.z - halfH - radius);
      const dzBottom = (ACADEMY.z + halfH + radius) - nz;
      const min = Math.min(dxLeft, dxRight, dzTop, dzBottom);
      if (min === dxLeft) nx = ACADEMY.x - halfW - radius;
      else if (min === dxRight) nx = ACADEMY.x + halfW + radius;
      else if (min === dzTop) nz = ACADEMY.z - halfH - radius;
      else nz = ACADEMY.z + halfH + radius;
    }
  }

  const riverZ = riverZAt(nx);
  const onBridge = Math.abs(nx - BRIDGE.x) < BRIDGE.w / 2;
  if (!onBridge && Math.abs(nz - riverZ) < RIVER_WIDTH / 2 + radius) {
    if (z < riverZ) nz = riverZ - RIVER_WIDTH / 2 - radius;
    else nz = riverZ + RIVER_WIDTH / 2 + radius;
  }

  for (const t of TREES_S) {
    if (Math.abs(t.x - nx) > 1.2 || Math.abs(t.z - nz) > 1.2) continue;
    const trunkR = 0.22 * t.scale;
    const dx = nx - t.x, dz = nz - t.z;
    const dist = Math.hypot(dx, dz);
    const minDist = trunkR + radius;
    if (dist < minDist && dist > 0.001) {
      nx = t.x + (dx / dist) * minDist;
      nz = t.z + (dz / dist) * minDist;
    }
  }
  for (const r of ROCKS_S) {
    if (Math.abs(r.x - nx) > 1 || Math.abs(r.z - nz) > 1) continue;
    const rockR = 0.5 * r.scale;
    const dx = nx - r.x, dz = nz - r.z;
    const dist = Math.hypot(dx, dz);
    const minDist = rockR + radius;
    if (dist < minDist && dist > 0.001) {
      nx = r.x + (dx / dist) * minDist;
      nz = r.z + (dz / dist) * minDist;
    }
  }

  return { x: nx, z: nz };
}

export function resolveRectsXZ(x, z, radius, rects, bounds) {
  let nx = Math.max(bounds.minX + radius, Math.min(bounds.maxX - radius, x));
  let nz = Math.max(bounds.minZ + radius, Math.min(bounds.maxZ - radius, z));
  for (const r of rects) {
    const halfW = r.w / 2, halfH = r.h / 2;
    if (Math.abs(nx - r.x) < halfW + radius && Math.abs(nz - r.z) < halfH + radius) {
      const dxLeft = nx - (r.x - halfW - radius);
      const dxRight = (r.x + halfW + radius) - nx;
      const dzTop = nz - (r.z - halfH - radius);
      const dzBottom = (r.z + halfH + radius) - nz;
      const min = Math.min(dxLeft, dxRight, dzTop, dzBottom);
      if (min === dxLeft) nx = r.x - halfW - radius;
      else if (min === dxRight) nx = r.x + halfW + radius;
      else if (min === dzTop) nz = r.z - halfH - radius;
      else nz = r.z + halfH + radius;
    }
  }
  return { x: nx, z: nz };
}
