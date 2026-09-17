import * as THREE from 'three';

// ---- Fireflies / light dust (GPU-friendly single Points draw call) ----
export function createFireflies(scene, count = 90) {
  const positions = new Float32Array(count * 3);
  const seeds = new Float32Array(count);
  const bases = [];
  for (let i = 0; i < count; i++) {
    const bx = (Math.random() - 0.5) * 260;
    const bz = (Math.random() - 0.5) * 260;
    bases.push({ bx, bz, seed: Math.random() * 10, spread: 2 + Math.random() * 3 });
    seeds[i] = Math.random() * 10;
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  const mat = new THREE.PointsMaterial({
    color: '#fff4c8', size: 0.22, transparent: true, opacity: 0.85,
    depthWrite: false, blending: THREE.AdditiveBlending, sizeAttenuation: true,
  });
  const points = new THREE.Points(geo, mat);
  scene.add(points);

  function update(t, camX, camZ) {
    const arr = geo.attributes.position.array;
    for (let i = 0; i < count; i++) {
      const b = bases[i];
      arr[i * 3] = camX + b.bx + Math.sin(t * 0.4 + b.seed) * b.spread;
      arr[i * 3 + 1] = 0.6 + Math.abs(Math.sin(t * 0.6 + b.seed * 2)) * 1.4;
      arr[i * 3 + 2] = camZ + b.bz + Math.cos(t * 0.35 + b.seed) * b.spread;
    }
    geo.attributes.position.needsUpdate = true;
    mat.opacity = 0.55 + 0.3 * Math.sin(t * 2);
  }
  return { points, update };
}

// ---- Ground fog: soft billboarded planes drifting near the ground ----
export function createGroundFog(scene, count = 10) {
  const canvas = document.createElement('canvas');
  canvas.width = 128; canvas.height = 128;
  const cctx = canvas.getContext('2d');
  const grad = cctx.createRadialGradient(64, 64, 0, 64, 64, 64);
  grad.addColorStop(0, 'rgba(220,225,255,0.55)');
  grad.addColorStop(1, 'rgba(220,225,255,0)');
  cctx.fillStyle = grad;
  cctx.fillRect(0, 0, 128, 128);
  const texture = new THREE.CanvasTexture(canvas);

  const group = new THREE.Group();
  const patches = [];
  for (let i = 0; i < count; i++) {
    const mat = new THREE.SpriteMaterial({ map: texture, transparent: true, opacity: 0.35, depthWrite: false });
    const sprite = new THREE.Sprite(mat);
    const scale = 10 + Math.random() * 8;
    sprite.scale.set(scale, scale * 0.5, 1);
    const base = { bx: (Math.random() - 0.5) * 200, bz: (Math.random() - 0.5) * 200, seed: Math.random() * 10, mat };
    patches.push(base);
    group.add(sprite);
    base.sprite = sprite;
  }
  scene.add(group);

  function update(t, camX, camZ, lightColor) {
    for (const p of patches) {
      p.sprite.position.set(
        camX + p.bx + Math.sin(t * 0.08 + p.seed) * 14,
        0.6 + Math.sin(t * 0.2 + p.seed) * 0.3,
        camZ + p.bz + Math.cos(t * 0.06 + p.seed) * 14
      );
      p.mat.opacity = 0.22 + 0.12 * Math.sin(t * 0.3 + p.seed);
      if (lightColor) p.mat.color.copy(lightColor);
    }
  }
  return { group, update };
}

// ---- Shooting stars ----
export function createShootingStars(scene) {
  const group = new THREE.Group();
  scene.add(group);
  const active = [];
  let cooldown = 4;

  function spawn(camX, camZ) {
    const mat = new THREE.MeshBasicMaterial({ color: '#fffaE6', transparent: true, opacity: 1 });
    const geo = new THREE.CylinderGeometry(0.02, 0.02, 3, 4);
    const mesh = new THREE.Mesh(geo, mat);
    const angle = Math.random() * Math.PI * 2;
    const dir = new THREE.Vector3(Math.cos(angle), -0.4, Math.sin(angle)).normalize();
    mesh.position.set(camX + (Math.random() - 0.5) * 80, 30 + Math.random() * 15, camZ + (Math.random() - 0.5) * 80);
    mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir);
    group.add(mesh);
    active.push({ mesh, dir, life: 1.6, maxLife: 1.6 });
  }

  function update(dt, t, camX, camZ) {
    cooldown -= dt;
    if (cooldown <= 0) { spawn(camX, camZ); cooldown = 7 + Math.random() * 9; }
    for (let i = active.length - 1; i >= 0; i--) {
      const s = active[i];
      s.life -= dt;
      s.mesh.position.addScaledVector(s.dir, dt * 22);
      s.mesh.material.opacity = Math.max(0, s.life / s.maxLife);
      if (s.life <= 0) {
        group.remove(s.mesh);
        s.mesh.geometry.dispose();
        s.mesh.material.dispose();
        active.splice(i, 1);
      }
    }
  }
  return { update };
}

