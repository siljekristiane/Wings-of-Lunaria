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

// ---- Drifting clouds: cheap puff clusters that wrap around the player so
// the sky never runs out of clouds, however far the player wanders.
// Three size classes (wispy/medium/big) give the sky real variety instead
// of a dozen near-identical puffs — bigger clouds sit higher and drift
// slower, which also reads as a bit of parallax depth. ----
export function createClouds(scene, count = 22) {
  const group = new THREE.Group();
  scene.add(group);
  const cloudMat = new THREE.MeshBasicMaterial({
    color: '#eef1fb', transparent: true, opacity: 0.6, depthWrite: false, fog: false,
  });
  const puffGeo = new THREE.SphereGeometry(1, 8, 7);
  const RANGE = 560;
  const SIZE_CLASSES = [
    { weight: 0.45, puffs: [2, 4], scale: [0.9, 2.0], height: [22, 32], speed: [1.6, 3.0] }, // wispy, low, fast
    { weight: 0.35, puffs: [4, 7], scale: [2.2, 4.2], height: [30, 42], speed: [1.0, 1.9] }, // medium
    { weight: 0.2, puffs: [6, 10], scale: [4.5, 8.5], height: [40, 56], speed: [0.5, 1.1] }, // big, high, slow
  ];
  function pickClass() {
    const r = Math.random();
    let acc = 0;
    for (const c of SIZE_CLASSES) { acc += c.weight; if (r <= acc) return c; }
    return SIZE_CLASSES[0];
  }
  const lerp = (a, b, t) => a + (b - a) * t;
  const clouds = [];
  for (let i = 0; i < count; i++) {
    const cls = pickClass();
    const cloud = new THREE.Group();
    const puffCount = Math.round(lerp(cls.puffs[0], cls.puffs[1], Math.random()));
    const baseScale = lerp(cls.scale[0], cls.scale[1], Math.random());
    const spreadX = baseScale * 2.4, spreadZ = baseScale * 1.3;
    for (let p = 0; p < puffCount; p++) {
      const puff = new THREE.Mesh(puffGeo, cloudMat);
      puff.position.set((Math.random() - 0.5) * spreadX, (Math.random() - 0.5) * baseScale * 0.35, (Math.random() - 0.5) * spreadZ);
      const s = baseScale * (0.55 + Math.random() * 0.55);
      puff.scale.set(s * 1.3, s * 0.55, s);
      cloud.add(puff);
    }
    cloud.position.y = lerp(cls.height[0], cls.height[1], Math.random());
    group.add(cloud);
    clouds.push({
      cloud,
      bx: (Math.random() - 0.5) * RANGE,
      bz: (Math.random() - 0.5) * RANGE,
      speed: lerp(cls.speed[0], cls.speed[1], Math.random()),
      seed: Math.random() * 10,
    });
  }

  const wrap = (v) => ((v % RANGE) + RANGE) % RANGE - RANGE / 2;

  function update(t, camX, camZ, nightAmount) {
    for (const c of clouds) {
      c.cloud.position.x = camX + wrap(c.bx + t * c.speed * 1.4);
      c.cloud.position.z = camZ + wrap(c.bz + t * c.speed * 0.5);
      c.cloud.rotation.y = Math.sin(t * 0.05 + c.seed) * 0.1;
    }
    // dim toward a cool grey at night rather than staying bright white
    cloudMat.color.setHSL(0.68, 0.15, 0.92 - (nightAmount ?? 0) * 0.55);
  }
  return { group, cloudMat, update };
}

