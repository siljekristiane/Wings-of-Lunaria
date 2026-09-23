import * as THREE from 'three';
import { toonMat } from './toon.js';

// Pip — a single personal dragonfly companion, unlocked by the Whisperwood
// quest (see dialogue.js's 'rowan' branch and App.jsx's
// 'complete_dragonfly_quest'). Visually related to a discarded earlier
// idea (a whole swarm in the sky), but now just one companion that hovers
// near the avatar's shoulder, wrapped in a tiny personal halo of
// twinkling stars — "surrounded by little stars and light", just for her.
const FORWARD = new THREE.Vector3(0, 0, 1);

export function buildDragonfly(scale = 1, hue = 0.56) {
  const group = new THREE.Group();
  const bodyMat = toonMat(new THREE.Color().setHSL(hue, 0.6, 0.46), {
    emissive: new THREE.Color().setHSL(hue, 0.65, 0.22), emissiveIntensity: 0.55,
  });

  const body = new THREE.Mesh(new THREE.CapsuleGeometry(0.028, 0.16, 3, 6), bodyMat);
  body.rotation.x = Math.PI / 2;
  group.add(body);

  const head = new THREE.Mesh(new THREE.SphereGeometry(0.035, 8, 6), bodyMat);
  head.position.z = 0.11;
  group.add(head);

  const wingMat = new THREE.MeshBasicMaterial({
    color: '#eafcff', transparent: true, opacity: 0.55, side: THREE.DoubleSide,
    blending: THREE.AdditiveBlending, depthWrite: false,
  });
  const wingGeo = new THREE.PlaneGeometry(0.16, 0.05, 1, 1);
  const wings = [];
  for (const [dx, dz] of [[1, 0.02], [-1, 0.02], [1, -0.05], [-1, -0.05]]) {
    const wing = new THREE.Mesh(wingGeo, wingMat);
    wing.position.set(dx * 0.06, 0.01, dz);
    wing.rotation.y = dx > 0 ? -0.15 : 0.15;
    wing.rotation.x = -0.25;
    group.add(wing);
    wings.push(wing);
  }

  group.scale.setScalar(scale);
  return { group, wings, bodyMat, flapPhase: Math.random() * Math.PI * 2, flapSpeed: 24 + Math.random() * 6 };
}

export function starTexture() {
  const size = 32;
  const canvas = document.createElement('canvas');
  canvas.width = size; canvas.height = size;
  const ctx = canvas.getContext('2d');
  ctx.translate(size / 2, size / 2);
  const spikes = 4;
  ctx.beginPath();
  for (let i = 0; i < spikes * 2; i++) {
    const r = i % 2 === 0 ? size / 2 : size / 7;
    const a = (i / (spikes * 2)) * Math.PI * 2;
    ctx.lineTo(Math.cos(a) * r, Math.sin(a) * r);
  }
  ctx.closePath();
  const grad = ctx.createRadialGradient(0, 0, 0, 0, 0, size / 2);
  grad.addColorStop(0, '#ffffff');
  grad.addColorStop(0.5, '#dff2ff');
  grad.addColorStop(1, 'rgba(223,242,255,0)');
  ctx.fillStyle = grad;
  ctx.fill();
  const tex = new THREE.CanvasTexture(canvas);
  tex.needsUpdate = true;
  return tex;
}

const HALO_STARS = 5;

export function createPipCompanion() {
  const rig = buildDragonfly(1.7, 0.58);
  const group = rig.group;

  const starMap = starTexture();
  const starGeo = new THREE.BufferGeometry();
  const starPos = new Float32Array(HALO_STARS * 3);
  starGeo.setAttribute('position', new THREE.BufferAttribute(starPos, 3));
  const starMat = new THREE.PointsMaterial({
    map: starMap, size: 0.22, transparent: true, opacity: 0.85, sizeAttenuation: true,
    depthWrite: false, blending: THREE.AdditiveBlending, fog: false,
  });
  const stars = new THREE.Points(starGeo, starMat);
  stars.frustumCulled = false;
  group.add(stars);
  const starSeeds = Array.from({ length: HALO_STARS }, () => ({
    a: Math.random() * Math.PI * 2, r: 0.22 + Math.random() * 0.18, h: (Math.random() - 0.5) * 0.24,
    speed: 0.6 + Math.random() * 0.5, phase: Math.random() * 10,
  }));

  const glow = new THREE.PointLight('#bcd8ff', 0.5, 3, 2);
  glow.position.set(0, 0.02, 0);
  group.add(glow);

  const lastPos = new THREE.Vector3();
  let initialized = false;
  const desiredQuat = new THREE.Quaternion();
  const dir = new THREE.Vector3();

  function update(x, y, z, visible, dt, t) {
    group.visible = visible;
    if (!visible) return;

    if (!initialized) { group.position.set(x, y, z); lastPos.set(x, y, z); initialized = true; }
    else {
      dir.set(x - lastPos.x, y - lastPos.y, z - lastPos.z);
      if (dir.lengthSq() > 0.0001) {
        desiredQuat.setFromUnitVectors(FORWARD, dir.normalize());
        group.quaternion.slerp(desiredQuat, Math.min(1, dt * 6));
      }
      group.position.set(x, y, z);
      lastPos.set(x, y, z);
    }

    rig.flapPhase += dt * rig.flapSpeed;
    const flap = Math.sin(rig.flapPhase) * 0.85;
    rig.wings[0].rotation.z = flap; rig.wings[1].rotation.z = -flap;
    rig.wings[2].rotation.z = -flap * 0.9; rig.wings[3].rotation.z = flap * 0.9;

    const arr = starGeo.attributes.position.array;
    for (let i = 0; i < HALO_STARS; i++) {
      const s = starSeeds[i];
      const a = s.a + t * s.speed;
      arr[i * 3] = Math.cos(a) * s.r;
      arr[i * 3 + 1] = s.h + Math.sin(t * 1.3 + s.phase) * 0.05;
      arr[i * 3 + 2] = Math.sin(a) * s.r;
    }
    starGeo.attributes.position.needsUpdate = true;
    starMat.opacity = 0.6 + 0.3 * Math.sin(t * 2.4);
    glow.intensity = 0.4 + 0.25 * Math.sin(t * 1.9);
  }

  function dispose() {
    starMap.dispose();
    starGeo.dispose();
    starMat.dispose();
    group.traverse((o) => {
      if (o.geometry) o.geometry.dispose();
      if (o.material) o.material.dispose();
    });
  }

  return { group, update, dispose };
}
