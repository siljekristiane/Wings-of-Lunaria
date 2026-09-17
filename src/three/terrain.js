import * as THREE from 'three';
import { heightAt } from './noise.js';

const TILE_SIZE = 40;
const SEGMENTS = 12;
const RADIUS = 3; // 7x7 active tiles around the player = seamless "infinite" ground

export function createTerrainSystem(scene) {
  const tiles = new Map();
  const material = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.95, metalness: 0 });

  function buildTileGeometry(tx, tz) {
    const geo = new THREE.PlaneGeometry(TILE_SIZE, TILE_SIZE, SEGMENTS, SEGMENTS);
    geo.rotateX(-Math.PI / 2);
    const pos = geo.attributes.position;
    const colors = new Float32Array(pos.count * 3);
    for (let i = 0; i < pos.count; i++) {
      const lx = pos.getX(i), lz = pos.getZ(i);
      const wx = tx * TILE_SIZE + lx, wz = tz * TILE_SIZE + lz;
      const h = heightAt(wx, wz);
      pos.setY(i, h);
      const t = Math.min(1, Math.max(0, (h + 3) / 11));
      const r = 0.20 + t * 0.05;
      const g = 0.34 + t * 0.14;
      const b = 0.24 + t * 0.05;
      colors[i * 3] = r; colors[i * 3 + 1] = g; colors[i * 3 + 2] = b;
    }
    geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    geo.computeVertexNormals();
    return geo;
  }

  function update(playerX, playerZ) {
    const ctx = Math.round(playerX / TILE_SIZE);
    const ctz = Math.round(playerZ / TILE_SIZE);
    const needed = new Set();
    for (let dx = -RADIUS; dx <= RADIUS; dx++) {
      for (let dz = -RADIUS; dz <= RADIUS; dz++) {
        const tx = ctx + dx, tz = ctz + dz;
        const key = `${tx},${tz}`;
        needed.add(key);
        if (!tiles.has(key)) {
          const geo = buildTileGeometry(tx, tz);
          const mesh = new THREE.Mesh(geo, material);
          mesh.position.set(tx * TILE_SIZE, 0, tz * TILE_SIZE);
          mesh.receiveShadow = true;
          scene.add(mesh);
          tiles.set(key, mesh);
        }
      }
    }
    for (const [key, mesh] of tiles) {
      if (!needed.has(key)) {
        scene.remove(mesh);
        mesh.geometry.dispose();
        tiles.delete(key);
      }
    }
  }

  function dispose() {
    for (const mesh of tiles.values()) {
      scene.remove(mesh);
      mesh.geometry.dispose();
    }
    tiles.clear();
    material.dispose();
  }

  return { update, dispose };
}

export { heightAt };