// ---- Aurora: layered translucent curtains high in the sky ----
export function createAurora(scene) {
  const group = new THREE.Group();
  group.position.y = 40;
  scene.add(group);
  const layers = [];
  for (let i = 0; i < 3; i++) {
    const geo = new THREE.PlaneGeometry(220, 26, 24, 1);
    const mat = new THREE.MeshBasicMaterial({
      color: new THREE.Color().setHSL(0.42 + i * 0.12, 0.6, 0.6),
      transparent: true, opacity: 0.12, side: THREE.DoubleSide, depthWrite: false,
    });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(0, i * 10, -60 - i * 20);
    mesh.rotation.x = -0.15;
    group.add(mesh);
    layers.push({ mesh, mat, base: geo.attributes.position.array.slice(), offset: i });
  }

  function update(t, camX, camZ, nightAmount) {
    group.position.x = camX;
    group.position.z = camZ;
    for (const l of layers) {
      const pos = l.mesh.geometry.attributes.position;
      for (let i = 0; i < pos.count; i++) {
        const bx = l.base[i * 3], by = l.base[i * 3 + 1];
        pos.setY(i, by + Math.sin(t * 0.3 + bx * 0.04 + l.offset) * 3);
      }
      pos.needsUpdate = true;
      l.mat.color.setHSL((0.42 + l.offset * 0.12 + Math.sin(t * 0.05) * 0.05) % 1, 0.6, 0.6);
      l.mat.opacity = 0.05 + 0.12 * nightAmount;
    }
  }
  return { group, update };
}

// ---- Day/night sky + sun-moon light cycle ----
export function createSky(scene, renderer) {
  scene.fog = new THREE.Fog('#3c3a68', 40, 260);
  const hemi = new THREE.HemisphereLight('#8fa6d9', '#2c4635', 0.55);
  scene.add(hemi);
  const sun = new THREE.DirectionalLight('#fff3d6', 1.1);
  scene.add(sun);
  scene.add(sun.target);

  const skyColors = {
    day: new THREE.Color('#7fa3c9'),
    dusk: new THREE.Color('#4a4472'),
    night: new THREE.Color('#181633'),
    dawn: new THREE.Color('#6a6fa0'),
  };
  const fogColors = {
    day: new THREE.Color('#8fb3c9'),
    dusk: new THREE.Color('#4a3f6e'),
    night: new THREE.Color('#14122a'),
    dawn: new THREE.Color('#5a5a8e'),
  };

  function update(t, camX, camZ) {
    const cycle = (t % 240) / 240; // compressed day-night cycle, ~4 min
    const angle = cycle * Math.PI * 2;
    sun.position.set(camX + Math.cos(angle) * 80, Math.sin(angle) * 80 + 5, camZ + 40);
    sun.target.position.set(camX, 0, camZ);
    const nightAmount = Math.max(0, -Math.sin(angle));
    const dayAmount = Math.max(0, Math.sin(angle));
    sun.intensity = 0.15 + dayAmount * 1.1;
    sun.color.setHSL(0.13 - dayAmount * 0.02, 0.5, 0.6 + dayAmount * 0.25);
    hemi.intensity = 0.25 + dayAmount * 0.35;

    let skyColor, fogColor;
    if (cycle < 0.25) { skyColor = skyColors.dawn.clone().lerp(skyColors.day, cycle / 0.25); fogColor = fogColors.dawn.clone().lerp(fogColors.day, cycle / 0.25); }
    else if (cycle < 0.5) { skyColor = skyColors.day.clone().lerp(skyColors.dusk, (cycle - 0.25) / 0.25); fogColor = fogColors.day.clone().lerp(fogColors.dusk, (cycle - 0.25) / 0.25); }
    else if (cycle < 0.75) { skyColor = skyColors.dusk.clone().lerp(skyColors.night, (cycle - 0.5) / 0.25); fogColor = fogColors.dusk.clone().lerp(fogColors.night, (cycle - 0.5) / 0.25); }
    else { skyColor = skyColors.night.clone().lerp(skyColors.dawn, (cycle - 0.75) / 0.25); fogColor = fogColors.night.clone().lerp(fogColors.dawn, (cycle - 0.75) / 0.25); }

    renderer.setClearColor(skyColor, 1);
    scene.fog.color.copy(fogColor);
    return { nightAmount, fogColor };
  }

  return { sun, hemi, update };
}
