import * as THREE from 'three';
import { INTERIORS } from '../data/gameData.js';
import { sx } from './scale.js';

function baseLighting(scene, color = '#e8e3ff') {
  scene.background = new THREE.Color('#241f3c');
  scene.fog = new THREE.Fog('#241f3c', 12, 40);
  const hemi = new THREE.HemisphereLight(color, '#1c1830', 0.65);
  scene.add(hemi);
  const warm = new THREE.PointLight('#ffd9a0', 0.7, 14);
  warm.position.set(0, 4, 0);
  scene.add(warm);
  return { hemi, warm };
}

function scaledBounds(bounds) {
  return { minX: sx(bounds.minX), maxX: sx(bounds.maxX), minZ: sx(bounds.minY), maxZ: sx(bounds.maxY) };
}

export function buildAcademyHallScene() {
  const scene = new THREE.Scene();
  baseLighting(scene);
  const cfg = INTERIORS.academyHall;
  const bounds = scaledBounds(cfg.bounds);

  const floorMat = new THREE.MeshStandardMaterial({ color: '#3b3660', roughness: 0.9 });
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(bounds.maxX - bounds.minX, bounds.maxZ - bounds.minZ), floorMat);
  floor.rotation.x = -Math.PI / 2;
  floor.receiveShadow = true;
  scene.add(floor);

  const pillarMat = new THREE.MeshStandardMaterial({ color: '#8f8bb8', roughness: 0.8 });
  const colliders = [];
  for (const c of cfg.colliders) {
    const cx = sx(c.x), cz = sx(c.y), cw = sx(c.w), ch = sx(c.h);
    colliders.push({ x: cx, z: cz, w: cw, h: ch });
    if (cw < ch) {
      // pillar-shaped collider -> render as a round pillar
      const pillar = new THREE.Mesh(new THREE.CylinderGeometry(Math.min(cw, ch) / 2.4, Math.min(cw, ch) / 2.4, 3.2, 12), pillarMat);
      pillar.position.set(cx, 1.6, cz);
      pillar.castShadow = true;
      scene.add(pillar);
    } else {
      const desk = new THREE.Mesh(new THREE.BoxGeometry(cw, 0.9, ch), new THREE.MeshStandardMaterial({ color: '#6a6693', roughness: 0.8 }));
      desk.position.set(cx, 0.45, cz);
      scene.add(desk);
    }
  }

  const stairsPos = { x: sx(cfg.toRoom.x), z: sx(cfg.toRoom.y) };
  const stairsGroup = new THREE.Group();
  stairsGroup.position.set(stairsPos.x, 0, stairsPos.z);
  scene.add(stairsGroup);
  for (let i = 0; i < 4; i++) {
    const step = new THREE.Mesh(new THREE.BoxGeometry(1.4 - i * 0.15, 0.18, 0.3), new THREE.MeshStandardMaterial({ color: '#4a4570' }));
    step.position.set(0, i * 0.18, -i * 0.22);
    stairsGroup.add(step);
  }

  const exitPos = { x: sx(cfg.exitToVale.x), z: sx(cfg.exitToVale.y) };
  const exitGlow = new THREE.Mesh(new THREE.PlaneGeometry(sx(cfg.exitToVale.w), 1.8), new THREE.MeshStandardMaterial({ color: '#c8beff', emissive: '#c8beff', emissiveIntensity: 0.4, transparent: true, opacity: 0.5, side: THREE.DoubleSide }));
  exitGlow.position.set(exitPos.x, 0.9, exitPos.z);
  scene.add(exitGlow);

  const interactables = [
    { id: 'exitToVale', type: 'exitToVale', x: exitPos.x, z: exitPos.z, label: 'E — Gå ut i dalen' },
    { id: 'toRoom', type: 'toRoom', x: stairsPos.x, z: stairsPos.z, label: 'E — Gå opp til rommet ditt' },
  ];

  return { scene, bounds, colliders, interactables, spawn: { x: 0, z: sx(200) } };
}

