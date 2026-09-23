import * as THREE from 'three';
import { toonMat } from './toon.js';

// A small swarm of magical dragonflies that flocks together (a light
// boids simulation: cohesion, separation, alignment, plus a pull toward
// a slowly wandering swarm center) high enough overhead that you only
// spot it now and then — mostly when actually looking up at the sky,
// same as the sun/moon/clouds. Wrapped in a loose halo of twinkling
// star sparkles and one soft point light so the whole swarm reads as
// "the light surrounded by little stars" rather than plain bugs.
const COUNT = 14;
const NEIGHBOR_R = 1.6;
const SEPARATION_R = 0.55;
const MAX_SPEED = 2.4;
const MIN_SPEED = 0.8;
const STAR_COUNT = 36;

const FORWARD = new THREE.Vector3(0, 0, 1);

function buildDragonfly(seed) {
  const group = new THREE.Group();
  const hue = 0.55 + (seed % 5) / 20; // teal through violet
  const bodyMat = toonMat(new THREE.Color().setHSL(hue, 0.55, 0.42), { emissive: new THREE.Color().setHSL(hue, 0.6, 0.18), emissiveIntensity: 0.5 });

  const body = new THREE.Mesh(new THREE.CapsuleGeometry(0.028, 0.16, 3, 6), bodyMat);
  body.rotation.x = Math.PI / 2;
  group.add(body);

  const head = new THREE.Mesh(new THREE.SphereGeometry(0.035, 8, 6), bodyMat);
  head.position.z = 0.11;
  group.add(head);

  const wingMat = new THREE.MeshBasicMaterial({
    color: '#eafcff', transparent: true, opacity: 0.5, side: THREE.DoubleSide,
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

  return { group, wings, flapPhase: Math.random() * Math.PI * 2, flapSpeed: 26 + Math.random() * 8 };
}

function starTexture() {
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

export function createDragonflySwarm(scene) {
  const group = new THREE.Group();
  scene.add(group);

  const flies = [];
  for (let i = 0; i < COUNT; i++) {
    const rig = buildDragonfly(i);
    group.add(rig.group);
    flies.push({
      ...rig,
      pos: new THREE.Vector3((Math.random() - 0.5) * 3, (Math.random() - 0.5) * 2, (Math.random() - 0.5) * 3),
      vel: new THREE.Vector3((Math.random() - 0.5), (Math.random() - 0.5) * 0.3, (Math.random() - 0.5)),
      wander: Math.random() * Math.PI * 2,
    });
  }

  const starMap = starTexture();
  const starGeo = new THREE.BufferGeometry();
  const starPos = new Float32Array(STAR_COUNT * 3);
  starGeo.setAttribute('position', new THREE.BufferAttribute(starPos, 3));
  const starMat = new THREE.PointsMaterial({
    map: starMap, size: 0.42, transparent: true, opacity: 0.8, sizeAttenuation: true,
    depthWrite: false, blending: THREE.AdditiveBlending, fog: false,
  });
  const stars = new THREE.Points(starGeo, starMat);
  stars.frustumCulled = false;
  group.add(stars);
  const starSeeds = Array.from({ length: STAR_COUNT }, () => ({
    a: Math.random() * Math.PI * 2, r: 1.6 + Math.random() * 2.6, h: (Math.random() - 0.5) * 2.2,
    speed: 0.15 + Math.random() * 0.3, phase: Math.random() * 10,
  }));

  const glow = new THREE.PointLight('#bcd8ff', 0.7, 14, 2);
  group.add(glow);

  const center = new THREE.Vector3();
  function swarmCenterAt(t, camX, camZ) {
    center.set(
      camX + Math.cos(t * 0.045) * 24 + Math.sin(t * 0.11) * 8,
      7.5 + Math.sin(t * 0.08) * 2.6,
      camZ + Math.sin(t * 0.052) * 24 + Math.cos(t * 0.09) * 8
    );
    return center;
  }

  const tmp = new THREE.Vector3();
  const coh = new THREE.Vector3();
  const sep = new THREE.Vector3();
  const align = new THREE.Vector3();

  function update(dt, t, camX, camZ) {
    const c = swarmCenterAt(t, camX, camZ);

    for (let i = 0; i < flies.length; i++) {
      const f = flies[i];
      coh.set(0, 0, 0); sep.set(0, 0, 0); align.set(0, 0, 0);
      let cohCount = 0, alignCount = 0;
      for (let j = 0; j < flies.length; j++) {
        if (i === j) continue;
        const o = flies[j];
        const d = f.pos.distanceTo(o.pos);
        if (d < NEIGHBOR_R) { coh.add(o.pos); align.add(o.vel); cohCount++; alignCount++; }
        if (d < SEPARATION_R && d > 0.0001) { tmp.copy(f.pos).sub(o.pos).multiplyScalar(1 / (d * d)); sep.add(tmp); }
      }
      const accel = new THREE.Vector3();
      if (cohCount > 0) { coh.divideScalar(cohCount).sub(f.pos).multiplyScalar(0.7); accel.add(coh); }
      if (alignCount > 0) { align.divideScalar(alignCount).sub(f.vel).multiplyScalar(0.5); accel.add(align); }
      accel.addScaledVector(sep, 1.6);
      accel.addScaledVector(tmp.copy(c).sub(f.pos), 0.5);
      f.wander += (Math.random() - 0.5) * 1.2;
      accel.x += Math.sin(f.wander) * 0.5;
      accel.y += Math.sin(f.wander * 1.3 + 1) * 0.25;
      accel.z += Math.cos(f.wander) * 0.5;

      f.vel.addScaledVector(accel, dt);
      const speed = f.vel.length();
      if (speed > MAX_SPEED) f.vel.multiplyScalar(MAX_SPEED / speed);
      else if (speed < MIN_SPEED) f.vel.multiplyScalar(MIN_SPEED / Math.max(speed, 0.001));
      f.pos.addScaledVector(f.vel, dt);

      f.group.position.copy(f.pos);
      if (speed > 0.01) {
        const dir = tmp.copy(f.vel).normalize();
        f.group.quaternion.setFromUnitVectors(FORWARD, dir);
      }
      f.flapPhase += dt * f.flapSpeed;
      const flap = Math.sin(f.flapPhase) * 0.85;
      f.wings[0].rotation.z = flap; f.wings[1].rotation.z = -flap;
      f.wings[2].rotation.z = -flap * 0.9; f.wings[3].rotation.z = flap * 0.9;
    }

    const arr = starGeo.attributes.position.array;
    for (let i = 0; i < STAR_COUNT; i++) {
      const s = starSeeds[i];
      const a = s.a + t * s.speed;
      arr[i * 3] = c.x + Math.cos(a) * s.r;
      arr[i * 3 + 1] = c.y + s.h + Math.sin(t * 0.6 + s.phase) * 0.4;
      arr[i * 3 + 2] = c.z + Math.sin(a) * s.r;
    }
    starGeo.attributes.position.needsUpdate = true;
    starMat.opacity = 0.55 + 0.35 * Math.sin(t * 2.2);

    glow.position.copy(c);
    glow.intensity = 0.5 + 0.3 * Math.sin(t * 1.7);
  }

  function dispose() {
    scene.remove(group);
    starMap.dispose();
    starGeo.dispose();
    starMat.dispose();
    for (const f of flies) {
      f.group.traverse((o) => {
        if (o.geometry) o.geometry.dispose();
        if (o.material) o.material.dispose();
      });
    }
  }

  return { update, dispose };
}
