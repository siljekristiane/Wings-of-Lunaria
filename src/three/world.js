import * as THREE from 'three';
import {
  VALE_LANDMARKS, TREES, UNDERGROWTH, ROCKS, FLOWER_PATCHES, CRYSTALS, LANTERNS, PATHS, RIVERBANK_PROPS,
  BENCHES, SIGNS, GROUND_DETAIL, COLLECTIBLES, STAR_FRAGMENTS,
} from '../data/gameData.js';
import { sx } from './scale.js';

const PALETTE = {
  trunk: '#5a4632',
  canopyA: '#3f6b4a',
  canopyB: '#4d7d57',
  rock: '#7b828f',
  dirt: '#6b5a42',
  water: '#3c6b8f',
  wood: '#8a6f4e',
  academy: '#8f8bb8',
  academyDark: '#5a5688',
  roof: '#524d80',
};

// x/y from the 2D layout map to x/z in 3D world space, scaled by sx() so
// object sizes (built directly in meters) and layout distances agree.
export function buildWorld(scene, heightAt) {
  const crystals = [];
  const lanterns = [];
  const collectibleMeshes = new Map();
  const fragmentMeshes = new Map();
  const trees = [];

  const trunkMat = new THREE.MeshStandardMaterial({ color: PALETTE.trunk, roughness: 0.9 });
  const birchTrunkMat = new THREE.MeshStandardMaterial({ color: '#d8d2c4', roughness: 0.8 });
  const rockMat = new THREE.MeshStandardMaterial({ color: PALETTE.rock, roughness: 0.95, flatShading: true });

  // A handful of cached, hue-jittered canopy materials (not one-per-tree —
  // that would be hundreds of shader programs) so the forest reads as
  // varied greens instead of two flat repeating colors.
  const canopyMatCache = new Map();
  function canopyMat(hue, variant) {
    const bucket = Math.round(hue * 7);
    const key = `${variant}-${bucket}`;
    if (!canopyMatCache.has(key)) {
      const base = new THREE.Color(variant === 'a' ? PALETTE.canopyA : PALETTE.canopyB);
      const hsl = {};
      base.getHSL(hsl);
      const shifted = new THREE.Color().setHSL(
        Math.max(0, Math.min(1, hsl.h + (bucket / 7 - 0.5) * 0.12)),
        Math.max(0.25, hsl.s - (bucket / 7) * 0.15),
        Math.max(0.2, Math.min(0.8, hsl.l + (bucket / 7 - 0.5) * 0.18))
      );
      canopyMatCache.set(key, new THREE.MeshStandardMaterial({ color: shifted, roughness: 0.85 }));
    }
    return canopyMatCache.get(key);
  }

  // ---- Trees ----
  for (const t of TREES) {
    const wx = sx(t.x), wz = sx(t.y);
    const group = new THREE.Group();
    const h = heightAt(wx, wz);
    group.position.set(wx, h, wz);
    group.scale.setScalar(t.scale);

    const canopyMatA = canopyMat(t.hue ?? 0.5, 'a');
    const canopyMatB = canopyMat(t.hue ?? 0.5, 'b');
    const trunk = new THREE.Mesh(
      new THREE.CylinderGeometry(t.kind === 'birch' ? 0.1 : 0.16, t.kind === 'birch' ? 0.13 : 0.22, t.kind === 'birch' ? 2.1 : 1.6, 7),
      t.kind === 'birch' ? birchTrunkMat : trunkMat
    );
    trunk.position.y = t.kind === 'birch' ? 1.05 : 0.8;
    trunk.castShadow = true;
    group.add(trunk);

    const canopy = new THREE.Group();
    canopy.position.y = t.kind === 'birch' ? 2.0 : 1.7;
    if (t.kind === 'round') {
      const c1 = new THREE.Mesh(new THREE.SphereGeometry(0.85, 8, 7), canopyMatA);
      c1.position.set(-0.45, 0.1, 0); canopy.add(c1);
      const c2 = c1.clone(); c2.position.x = 0.45; canopy.add(c2);
      const c3 = new THREE.Mesh(new THREE.SphereGeometry(1.0, 9, 7), canopyMatB);
      c3.position.y = 0.55; canopy.add(c3);
    } else if (t.kind === 'birch') {
      // slender, sparser oval canopy typical of a birch
      const c1 = new THREE.Mesh(new THREE.SphereGeometry(0.55, 8, 7), canopyMatA);
      c1.scale.set(0.85, 1.3, 0.85);
      c1.position.set(-0.2, 0.2, 0); canopy.add(c1);
      const c2 = new THREE.Mesh(new THREE.SphereGeometry(0.5, 8, 7), canopyMatB);
      c2.scale.set(0.8, 1.2, 0.8);
      c2.position.set(0.22, 0.5, 0.1); canopy.add(c2);
    } else {
      const cone1 = new THREE.Mesh(new THREE.ConeGeometry(0.9, 1.7, 8), canopyMatA);
      cone1.position.y = 0.5; canopy.add(cone1);
      const cone2 = new THREE.Mesh(new THREE.ConeGeometry(0.65, 1.4, 8), canopyMatB);
      cone2.position.y = 1.15; canopy.add(cone2);
    }
    canopy.children.forEach((m) => { m.castShadow = true; });
    group.add(canopy);
    scene.add(group);
    trees.push({ group, canopy, sway: t.sway });
  }

  // ---- Rocks ----
  for (const r of ROCKS) {
    const wx = sx(r.x), wz = sx(r.y);
    const h = heightAt(wx, wz);
    const mesh = new THREE.Mesh(new THREE.IcosahedronGeometry(0.5 * r.scale, 0), rockMat);
    mesh.position.set(wx, h + 0.2 * r.scale, wz);
    mesh.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, 0);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    scene.add(mesh);
  }

  // ---- Riverbank rocks & reeds ----
  const reedMat = new THREE.MeshStandardMaterial({ color: '#4d7d57', roughness: 0.8 });
  for (const rp of RIVERBANK_PROPS) {
    const wx = sx(rp.x), wz = sx(rp.y);
    const h = heightAt(wx, wz);
    if (rp.kind === 'rock') {
      const mesh = new THREE.Mesh(new THREE.IcosahedronGeometry(0.32 * rp.scale, 0), rockMat);
      mesh.position.set(wx, h + 0.14 * rp.scale, wz);
      mesh.rotation.set(Math.random(), Math.random(), 0);
      scene.add(mesh);
    } else {
      const group = new THREE.Group();
      group.position.set(wx, h, wz);
      for (const dx of [-0.05, 0, 0.05]) {
        const blade = new THREE.Mesh(new THREE.CylinderGeometry(0.008, 0.016, 0.4 * rp.scale, 4), reedMat);
        blade.position.set(dx, 0.2 * rp.scale, 0);
        group.add(blade);
      }
      scene.add(group);
    }
  }

  // ---- Benches ----
  // A small cached set of wood-tone variants (not one material per bench)
  // so the handful of benches don't all look like identical clones.
  const benchMatCache = new Map();
  function benchMat(variant) {
    if (!benchMatCache.has(variant)) {
      const base = new THREE.Color('#6b5138');
      const hsl = {}; base.getHSL(hsl);
      const shifted = new THREE.Color().setHSL(hsl.h, hsl.s, Math.max(0.2, Math.min(0.5, hsl.l + (variant - 1) * 0.06)));
      benchMatCache.set(variant, new THREE.MeshStandardMaterial({ color: shifted, roughness: 0.85 + variant * 0.03 }));
    }
    return benchMatCache.get(variant);
  }
  BENCHES.forEach((b, i) => {
    const wx = sx(b.x), wz = sx(b.y);
    const h = heightAt(wx, wz);
    const mat = benchMat(i % 3);
    const scale = 0.92 + (i % 4) * 0.05;
    const group = new THREE.Group();
    group.position.set(wx, h, wz);
    group.rotation.y = b.rot;
    group.scale.setScalar(scale);
    const seat = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.05, 0.32), mat);
    seat.position.y = 0.26;
    group.add(seat);
    const back = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.28, 0.04), mat);
    back.position.set(0, 0.42, -0.15);
    group.add(back);
    for (const lx of [-0.38, 0.38]) {
      const leg = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.26, 0.28), mat);
      leg.position.set(lx, 0.13, 0);
      group.add(leg);
    }
    group.children.forEach((m) => { m.castShadow = true; });
    scene.add(group);
  });

  // ---- Signposts ----
  // Small wooden signposts with original short lore text (shown via the
  // existing "examine" interaction, not written on the mesh itself) —
  // one for each hand-placed entry in SIGNS, plus a visual post for the
  // pre-existing logical Whisperwood path marker so it finally has a
  // physical presence in the world.
  const signPostMat = new THREE.MeshStandardMaterial({ color: '#5a4632', roughness: 0.9 });
  const signBoardMat = new THREE.MeshStandardMaterial({ color: '#8a6f4e', roughness: 0.85 });
  function buildSignpost(wx, wz, rot) {
    const h = heightAt(wx, wz);
    const group = new THREE.Group();
    group.position.set(wx, h, wz);
    group.rotation.y = rot;
    const post = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.045, 0.85, 6), signPostMat);
    post.position.y = 0.42;
    group.add(post);
    const board = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.3, 0.04), signBoardMat);
    board.position.set(0, 0.78, 0.02);
    group.add(board);
    group.children.forEach((m) => { m.castShadow = true; });
    scene.add(group);
  }
  for (const s of SIGNS) buildSignpost(sx(s.x), sx(s.y), s.rot);
  buildSignpost(sx(VALE_LANDMARKS.whisperwoodPath.x), sx(VALE_LANDMARKS.whisperwoodPath.y), 0.6);

  // ---- Ground detail (stumps, moss, roots, fallen branches, leaf piles) ----
  const stumpMat = new THREE.MeshStandardMaterial({ color: '#6b5340', roughness: 0.95 });
  const mossMat = new THREE.MeshStandardMaterial({ color: '#4d7a4f', roughness: 0.9 });
  const leafMat = new THREE.MeshStandardMaterial({ color: '#8a6a3a', roughness: 0.9 });
  for (const g of GROUND_DETAIL) {
    const wx = sx(g.x), wz = sx(g.y);
    const h = heightAt(wx, wz);
    if (g.kind === 'stump') {
      const stump = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.26, 0.28, 8), stumpMat);
      stump.position.set(wx, h + 0.14 * g.scale, wz);
      stump.scale.setScalar(g.scale);
      stump.rotation.y = g.rot;
      scene.add(stump);
    } else if (g.kind === 'moss' || g.kind === 'leafpile') {
      const patch = new THREE.Mesh(new THREE.CircleGeometry(0.4, 8), g.kind === 'moss' ? mossMat : leafMat);
      patch.position.set(wx, h + 0.01, wz);
      patch.rotation.x = -Math.PI / 2;
      patch.scale.setScalar(g.scale);
      scene.add(patch);
    } else {
      // root or fallen branch: a low, slightly tapered log lying on the ground
      const log = new THREE.Mesh(new THREE.CapsuleGeometry(0.05, 0.6, 2, 5), g.kind === 'root' ? stumpMat : leafMat);
      log.position.set(wx, h + 0.06 * g.scale, wz);
      log.rotation.set(Math.PI / 2, g.rot, 0.15);
      log.scale.setScalar(g.scale);
      scene.add(log);
    }
  }

  // ---- Flowers ----
  const flowerHues = ['#d98fa3', '#a89bd9', '#d9b45c', '#8fb3c9', '#eef0f7', '#e8a15c'];
  const flowerGeo = new THREE.SphereGeometry(0.05, 6, 5);
  for (const f of FLOWER_PATCHES) {
    const wx = sx(f.x), wz = sx(f.y);
    const h = heightAt(wx, wz);
    const mat = new THREE.MeshStandardMaterial({ color: flowerHues[f.hue], roughness: 0.6 });
    for (let k = 0; k < 3; k++) {
      const bloom = new THREE.Mesh(flowerGeo, mat);
      bloom.position.set(wx + k * 0.08 - 0.08, h + 0.12, wz + (k % 2) * 0.07);
      scene.add(bloom);
    }
  }

  // ---- Undergrowth (bushes & ferns) ----
  // Forest-floor clutter clustered near the trees generated above — cheap
  // low-poly shapes shared across two materials, no per-object lights.
  const bushMat = new THREE.MeshStandardMaterial({ color: '#3d6b46', roughness: 0.9 });
  const fernMat = new THREE.MeshStandardMaterial({ color: '#4f8a54', roughness: 0.85, side: THREE.DoubleSide });
  const bushGeo = new THREE.SphereGeometry(0.3, 6, 5);
  const fernGeo = new THREE.ConeGeometry(0.12, 0.5, 4);
  for (const u of UNDERGROWTH) {
    const wx = sx(u.x), wz = sx(u.y);
    const h = heightAt(wx, wz);
    if (u.kind === 'bush') {
      const group = new THREE.Group();
      group.position.set(wx, h, wz);
      group.scale.setScalar(u.scale);
      for (const [dx, dz, s] of [[0, 0, 1], [0.16, 0.05, 0.7], [-0.15, 0.03, 0.75]]) {
        const lobe = new THREE.Mesh(bushGeo, bushMat);
        lobe.position.set(dx, 0.22 * s, dz);
        lobe.scale.setScalar(s);
        group.add(lobe);
      }
      scene.add(group);
    } else {
      const group = new THREE.Group();
      group.position.set(wx, h, wz);
      group.scale.setScalar(u.scale);
      group.rotation.y = u.rot;
      for (let k = 0; k < 4; k++) {
        const blade = new THREE.Mesh(fernGeo, fernMat);
        const a = (k / 4) * Math.PI * 2;
        blade.position.set(Math.cos(a) * 0.06, 0.25, Math.sin(a) * 0.06);
        blade.rotation.set(0.3, a, 0.15);
        group.add(blade);
      }
      scene.add(group);
    }
  }

  // ---- Crystals ----
  // Glow is emissive-material only (no per-object dynamic lights) — with a
  // few dozen of these scattered around, real point lights would tank frame
  // rate on mobile for a barely-visible gain over a bright emissive surface.
  for (const c of CRYSTALS) {
    const wx = sx(c.x), wz = sx(c.y);
    const h = heightAt(wx, wz);
    const mat = new THREE.MeshStandardMaterial({ color: '#9fd9e0', emissive: '#9fd9e0', emissiveIntensity: 0.5, transparent: true, opacity: 0.85, roughness: 0.2 });
    const mesh = new THREE.Mesh(new THREE.OctahedronGeometry(0.35, 0), mat);
    mesh.position.set(wx, h + 0.5, wz);
    scene.add(mesh);
    crystals.push({ mesh, seed: wx });
  }

  // ---- Lanterns ----
  for (const l of LANTERNS) {
    const wx = sx(l.x), wz = sx(l.y);
    const h = heightAt(wx, wz);
    const post = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.05, 1.4, 6), trunkMat);
    post.position.set(wx, h + 0.7, wz);
    scene.add(post);
    const bulbMat = new THREE.MeshStandardMaterial({ color: '#ffe1a0', emissive: '#ffcf7a', emissiveIntensity: 0.9 });
    const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.12, 8, 8), bulbMat);
    bulb.position.set(wx, h + 1.5, wz);
    scene.add(bulb);
    lanterns.push({ mat: bulbMat, seed: wx });
  }

  // ---- Paths (dirt ribbons following terrain height) ----
  for (const path of PATHS) {
    const verts = [];
    const n = path.left.length;
    for (let i = 0; i < n; i++) {
      const lx = sx(path.left[i][0]), lz = sx(path.left[i][1]);
      const rx = sx(path.right[i][0]), rz = sx(path.right[i][1]);
      verts.push(lx, heightAt(lx, lz) + 0.03, lz);
      verts.push(rx, heightAt(rx, rz) + 0.03, rz);
    }
    const indices = [];
    for (let i = 0; i < n - 1; i++) {
      const a = i * 2, b = i * 2 + 1, c = i * 2 + 2, d = i * 2 + 3;
      indices.push(a, c, b, b, c, d);
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(verts, 3));
    geo.setIndex(indices);
    geo.computeVertexNormals();
    const mat = new THREE.MeshStandardMaterial({ color: PALETTE.dirt, roughness: 1 });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.receiveShadow = true;
    scene.add(mesh);
  }

  // ---- River + bridge ----
  const riverPts = VALE_LANDMARKS.river.points;
  const riverWidth = sx(VALE_LANDMARKS.river.width);
  const denseRiver = [];
  const stepsPerSeg = 10;
  for (let i = 0; i < riverPts.length - 1; i++) {
    const [x1, z1] = riverPts[i], [x2, z2] = riverPts[i + 1];
    for (let s = 0; s < stepsPerSeg; s++) {
      const tt = s / stepsPerSeg;
      denseRiver.push([sx(x1 + (x2 - x1) * tt), sx(z1 + (z2 - z1) * tt)]);
    }
  }
  denseRiver.push([sx(riverPts[riverPts.length - 1][0]), sx(riverPts[riverPts.length - 1][1])]);
  // Three columns per cross-section (shallow bank / deep center / shallow
  // bank) instead of two, so the water can carry a real lighter-at-the-
  // edges, darker-in-the-middle depth gradient via vertex colors rather
  // than one flat fill color.
  const riverVerts = [];
  const riverColors = [];
  const riverIdx = [];
  const shallow = new THREE.Color('#7fc9d6');
  const deep = new THREE.Color('#1c4a63');
  for (let vi = 0; vi < denseRiver.length; vi++) {
    const [x, z] = denseRiver[vi];
    riverVerts.push(
      x, -0.12, z - riverWidth / 2,
      x, -0.2, z,
      x, -0.12, z + riverWidth / 2
    );
    riverColors.push(shallow.r, shallow.g, shallow.b, deep.r, deep.g, deep.b, shallow.r, shallow.g, shallow.b);
    if (vi < denseRiver.length - 1) {
      const a = vi * 3, b = vi * 3 + 1, c = vi * 3 + 3, d = vi * 3 + 4;
      riverIdx.push(a, c, b, b, c, d);
      const e = vi * 3 + 1, f = vi * 3 + 2, g = vi * 3 + 4, h = vi * 3 + 5;
      riverIdx.push(e, g, f, f, g, h);
    }
  }
  const riverGeo = new THREE.BufferGeometry();
  riverGeo.setAttribute('position', new THREE.Float32BufferAttribute(riverVerts, 3));
  riverGeo.setAttribute('color', new THREE.Float32BufferAttribute(riverColors, 3));
  riverGeo.setIndex(riverIdx);
  riverGeo.computeVertexNormals();
  const riverMat = new THREE.MeshStandardMaterial({
    color: '#ffffff', vertexColors: true, roughness: 0.18, metalness: 0.25, transparent: true, opacity: 0.9,
  });
  const riverMesh = new THREE.Mesh(riverGeo, riverMat);
  scene.add(riverMesh);
  const riverBasePositions = riverGeo.attributes.position.array.slice();

  // Foam: a thin, soft-edged strip that follows the river's own curve on
  // each bank (built from the same dense polyline as the water itself,
  // not a straight plane, so it hugs the actual bend of the river).
  const foamCanvas = document.createElement('canvas');
  foamCanvas.width = 64; foamCanvas.height = 16;
  const fctx = foamCanvas.getContext('2d');
  const fgrad = fctx.createLinearGradient(0, 0, 0, 16);
  fgrad.addColorStop(0, 'rgba(255,255,255,0)');
  fgrad.addColorStop(0.5, 'rgba(255,255,255,0.7)');
  fgrad.addColorStop(1, 'rgba(255,255,255,0)');
  fctx.fillStyle = fgrad;
  fctx.fillRect(0, 0, 64, 16);
  const foamTex = new THREE.CanvasTexture(foamCanvas);
  foamTex.wrapS = THREE.RepeatWrapping;
  foamTex.wrapT = THREE.RepeatWrapping;
  const foamMat = new THREE.MeshBasicMaterial({ map: foamTex, transparent: true, opacity: 0.55, depthWrite: false, side: THREE.DoubleSide });
  function buildFoamStrip(edgeSign) {
    const verts = [];
    const uvs = [];
    const idx = [];
    let travelled = 0;
    for (let vi = 0; vi < denseRiver.length; vi++) {
      const [x, z] = denseRiver[vi];
      const bankZ = z + edgeSign * riverWidth / 2;
      verts.push(x, -0.06, bankZ - 0.2, x, -0.06, bankZ + 0.2);
      if (vi > 0) {
        const [px, pz] = denseRiver[vi - 1];
        travelled += Math.hypot(x - px, z - pz);
      }
      const v = travelled / 1.2;
      uvs.push(0, v, 1, v);
      if (vi < denseRiver.length - 1) {
        const a = vi * 2, b = vi * 2 + 1, c = vi * 2 + 2, d = vi * 2 + 3;
        idx.push(a, c, b, b, c, d);
      }
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(verts, 3));
    geo.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
    geo.setIndex(idx);
    return new THREE.Mesh(geo, foamMat);
  }
  const foamL = buildFoamStrip(-1);
  const foamR = buildFoamStrip(1);
  scene.add(foamL, foamR);

  // bridge
  const br = VALE_LANDMARKS.bridge;
  const brX = sx(br.x), brZ = sx(br.y);
  const bridgeGroup = new THREE.Group();
  const brH = heightAt(brX, brZ);
  bridgeGroup.position.set(brX, brH + 0.35, brZ);
  scene.add(bridgeGroup);
  const plankMat = new THREE.MeshStandardMaterial({ color: PALETTE.wood, roughness: 0.85 });
  let plankSeed = 55;
  const prand = () => { plankSeed = (plankSeed * 9301 + 49297) % 233280; return plankSeed / 233280; };
  const plankCount = 10;
  const plankWidth = sx(br.w);
  const bridgeLength = sx(br.h);
  for (let i = 0; i < plankCount; i++) {
    const pz = -bridgeLength / 2 + (i / (plankCount - 1)) * bridgeLength + (prand() - 0.5) * 0.15;
    const plank = new THREE.Mesh(new THREE.BoxGeometry(plankWidth, 0.08, 0.45), plankMat);
    plank.position.set(0, 0, pz);
    plank.rotation.y = (prand() - 0.5) * 0.08;
    plank.receiveShadow = true;
    bridgeGroup.add(plank);
  }
  const railMat = new THREE.MeshStandardMaterial({ color: '#4a3a28' });
  const railL = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.5, bridgeLength + 0.5), railMat);
  railL.position.set(-plankWidth / 2, 0.2, 0);
  bridgeGroup.add(railL);
  const railR = railL.clone(); railR.position.x = plankWidth / 2; bridgeGroup.add(railR);

  // four small decorative corner lamps — beside the gangway, never on it
  const bridgeLampMat = new THREE.MeshStandardMaterial({ color: '#bfe8ec', emissive: '#8fe0e6', emissiveIntensity: 0.85, transparent: true, opacity: 0.9 });
  const lampInset = 0.1;
  for (const sxSign of [-1, 1]) {
    for (const szSign of [-1, 1]) {
      const lampX = sxSign * (plankWidth / 2 + lampInset);
      const lampZ = szSign * (bridgeLength / 2 - 0.15);
      const post = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.025, 0.4, 6), railMat);
      post.position.set(lampX, 0.35, lampZ);
      bridgeGroup.add(post);
      const orb = new THREE.Mesh(new THREE.SphereGeometry(0.07, 10, 8), bridgeLampMat);
      orb.position.set(lampX, 0.58, lampZ);
      bridgeGroup.add(orb);
    }
  }
  lanterns.push({ mat: bridgeLampMat, seed: brX + brZ });

  // ---- Friendship square ----
  const sq = VALE_LANDMARKS.friendshipSquare;
  const sqX = sx(sq.x), sqZ = sx(sq.y);
  const sqH = heightAt(sqX, sqZ);
  const squareMesh = new THREE.Mesh(
    new THREE.CircleGeometry(sx(sq.r), 24),
    new THREE.MeshStandardMaterial({ color: '#b4aa8c', roughness: 1 })
  );
  squareMesh.rotation.x = -Math.PI / 2;
  squareMesh.position.set(sqX, sqH + 0.02, sqZ);
  squareMesh.receiveShadow = true;
  scene.add(squareMesh);

  // ---- Academy ----
  const ab = VALE_LANDMARKS.academyBuilding;
  const abX = sx(ab.x), abZ = sx(ab.y);
  const abH = heightAt(abX, abZ);
  const academy = new THREE.Group();
  academy.position.set(abX, abH, abZ);
  scene.add(academy);
  const wallMat = new THREE.MeshStandardMaterial({ color: PALETTE.academy, roughness: 0.8 });
  const towerMat = new THREE.MeshStandardMaterial({ color: PALETTE.academyDark, roughness: 0.8 });
  const roofMat = new THREE.MeshStandardMaterial({ color: PALETTE.roof, roughness: 0.7 });
  const glowMat = new THREE.MeshStandardMaterial({ color: '#d9b45c', emissive: '#d9b45c', emissiveIntensity: 0.6 });

  const hallW = sx(ab.w), hallH = 5, hallD = sx(ab.h);
  const hall = new THREE.Mesh(new THREE.BoxGeometry(hallW, hallH, hallD), wallMat);
  hall.position.y = hallH / 2;
  hall.castShadow = true; hall.receiveShadow = true;
  academy.add(hall);
  const roof = new THREE.Mesh(new THREE.ConeGeometry(hallW * 0.75, 3.2, 4), roofMat);
  roof.rotation.y = Math.PI / 4;
  roof.position.y = hallH + 1.4;
  academy.add(roof);

  for (const side of [-1, 1]) {
    const tower = new THREE.Mesh(new THREE.CylinderGeometry(1.1, 1.2, hallH + 2.5, 10), towerMat);
    tower.position.set(side * (hallW / 2 + 1.1), (hallH + 2.5) / 2, 0);
    tower.castShadow = true;
    academy.add(tower);
    const cap = new THREE.Mesh(new THREE.ConeGeometry(1.3, 1.8, 10), roofMat);
    cap.position.set(side * (hallW / 2 + 1.1), hallH + 2.5 + 0.9, 0);
    academy.add(cap);
    const spireGlow = new THREE.Mesh(new THREE.SphereGeometry(0.14, 8, 8), glowMat);
    spireGlow.position.set(side * (hallW / 2 + 1.1), hallH + 2.5 + 1.85, 0);
    academy.add(spireGlow);
  }

  for (const wx of [-hallW * 0.22, 0, hallW * 0.22]) {
    const win = new THREE.Mesh(new THREE.CircleGeometry(0.35, 12), glowMat);
    win.position.set(wx, hallH * 0.6, hallD / 2 + 0.02);
    academy.add(win);
  }

  const door = new THREE.Mesh(new THREE.BoxGeometry(1.1, 1.9, 0.1), new THREE.MeshStandardMaterial({ color: '#3d3860' }));
  door.position.set(0, 0.95, hallD / 2 + 0.02);
  academy.add(door);

  // ---- Portal (locked, Moonmere) ----
  const port = VALE_LANDMARKS.moonmerePortal;
  const portX = sx(port.x), portZ = sx(port.y);
  const portH = heightAt(portX, portZ);
  const portalGroup = new THREE.Group();
  portalGroup.position.set(portX, portH, portZ);
  scene.add(portalGroup);
  const frame = new THREE.Mesh(
    new THREE.TorusGeometry(1.3, 0.16, 10, 24),
    new THREE.MeshStandardMaterial({ color: '#3a3560', roughness: 0.6 })
  );
  frame.position.y = 1.4;
  portalGroup.add(frame);
  const disc = new THREE.Mesh(
    new THREE.CircleGeometry(1.15, 24),
    new THREE.MeshStandardMaterial({ color: '#4a3f80', emissive: '#6a5fb0', emissiveIntensity: 0.5, transparent: true, opacity: 0.75 })
  );
  disc.position.y = 1.4;
  portalGroup.add(disc);

  // ---- Collectibles + star fragments (glowing, removable) ----
  function makeGlowItem(x, y, color) {
    const wx = sx(x), wz = sx(y);
    const h = heightAt(wx, wz);
    const group = new THREE.Group();
    group.position.set(wx, h + 0.5, wz);
    const mesh = new THREE.Mesh(
      new THREE.OctahedronGeometry(0.16, 0),
      new THREE.MeshStandardMaterial({ color, emissive: color, emissiveIntensity: 0.7, roughness: 0.3 })
    );
    group.add(mesh);
    scene.add(group);
    return { group, mesh, seed: wx };
  }
  for (const c of COLLECTIBLES) collectibleMeshes.set(c.id, makeGlowItem(c.x, c.y, '#d9b45c'));
  for (const f of STAR_FRAGMENTS) fragmentMeshes.set(f.id, makeGlowItem(f.x, f.y, '#9fd9e0'));

  return {
    trees, crystals, lanterns, collectibleMeshes, fragmentMeshes,
    riverMesh, riverGeo, riverBasePositions, riverWidth, foamTex,
  };
}