export function buildRoomScene() {
  const scene = new THREE.Scene();
  baseLighting(scene, '#f5f0ff');
  const cfg = INTERIORS.room;
  const bounds = scaledBounds(cfg.bounds);

  const floorMat = new THREE.MeshStandardMaterial({ color: '#493f68', roughness: 0.9 });
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(bounds.maxX - bounds.minX, bounds.maxZ - bounds.minZ), floorMat);
  floor.rotation.x = -Math.PI / 2;
  floor.receiveShadow = true;
  scene.add(floor);

  const rug = new THREE.Mesh(new THREE.CircleGeometry(1.6, 20), new THREE.MeshStandardMaterial({ color: '#7a6fa0', roughness: 1 }));
  rug.rotation.x = -Math.PI / 2;
  rug.position.set(sx(-60), 0.01, sx(40));
  scene.add(rug);

  const colliders = [];
  for (const c of cfg.colliders) {
    const cx = sx(c.x), cz = sx(c.y), cw = sx(c.w), ch = sx(c.h);
    colliders.push({ x: cx, z: cz, w: cw, h: ch });
  }

  // bed
  const bedC = cfg.colliders[0];
  const bed = new THREE.Group();
  bed.position.set(sx(bedC.x), 0, sx(bedC.y));
  scene.add(bed);
  const frame = new THREE.Mesh(new THREE.BoxGeometry(sx(bedC.w), 0.4, sx(bedC.h)), new THREE.MeshStandardMaterial({ color: '#7a6a9c' }));
  frame.position.y = 0.2;
  bed.add(frame);
  const blanket = new THREE.Mesh(new THREE.BoxGeometry(sx(bedC.w) * 0.95, 0.15, sx(bedC.h) * 0.6), new THREE.MeshStandardMaterial({ color: '#a89bd9' }));
  blanket.position.set(0, 0.42, sx(bedC.h) * 0.15);
  bed.add(blanket);
  const pillow = new THREE.Mesh(new THREE.BoxGeometry(sx(bedC.w) * 0.5, 0.14, sx(bedC.h) * 0.25), new THREE.MeshStandardMaterial({ color: '#eef0f7' }));
  pillow.position.set(0, 0.45, -sx(bedC.h) * 0.3);
  bed.add(pillow);

  // desk
  const deskC = cfg.colliders[1];
  const desk = new THREE.Mesh(new THREE.BoxGeometry(sx(deskC.w), 0.55, sx(deskC.h)), new THREE.MeshStandardMaterial({ color: '#5a4d78' }));
  desk.position.set(sx(deskC.x), 0.28, sx(deskC.y));
  scene.add(desk);
  const lamp = new THREE.Mesh(new THREE.ConeGeometry(0.14, 0.2, 8), new THREE.MeshStandardMaterial({ color: '#d9b45c', emissive: '#d9b45c', emissiveIntensity: 0.6 }));
  lamp.position.set(sx(deskC.x), 0.65, sx(deskC.y));
  scene.add(lamp);

  // wardrobe
  const wdC = cfg.colliders[2];
  const wardrobe = new THREE.Mesh(new THREE.BoxGeometry(sx(wdC.w), 2.2, sx(wdC.h)), new THREE.MeshStandardMaterial({ color: '#4a3f68' }));
  wardrobe.position.set(sx(wdC.x), 1.1, sx(wdC.y));
  scene.add(wardrobe);

  // chest
  const chC = cfg.colliders[3];
  const chest = new THREE.Mesh(new THREE.BoxGeometry(sx(chC.w), 0.6, sx(chC.h)), new THREE.MeshStandardMaterial({ color: '#5a4632' }));
  chest.position.set(sx(chC.x), 0.3, sx(chC.y));
  scene.add(chest);

  // mirror
  const mirC = cfg.mirror;
  const mirror = new THREE.Mesh(new THREE.CircleGeometry(sx(mirC.r) * 0.7, 20), new THREE.MeshStandardMaterial({ color: '#dfe6ff', metalness: 0.4, roughness: 0.1, emissive: '#dfe6ff', emissiveIntensity: 0.15 }));
  mirror.position.set(sx(mirC.x), 1.3, sx(mirC.y));
  scene.add(mirror);
  const mirrorFrame = new THREE.Mesh(new THREE.TorusGeometry(sx(mirC.r) * 0.72, 0.03, 8, 20), new THREE.MeshStandardMaterial({ color: '#2c2648' }));
  mirrorFrame.position.copy(mirror.position);
  scene.add(mirrorFrame);

  // window with a soft view of the vale
  const win = new THREE.Mesh(new THREE.PlaneGeometry(3, 2), new THREE.MeshStandardMaterial({ color: '#5a6ea0', emissive: '#5a6ea0', emissiveIntensity: 0.35 }));
  win.position.set(0, 1.6, bounds.minZ + 0.02);
  scene.add(win);

  const exitPos = { x: sx(cfg.exitToHall.x), z: sx(cfg.exitToHall.y) };
  const exitGlow = new THREE.Mesh(new THREE.PlaneGeometry(sx(cfg.exitToHall.w), 1.8), new THREE.MeshStandardMaterial({ color: '#c8beff', emissive: '#c8beff', emissiveIntensity: 0.4, transparent: true, opacity: 0.5, side: THREE.DoubleSide }));
  exitGlow.position.set(exitPos.x, 0.9, exitPos.z);
  scene.add(exitGlow);

  const interactables = [
    { id: 'mirror', type: 'wardrobe', x: sx(mirC.x), z: sx(mirC.y), label: 'E — Skift antrekk' },
    { id: 'wardrobe', type: 'wardrobe', x: sx(wdC.x), z: sx(wdC.y), label: 'E — Skift antrekk' },
    { id: 'desk', type: 'desk', x: sx(deskC.x), z: sx(deskC.y), label: 'E — Undersøk skrivebordet' },
    { id: 'chest', type: 'chest', x: sx(chC.x), z: sx(chC.y), label: 'E — Undersøk kisten' },
    { id: 'window', type: 'window', x: 0, z: bounds.minZ + 0.5, label: 'E — Se ut vinduet' },
    { id: 'exitToHall', type: 'exitToHall', x: exitPos.x, z: exitPos.z, label: 'E — Gå ned til akademiet' },
  ];

  return { scene, bounds, colliders, interactables, spawn: { x: 0, z: sx(170) } };
}
