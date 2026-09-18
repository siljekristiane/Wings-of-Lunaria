import * as THREE from 'three';
import { VALE_LANDMARKS } from '../data/gameData.js';
import { sx } from './scale.js';

// Real 3D grass blades (tapered, gently curved plane geometry, not flat
// sprites) instanced per terrain tile and swayed by a vertex-shader wind —
// no per-blade JS animation, so the cost is a single uniform update.
const TILE_SIZE = 40;
const RADIUS = 2; // a smaller streaming radius than the ground itself — grass only needs to cover what's actually visible up close
const GRID = RADIUS * 2 + 1;
const BLADES_PER_TILE = 260;

const ACADEMY = {
  x: sx(VALE_LANDMARKS.academyBuilding.x), z: sx(VALE_LANDMARKS.academyBuilding.y),
  hw: sx(VALE_LANDMARKS.academyBuilding.w) / 2, hh: sx(VALE_LANDMARKS.academyBuilding.h) / 2,
};
const SQUARE = { x: sx(VALE_LANDMARKS.friendshipSquare.x), z: sx(VALE_LANDMARKS.friendshipSquare.y), r: sx(VALE_LANDMARKS.friendshipSquare.r) };
const BRIDGE = { x: sx(VALE_LANDMARKS.bridge.x), z: sx(VALE_LANDMARKS.bridge.y), w: sx(VALE_LANDMARKS.bridge.w) };
const RIVER_POINTS = VALE_LANDMARKS.river.points.map(([x, z]) => [sx(x), sx(z)]);
const RIVER_WIDTH = sx(VALE_LANDMARKS.river.width);

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

// Keep blades off the water, the academy footprint, the friendship square
// clearing and the bridge deck — everywhere else grows freely.
function isClear(x, z) {
  if (Math.abs(x - ACADEMY.x) < ACADEMY.hw + 3 && Math.abs(z - ACADEMY.z) < ACADEMY.hh + 3) return false;
  if (Math.hypot(x - SQUARE.x, z - SQUARE.z) < SQUARE.r + 2) return false;
  const riverZ = riverZAt(x);
  const nearBridge = Math.abs(x - BRIDGE.x) < BRIDGE.w / 2 + 3;
  if (!nearBridge && Math.abs(z - riverZ) < RIVER_WIDTH / 2 + 2.5) return false;
  return true;
}

function buildBladeGeometry() {
  const geo = new THREE.PlaneGeometry(0.085, 1, 1, 4);
  geo.translate(0, 0.5, 0); // base at local y=0, tip at y=1
  const pos = geo.attributes.position;
  for (let i = 0; i < pos.count; i++) {
    const t = Math.max(0, pos.getY(i));
    pos.setX(i, pos.getX(i) * Math.max(0.12, 1 - t * 0.82)); // taper to a point
    pos.setZ(i, t * t * 0.1); // gentle static curve so blades aren't rigid sticks
  }
  geo.computeVertexNormals();
  return geo;
}

export function createGrassSystem(scene, heightAt) {
  const geo = buildBladeGeometry();
  const material = new THREE.MeshStandardMaterial({ color: '#4c7a49', roughness: 0.85, side: THREE.DoubleSide });
  const timeUniform = { value: 0 };
  material.onBeforeCompile = (shader) => {
    shader.uniforms.uTime = timeUniform;
    shader.vertexShader = shader.vertexShader
      .replace('#include <common>', '#include <common>\nuniform float uTime;')
      .replace(
        '#include <begin_vertex>',
        `#include <begin_vertex>
        float windPhase = uTime * 1.6 + (instanceMatrix[3].x + instanceMatrix[3].z) * 0.16;
        float bend = clamp(position.y, 0.0, 1.0);
        bend *= bend;
        transformed.x += sin(windPhase) * 0.16 * bend;
        transformed.z += cos(windPhase * 0.8) * 0.07 * bend;`
      );
  };

  // A fixed pool of instanced meshes, one per grid cell relative to the
  // player, reused for the rest of the game — tiles are re-filled in place
  // as the player crosses tile boundaries instead of creating/destroying
  // GPU buffers on every step, so exploring never leaks instance buffers.
  const pool = [];
  for (let i = 0; i < GRID * GRID; i++) {
    const mesh = new THREE.InstancedMesh(geo, material, BLADES_PER_TILE);
    mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    mesh.count = 0;
    scene.add(mesh);
    pool.push({ mesh, tx: null, tz: null });
  }

  const dummy = new THREE.Object3D();
  function fillSlot(slot, tx, tz) {
    slot.tx = tx; slot.tz = tz;
    const mesh = slot.mesh;
    mesh.position.set(tx * TILE_SIZE, 0, tz * TILE_SIZE);
    let seed = ((tx * 92821 + tz * 1301 + 7) >>> 0) || 1;
    const rand = () => {
      seed = (seed * 1664525 + 1013904223) >>> 0;
      return seed / 4294967296;
    };
    let placed = 0, attempts = 0;
    while (placed < BLADES_PER_TILE && attempts < BLADES_PER_TILE * 3) {
      attempts++;
      const lx = (rand() - 0.5) * TILE_SIZE;
      const lz = (rand() - 0.5) * TILE_SIZE;
      const wx = mesh.position.x + lx, wz = mesh.position.z + lz;
      if (!isClear(wx, wz)) continue;
      dummy.position.set(lx, heightAt(wx, wz), lz);
      dummy.rotation.set(0, rand() * Math.PI * 2, 0);
      const s = 0.6 + rand() * 0.7;
      dummy.scale.set(s, s * (0.8 + rand() * 0.5), s);
      dummy.updateMatrix();
      mesh.setMatrixAt(placed, dummy.matrix);
      mesh.setColorAt(placed, new THREE.Color().setHSL(0.32 + rand() * 0.06, 0.4 + rand() * 0.2, 0.3 + rand() * 0.12));
      placed++;
    }
    mesh.count = placed;
    mesh.instanceMatrix.needsUpdate = true;
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
  }

  function update(playerX, playerZ, t) {
    timeUniform.value = t;
    const ctx = Math.round(playerX / TILE_SIZE);
    const ctz = Math.round(playerZ / TILE_SIZE);
    for (let dx = -RADIUS; dx <= RADIUS; dx++) {
      for (let dz = -RADIUS; dz <= RADIUS; dz++) {
        const tx = ctx + dx, tz = ctz + dz;
        const slotX = ((tx % GRID) + GRID) % GRID;
        const slotZ = ((tz % GRID) + GRID) % GRID;
        const slot = pool[slotX * GRID + slotZ];
        if (slot.tx !== tx || slot.tz !== tz) fillSlot(slot, tx, tz);
      }
    }
  }

  function dispose() {
    for (const slot of pool) scene.remove(slot.mesh);
    geo.dispose();
    material.dispose();
  }

  return { update, dispose };
}