// ---- Rain: a self-scheduled particle spell (like the shooting stars
// above) so a few gentle showers happen per day/night cycle on their own,
// without the game loop needing to manage timing ----
export function createRain(scene, count = 500) {
  const positions = new Float32Array(count * 3);
  const speeds = new Float32Array(count);
  const RANGE = 42;
  for (let i = 0; i < count; i++) {
    positions[i * 3] = (Math.random() - 0.5) * RANGE;
    positions[i * 3 + 1] = Math.random() * 22;
    positions[i * 3 + 2] = (Math.random() - 0.5) * RANGE;
    speeds[i] = 14 + Math.random() * 6;
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  const mat = new THREE.PointsMaterial({ color: '#c7d6e8', size: 0.07, transparent: true, opacity: 0, depthWrite: false });
  const points = new THREE.Points(geo, mat);
  points.visible = false;
  scene.add(points);

  // 1-2 showers per ~40-minute day/night cycle, each lasting 2-5 minutes,
  // separated by a long dry spell — timers run in real seconds.
  let cooldown = 300 + Math.random() * 600;
  let duration = 0;
  let fade = 0;

  function update(dt, t, camX, camZ) {
    if (duration > 0) {
      duration -= dt;
      fade = Math.min(1, fade + dt * 0.3);
      if (duration <= 0) cooldown = 600 + Math.random() * 900;
    } else {
      cooldown -= dt;
      fade = Math.max(0, fade - dt * 0.3);
      if (cooldown <= 0) duration = 120 + Math.random() * 180;
    }
    const active = fade > 0.01;
    points.visible = active;
    if (active) {
      const arr = geo.attributes.position.array;
      for (let i = 0; i < count; i++) {
        arr[i * 3 + 1] -= speeds[i] * dt;
        if (arr[i * 3 + 1] < -1) {
          arr[i * 3 + 1] = 20 + Math.random() * 4;
          arr[i * 3] = (Math.random() - 0.5) * RANGE;
          arr[i * 3 + 2] = (Math.random() - 0.5) * RANGE;
        }
      }
      geo.attributes.position.needsUpdate = true;
      points.position.set(camX, 0, camZ);
      mat.opacity = fade * 0.55;
    }
    return { active, intensity: fade };
  }
  return { points, update };
}

// A soft radial-glow billboard texture (bright center fading to
// transparent) shared by the sun and moon discs — cheap to build once.
function glowDiscTexture(centerColor, midColor) {
  const canvas = document.createElement('canvas');
  canvas.width = 128; canvas.height = 128;
  const ctx = canvas.getContext('2d');
  const grad = ctx.createRadialGradient(64, 64, 0, 64, 64, 64);
  grad.addColorStop(0, centerColor);
  grad.addColorStop(0.45, midColor);
  grad.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 128, 128);
  return new THREE.CanvasTexture(canvas);
}

// A pale moon disc with a couple of soft, original abstract "seas" baked
// onto the same texture — not tracing any real lunar map, just enough
// surface variation to read as a moon rather than a flat white coin.
function moonTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 128; canvas.height = 128;
  const ctx = canvas.getContext('2d');
  const grad = ctx.createRadialGradient(64, 64, 0, 64, 64, 64);
  grad.addColorStop(0, 'rgba(238,242,255,1)');
  grad.addColorStop(0.5, 'rgba(220,228,250,0.9)');
  grad.addColorStop(1, 'rgba(220,228,250,0)');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 128, 128);
  ctx.fillStyle = 'rgba(180,190,215,0.35)';
  ctx.beginPath(); ctx.ellipse(50, 46, 16, 12, 0.4, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.ellipse(78, 74, 12, 9, -0.3, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(46, 82, 7, 0, Math.PI * 2); ctx.fill();
  return new THREE.CanvasTexture(canvas);
}

// ---- Day/night sky + sun-moon light cycle ----
export function createSky(scene, renderer) {
  scene.fog = new THREE.Fog('#3c3a68', 40, 260);
  const hemi = new THREE.HemisphereLight('#8fa6d9', '#2c4635', 0.55);
  scene.add(hemi);
  const sun = new THREE.DirectionalLight('#fff3d6', 1.1);
  scene.add(sun);
  scene.add(sun.target);

  // A dim, cool fill light from roughly opposite the sun — cheap extra
  // dimensionality (a soft rim/shadow-side lift) without a second shadow
  // map, so faces turned away from the sun aren't flat black.
  const fill = new THREE.DirectionalLight('#8fa0d9', 0.28);
  scene.add(fill);
  scene.add(fill.target);

  // Visible sun/moon discs, riding the same arc as their lights but at a
  // much larger radius so they read as distant sky objects rather than
  // nearby glowing balls. `fog: false` keeps them from washing out at
  // the scene's fairly short fog distance.
  const SKY_R = 210;
  const sunMat = new THREE.SpriteMaterial({
    map: glowDiscTexture('rgba(255,250,222,1)', 'rgba(255,225,150,0.55)'),
    transparent: true, depthWrite: false, fog: false, blending: THREE.AdditiveBlending,
  });
  const sunSprite = new THREE.Sprite(sunMat);
  sunSprite.scale.set(46, 46, 1);
  scene.add(sunSprite);

  const moonMat = new THREE.SpriteMaterial({ map: moonTexture(), transparent: true, depthWrite: false, fog: false });
  const moonSprite = new THREE.Sprite(moonMat);
  moonSprite.scale.set(30, 30, 1);
  scene.add(moonSprite);

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
    const cycle = (t % 2400) / 2400; // full day-night cycle: ~20 min daylight, ~20 min night
    const angle = cycle * Math.PI * 2;
    sun.position.set(camX + Math.cos(angle) * 80, Math.sin(angle) * 80 + 5, camZ + 40);
    sun.target.position.set(camX, 0, camZ);
    fill.position.set(camX - Math.cos(angle) * 60, 30, camZ - 40);
    fill.target.position.set(camX, 0, camZ);
    const nightAmount = Math.max(0, -Math.sin(angle));
    const dayAmount = Math.max(0, Math.sin(angle));
    sun.intensity = 0.15 + dayAmount * 1.1;
    sun.color.setHSL(0.13 - dayAmount * 0.02, 0.5, 0.6 + dayAmount * 0.25);
    hemi.intensity = 0.25 + dayAmount * 0.35;

    // Sun and moon ride the same arc, 180° apart, so one rises as the
    // other sets — a real disc you can look up and actually see, not
    // just an invisible light direction.
    sunSprite.position.set(camX + Math.cos(angle) * SKY_R, Math.sin(angle) * SKY_R + 12, camZ + 40 * (SKY_R / 80));
    sunMat.opacity = Math.max(0.15, dayAmount);
    const moonAngle = angle + Math.PI;
    moonSprite.position.set(camX + Math.cos(moonAngle) * SKY_R, Math.sin(moonAngle) * SKY_R + 12, camZ + 40 * (SKY_R / 80));
    moonMat.opacity = Math.max(0.1, nightAmount);

    let skyColor, fogColor;
    if (cycle < 0.25) { skyColor = skyColors.dawn.clone().lerp(skyColors.day, cycle / 0.25); fogColor = fogColors.dawn.clone().lerp(fogColors.day, cycle / 0.25); }
    else if (cycle < 0.5) { skyColor = skyColors.day.clone().lerp(skyColors.dusk, (cycle - 0.25) / 0.25); fogColor = fogColors.day.clone().lerp(fogColors.dusk, (cycle - 0.25) / 0.25); }
    else if (cycle < 0.75) { skyColor = skyColors.dusk.clone().lerp(skyColors.night, (cycle - 0.5) / 0.25); fogColor = fogColors.dusk.clone().lerp(fogColors.night, (cycle - 0.5) / 0.25); }
    else { skyColor = skyColors.night.clone().lerp(skyColors.dawn, (cycle - 0.75) / 0.25); fogColor = fogColors.night.clone().lerp(fogColors.dawn, (cycle - 0.75) / 0.25); }

    renderer.setClearColor(skyColor, 1);
    scene.fog.color.copy(fogColor);
    return { nightAmount, fogColor };
  }

  return { sun, hemi, sunSprite, moonSprite, update };
}
