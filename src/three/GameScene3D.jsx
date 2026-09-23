import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { NPCS, COLLECTIBLES, STAR_FRAGMENTS, VALE_LANDMARKS, LANTERNS, FLOWER_PATCHES, BENCHES, SIGNS, ROCKS, DRAGONFLY_NEST } from '../data/gameData.js';
import { sx } from './scale.js';
import { heightAt } from './noise.js';
import { createTerrainSystem } from './terrain.js';
import { buildWorld } from './world.js';
import { buildHumanoid, animateHumanoid, GROUND_FOOT_OFFSET, buildContactShadow } from './characterRig.js';
import { buildCompanion, animateCompanion } from './companionRig.js';
import { createFireflies, createGroundFog, createShootingStars, createAurora, createSky, createClouds, createRain } from './weather.js';
import { createPipCompanion, starTexture } from './dragonflies.js';
import { resolveValeXZ, resolveRectsXZ } from './collision3d.js';
import { buildAcademyHallScene, buildRoomScene } from './interiors.js';

const PLAYER_RADIUS = 0.32;
const BASE_SPEED = 3.4;
const RUN_MULT = 1.8;
const INTERACT_RANGE = 2.3;

const CAMERA_PRESETS = {
  1: { distance: 5.2, height: 2.0, fov: 55, pitch: 0.28 },
  2: { distance: 8.5, height: 3.2, fov: 62, pitch: 0.32 },
  3: { distance: 13, height: 9, fov: 48, pitch: 0.85 },
  4: { distance: 3.1, height: 1.55, fov: 50, pitch: 0.16 },
};

const NPC_LOOKS = {
  elowen: { skin: '#e8c9a0', hair: '#7a5ea8', top: '#7a5ea8', bottom: '#4a4370', shoes: '#3a3350', eye: '#c9a13b', hairStyle: 'Langt' },
  mira: { skin: '#f0c9a8', hair: '#d98fa3', top: '#d98fa3', bottom: '#5a4a6a', shoes: '#3a3350', eye: '#5ea87d', hairStyle: 'Kort' },
  rowan: { skin: '#d9a066', hair: '#5e8f6f', top: '#5e8f6f', bottom: '#4a4370', shoes: '#3a3350', eye: '#4a7fae', hairStyle: 'Kort' },
};

function playerColors(save) {
  const p = save.player;
  const eq = save.equippedOutfit;
  return { skin: p.skinTone, hair: p.hairColor, eye: p.eyeColor, hairStyle: p.hairStyle, top: eq.topColor, bottom: eq.bottomColor, shoes: eq.shoesColor };
}

export default function GameScene3D({ save, paused, dispatch, emoteRequest, isMobile }) {
  const mountRef = useRef(null);
  const promptRef = useRef(null);
  const joyKnobRef = useRef(null);
  const saveRef = useRef(save);
  saveRef.current = save;
  const pausedRef = useRef(paused);
  pausedRef.current = paused;
  const dispatchRef = useRef(dispatch);
  dispatchRef.current = dispatch;
  const threeApiRef = useRef({});

  const stateRef = useRef({
    scene: save.position.scene,
    x: save.position.x3 ?? 0,
    z: save.position.z3 ?? 3,
    rotY: save.position.rotY ?? Math.PI,
    moving: false,
    running: false,
    companion: { x: 0, z: 4 },
    companionState: {},
    pip: { x: 0, y: 0, z: 0 },
    pipInit: false,
    playerAnim: {},
    camYaw: save.cameraYaw ?? 0,
    camPitch: CAMERA_PRESETS[save.cameraMode]?.pitch ?? 0.28,
    keys: {},
    joyVec: { x: 0, y: 0 },
    dragging: false,
    lastPointer: { x: 0, y: 0 },
    time: 0,
    emote: null,
    emoteT: 0,
    emoteNonce: -1,
    nearTarget: null,
    lastSaveAt: 0,
    jumping: false,
    jumpT: 0,
    jumpOffset: 0,
  });

  useEffect(() => {
    const mount = mountRef.current;
    const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
    renderer.setPixelRatio(Math.min(2, window.devicePixelRatio || 1));
    // Shadow mapping is deliberately off: a moving sun with a live shadow
    // camera over this much scattered geometry is the single most expensive
    // thing a WebGL scene like this can do, especially on mobile GPUs. Depth
    // is instead read from vertex-color shading, ambient occlusion-ish
    // ground darkening near objects, and the emissive glow accents — a
    // "baked lighting" stand-in per the brief's own optimization notes.
    renderer.shadowMap.enabled = false;
    mount.appendChild(renderer.domElement);

    const camera = new THREE.PerspectiveCamera(55, 1, 0.1, 600);

    // ---- Vale scene ----
    const valeScene = new THREE.Scene();
    const sky = createSky(valeScene, renderer);
    const terrain = createTerrainSystem(valeScene);
    const world = buildWorld(valeScene, heightAt);
    const fireflies = createFireflies(valeScene);
    const fog = createGroundFog(valeScene);
    const aurora = createAurora(valeScene);
    const shootingStars = createShootingStars(valeScene);
    const clouds = createClouds(valeScene);
    const rain = createRain(valeScene);

    // NPC rigs (vale only)
    const npcRigs = {};
    for (const n of NPCS) {
      const rig = buildHumanoid(NPC_LOOKS[n.id] || NPC_LOOKS.elowen);
      const wx = sx(n.x), wz = sx(n.y);
      rig.group.position.set(wx, heightAt(wx, wz) - GROUND_FOOT_OFFSET, wz);
      rig.group.rotation.y = Math.PI;
      valeScene.add(rig.group);
      const shadow = buildContactShadow(0.3);
      shadow.position.set(wx, heightAt(wx, wz) + 0.02, wz);
      valeScene.add(shadow);
      npcRigs[n.id] = { rig, anim: {}, x: wx, z: wz };
    }

    // Player + companion rigs
    const playerRig = buildHumanoid(playerColors(saveRef.current));
    valeScene.add(playerRig.group);
    const playerShadow = buildContactShadow(0.36);
    valeScene.add(playerShadow);
    const companionRig = buildCompanion(saveRef.current.companion.type, saveRef.current.companion);
    valeScene.add(companionRig.group);
    const pip = createPipCompanion();
    valeScene.add(pip.group);

    // ---- Whisperwood dragonfly nest (Rowan's quest) ----
    const nestSpotX = sx(DRAGONFLY_NEST.x), nestSpotZ = sx(DRAGONFLY_NEST.y);
    const nestGroup = new THREE.Group();
    nestGroup.position.set(nestSpotX, heightAt(nestSpotX, nestSpotZ), nestSpotZ);
    nestGroup.visible = false;
    const nestMat = new THREE.MeshStandardMaterial({
      color: '#bfe6ff', emissive: '#8fd8ff', emissiveIntensity: 0.6, transparent: true, opacity: 0.9, roughness: 0.3,
    });
    const nestMesh = new THREE.Mesh(new THREE.SphereGeometry(0.22, 10, 8), nestMat);
    nestMesh.scale.set(1, 0.8, 1.15);
    nestMesh.position.y = 0.3;
    nestGroup.add(nestMesh);
    const nestGlow = new THREE.PointLight('#9fe0ff', 0.7, 4, 2);
    nestGlow.position.y = 0.3;
    nestGroup.add(nestGlow);
    const nestStarMap = starTexture();
    const nestStarGeo = new THREE.BufferGeometry();
    const NEST_STARS = 8;
    const nestStarPos = new Float32Array(NEST_STARS * 3);
    nestStarGeo.setAttribute('position', new THREE.BufferAttribute(nestStarPos, 3));
    const nestStarMat = new THREE.PointsMaterial({
      map: nestStarMap, size: 0.24, transparent: true, opacity: 0.8, sizeAttenuation: true,
      depthWrite: false, blending: THREE.AdditiveBlending, fog: false,
    });
    const nestStars = new THREE.Points(nestStarGeo, nestStarMat);
    nestStars.frustumCulled = false;
    nestGroup.add(nestStars);
    const nestStarSeeds = Array.from({ length: NEST_STARS }, () => ({
      a: Math.random() * Math.PI * 2, r: 0.3 + Math.random() * 0.25, h: 0.15 + Math.random() * 0.3, speed: 0.3 + Math.random() * 0.3, phase: Math.random() * 10,
    }));
    valeScene.add(nestGroup);

    // ---- Interior scenes ----
    const academyHallData = buildAcademyHallScene();
    const roomData = buildRoomScene();

    const scenes = { vale: valeScene, academyHall: academyHallData.scene, room: roomData.scene };

    function resize() {
      const rect = mount.getBoundingClientRect();
      renderer.setSize(rect.width, rect.height);
      camera.aspect = rect.width / rect.height || 1;
      camera.updateProjectionMatrix();
    }
    resize();
    window.addEventListener('resize', resize);

    // ---------------- Interaction / collision helpers ----------------
    function currentInterior() {
      const st = stateRef.current;
      if (st.scene === 'academyHall') return academyHallData;
      if (st.scene === 'room') return roomData;
      return null;
    }

    function resolveMovement(nx, nz) {
      const st = stateRef.current;
      if (st.scene === 'vale') return resolveValeXZ(nx, nz, PLAYER_RADIUS);
      const data = currentInterior();
      return resolveRectsXZ(nx, nz, PLAYER_RADIUS, data.colliders, data.bounds);
    }

    function groundYAt(scene, x, z) {
      if (scene === 'vale') return heightAt(x, z);
      return 0;
    }

    function handleInteract() {
      if (pausedRef.current) return;
      const near = stateRef.current.nearTarget;
      if (!near) return;
      const d = dispatchRef.current;
      const st = stateRef.current;
      switch (near.type) {
        case 'npc':
          d({ type: 'OPEN_DIALOGUE', npcId: near.id });
          break;
        case 'collectible':
          d({ type: 'COLLECT_ITEM', id: near.id, name: near.name });
          break;
        case 'fragment':
          d({ type: 'COLLECT_FRAGMENT', id: near.id });
          break;
        case 'academyDoor': {
          st.scene = 'academyHall';
          st.x = academyHallData.spawn.x; st.z = academyHallData.spawn.z; st.rotY = Math.PI;
          academyHallData.scene.add(playerRig.group);
          academyHallData.scene.add(playerShadow);
          academyHallData.scene.add(companionRig.group);
          academyHallData.scene.add(pip.group);
          d({ type: 'CHANGE_SCENE', scene: 'academyHall', x3: st.x, z3: st.z, rotY: st.rotY });
          d({ type: 'DISCOVER_AREA', id: 'asterwyn_academy' });
          break;
        }
        case 'toRoom': {
          st.scene = 'room';
          st.x = roomData.spawn.x; st.z = roomData.spawn.z; st.rotY = Math.PI;
          roomData.scene.add(playerRig.group);
          roomData.scene.add(playerShadow);
          roomData.scene.add(companionRig.group);
          roomData.scene.add(pip.group);
          d({ type: 'CHANGE_SCENE', scene: 'room', x3: st.x, z3: st.z, rotY: st.rotY });
          break;
        }
        case 'exitToVale': {
          st.scene = 'vale';
          st.x = 0; st.z = sx(-380); st.rotY = 0;
          valeScene.add(playerRig.group);
          valeScene.add(playerShadow);
          valeScene.add(companionRig.group);
          valeScene.add(pip.group);
          d({ type: 'CHANGE_SCENE', scene: 'vale', x3: st.x, z3: st.z, rotY: st.rotY });
          break;
        }
        case 'exitToHall': {
          st.scene = 'academyHall';
          st.x = sx(300); st.z = sx(-150); st.rotY = Math.PI;
          academyHallData.scene.add(playerRig.group);
          academyHallData.scene.add(playerShadow);
          academyHallData.scene.add(companionRig.group);
          academyHallData.scene.add(pip.group);
          d({ type: 'CHANGE_SCENE', scene: 'academyHall', x3: st.x, z3: st.z, rotY: st.rotY });
          break;
        }
        case 'wardrobe':
          d({ type: 'OPEN_WARDROBE' });
          break;
        case 'portal':
          d({ type: 'NOTIFY', text: 'Portalen til Moonmere er låst. Den åpnes i et senere kapittel.' });
          d({ type: 'DISCOVER_AREA', id: 'moonmere_portal' });
          break;
        case 'sign':
          d({ type: 'NOTIFY', text: 'Stien snor seg inn mot Whisperwood — ukjent territorium ennå.' });
          d({ type: 'DISCOVER_AREA', id: 'whisperwood_path' });
          break;
        case 'dragonflyNest':
          d({ type: 'FIND_DRAGONFLY' });
          break;
        case 'crystal':
          d({ type: 'NOTIFY', text: 'En stille krystall. Den summer svakt av gammel magi.' });
          break;
        case 'lanternExamine': {
          const texts = [
            'Lykten lyser mykt i mørket og holder skyggene på avstand.',
            'En liten flamme av stjernelys flakker bak glasset.',
            'Varmen fra lykten kjennes beroligende i kveldskulden.',
          ];
          d({ type: 'NOTIFY', text: texts[Math.abs(near.id) % texts.length] });
          break;
        }
        case 'flowerExamine': {
          const texts = [
            'Blomstene lukter svakt av honning og regn.',
            'Kronbladene skinner litt i måneskinnet.',
            'En liten summing av insekter rundt blomsterklyngen.',
          ];
          d({ type: 'NOTIFY', text: texts[Math.abs(near.id) % texts.length] });
          break;
        }
        case 'benchExamine':
          d({ type: 'NOTIFY', text: 'Benken innbyr til en pause. Herfra kan du høre dalen puste.' });
          break;
        case 'rockExamine': {
          const texts = [
            'En værbitt stein, glatt av årevis med regn.',
            'Mose gror i sprekkene på den gamle steinen.',
            'Steinen er varm av dagens siste solstråler.',
          ];
          d({ type: 'NOTIFY', text: texts[Math.abs(near.id) % texts.length] });
          break;
        }
        case 'signpost':
          d({ type: 'NOTIFY', text: near.text });
          d({ type: 'DISCOVER_AREA', id: near.id });
          break;
        case 'desk':
          d({ type: 'NOTIFY', text: 'Skrivebordet ditt, fullt av skisser fra dalen.' });
          break;
        case 'chest':
          d({ type: 'NOTIFY', text: 'Kisten er tom ennå — kanskje du finner noe å legge i den.' });
          break;
        case 'window':
          d({ type: 'NOTIFY', text: 'Utsikt over Asterwyn Vale. Dalen sover aldri helt.' });
          break;
        default:
          break;
      }
    }

    function updateNearTarget() {
      const st = stateRef.current;
      const sv = saveRef.current;
      let best = null, bestD = INTERACT_RANGE;
      const consider = (id, type, x, z, label, extra) => {
        const d = Math.hypot(st.x - x, st.z - z);
        if (d < bestD) { bestD = d; best = { id, type, x, z, label, ...extra }; }
      };
      if (st.scene === 'vale') {
        for (const n of NPCS) consider(n.id, 'npc', sx(n.x), sx(n.y), `E — Snakk med ${n.name}`);
        for (const c of COLLECTIBLES) {
          if (sv.inventory.collectibles.includes(c.id)) continue;
          consider(c.id, 'collectible', sx(c.x), sx(c.y), 'E — Samle', { name: c.name });
        }
        if (sv.quests.mainQuest.state === 'active') {
          for (const f of STAR_FRAGMENTS) {
            if (sv.quests.mainQuest.foundFragmentIds.includes(f.id)) continue;
            consider(f.id, 'fragment', sx(f.x), sx(f.y), 'E — Samle stjernefragment');
          }
        }
        consider('academyDoor', 'academyDoor', sx(VALE_LANDMARKS.academyDoor.x), sx(VALE_LANDMARKS.academyDoor.y), 'E — Åpne akademidøren');
        consider('portal', 'portal', sx(VALE_LANDMARKS.moonmerePortal.x), sx(VALE_LANDMARKS.moonmerePortal.y), 'E — Undersøk portalen');
        consider('sign', 'sign', sx(VALE_LANDMARKS.whisperwoodPath.x), sx(VALE_LANDMARKS.whisperwoodPath.y), 'E — Undersøk stien');
        if (sv.quests.dragonflyQuest.state === 'active' && !sv.quests.dragonflyQuest.found) {
          consider('dragonflyNest', 'dragonflyNest', nestSpotX, nestSpotZ, 'E — Undersøk den lille skapningen');
        }
        LANTERNS.forEach((l, i) => consider(`lantern-${i}`, 'lanternExamine', sx(l.x), sx(l.y), 'E — Undersøk lykten', { id: i }));
        FLOWER_PATCHES.forEach((f, i) => consider(`flower-${i}`, 'flowerExamine', sx(f.x), sx(f.y), 'E — Undersøk blomstene', { id: i }));
        BENCHES.forEach((b, i) => consider(`bench-${i}`, 'benchExamine', sx(b.x), sx(b.y), 'E — Sett deg / undersøk benken'));
        SIGNS.forEach((s) => consider(s.id, 'signpost', sx(s.x), sx(s.y), 'E — Les skiltet', { text: s.text }));
        ROCKS.forEach((r, i) => consider(`rock-${i}`, 'rockExamine', sx(r.x), sx(r.y), 'E — Undersøk steinen', { id: i }));
      } else {
        const data = currentInterior();
        for (const it of data.interactables) consider(it.id, it.type, it.x, it.z, it.label);
      }
      st.nearTarget = best;
      if (promptRef.current) {
        const show = best && !pausedRef.current;
        promptRef.current.style.display = show ? 'block' : 'none';
        if (show) promptRef.current.textContent = best.label;
      }
    }

    function maybeDiscover() {
      const st = stateRef.current;
      if (st.scene !== 'vale') return;
      const d = dispatchRef.current;
      const sv = saveRef.current;
      const checks = [
        { id: 'friendship_square', x: sx(VALE_LANDMARKS.friendshipSquare.x), z: sx(VALE_LANDMARKS.friendshipSquare.y), r: 6.5 },
        { id: 'asterwyn_academy', x: sx(VALE_LANDMARKS.academyDoor.x), z: sx(VALE_LANDMARKS.academyDoor.y), r: 8 },
      ];
      for (const c of checks) {
        if (!sv.discoveredAreas.includes(c.id) && Math.hypot(st.x - c.x, st.z - c.z) < c.r) d({ type: 'DISCOVER_AREA', id: c.id });
      }
      if (!sv.discoveredAreas.includes('asterwyn_vale')) d({ type: 'DISCOVER_AREA', id: 'asterwyn_vale' });
    }

    // ---------------- Input ----------------
    function onKeyDown(e) {
      stateRef.current.keys[e.key.toLowerCase()] = true;
      if (e.key.toLowerCase() === 'e') handleInteract();
      if (e.code === 'Space' && !pausedRef.current) {
        e.preventDefault();
        const st = stateRef.current;
        if (!st.jumping && !st.emote) { st.jumping = true; st.jumpT = 0; }
      }
    }
    function onKeyUp(e) { stateRef.current.keys[e.key.toLowerCase()] = false; }
    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);

    function onPointerDown(e) {
      if (e.target.closest('.joystick-base') || e.target.closest('.action-btn')) return;
      stateRef.current.dragging = true;
      stateRef.current.lastPointer = { x: e.clientX, y: e.clientY };
    }
    function onPointerMove(e) {
      const st = stateRef.current;
      if (!st.dragging) return;
      const dx = e.clientX - st.lastPointer.x;
      const dy = e.clientY - st.lastPointer.y;
      st.lastPointer = { x: e.clientX, y: e.clientY };
      st.camYaw -= dx * 0.006;
      // Pitch can now go negative too — dragging the camera low and behind
      // the player tilts the view steeply upward, so you can look straight
      // up at the sky (clouds, stars, aurora) instead of being capped at
      // a level chase-cam angle.
      st.camPitch = Math.min(1.3, Math.max(-1.3, st.camPitch + dy * 0.004));
    }
    function onPointerUp() { stateRef.current.dragging = false; }
    mount.addEventListener('pointerdown', onPointerDown);
    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);

    // emote handling exposed for effect below
    function triggerJump() {
      const st = stateRef.current;
      if (pausedRef.current) return;
      if (!st.jumping && !st.emote) { st.jumping = true; st.jumpT = 0; }
    }
    threeApiRef.current = { handleInteract, triggerJump };

    // ---------------- Main loop ----------------
    let raf;
    let last = performance.now();
    function loop(now) {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      step(dt);
      draw();
      raf = requestAnimationFrame(loop);
    }

    function step(dt) {
      const st = stateRef.current;
      st.time += dt;

      if (st.emote) {
        st.emoteT += dt;
        const duration = st.emote === 'cheer' ? 1.4 : st.emote === 'thanks' ? 1.8 : 1.3;
        if (st.emoteT > duration) { st.emote = null; st.emoteT = 0; }
      }

      // A short parabolic hop — mainly there so movement reads as grounded
      // (push off, arc, land) rather than just sliding across the terrain.
      if (st.jumping) {
        st.jumpT += dt;
        const JUMP_DURATION = 0.52;
        const p = Math.min(1, st.jumpT / JUMP_DURATION);
        st.jumpOffset = Math.sin(p * Math.PI) * 0.42;
        if (p >= 1) { st.jumping = false; st.jumpOffset = 0; }
      }

      let mvx = 0, mvz = 0;
      if (!pausedRef.current) {
        const k = st.keys;
        let ix = 0, iz = 0;
        if (k['w'] || k['arrowup']) iz -= 1;
        if (k['s'] || k['arrowdown']) iz += 1;
        if (k['a'] || k['arrowleft']) ix -= 1;
        if (k['d'] || k['arrowright']) ix += 1;
        ix += st.joyVec.x; iz += st.joyVec.y;
        const len = Math.hypot(ix, iz);
        if (len > 1) { ix /= len; iz /= len; }
        if (len > 0.001) {
          // movement relative to camera yaw
          const fx = -Math.sin(st.camYaw), fz = -Math.cos(st.camYaw);
          const rx = Math.cos(st.camYaw), rz = -Math.sin(st.camYaw);
          mvx = fx * -iz + rx * ix;
          mvz = fz * -iz + rz * ix;
        }
        st.running = !!k['shift'] && len > 0.001;
      }

      const moving = Math.abs(mvx) > 0.001 || Math.abs(mvz) > 0.001;
      st.moving = moving && !st.emote;
      if (st.moving) {
        const speed = BASE_SPEED * (st.running ? RUN_MULT : 1);
        const nx = st.x + mvx * speed * dt;
        const nz = st.z + mvz * speed * dt;
        const resolved = resolveMovement(nx, nz);
        st.x = resolved.x; st.z = resolved.z;
        const targetRot = Math.atan2(mvx, mvz);
        let diff = targetRot - st.rotY;
        while (diff > Math.PI) diff -= Math.PI * 2;
        while (diff < -Math.PI) diff += Math.PI * 2;
        st.rotY += diff * Math.min(1, dt * 10);
      }

      // companion follow (relative to avatar facing)
      const fvx = Math.sin(st.rotY), fvz = Math.cos(st.rotY);
      const pvx = fvz, pvz = -fvx;
      const wob = Math.sin(st.time * 1.6) * 0.15;
      const targetX = st.x - fvx * 1.1 + pvx * 1.0 + wob;
      const targetZ = st.z - fvz * 1.1 + pvz * 1.0;
      const smoothing = Math.min(1, dt * 4.2);
      st.companion.x += (targetX - st.companion.x) * smoothing;
      st.companion.z += (targetZ - st.companion.z) * smoothing;

      // Pip follow: hovers near shoulder height with her own little
      // figure-8 wander layered on top, so she never looks pinned in place.
      if (saveRef.current.dragonflyCompanion) {
        const headY = groundYAt(st.scene, st.x, st.z) + 1.5;
        const pipWobX = Math.sin(st.time * 1.8) * 0.32;
        const pipWobZ = Math.cos(st.time * 1.35) * 0.32;
        const pipWobY = Math.sin(st.time * 2.3) * 0.16;
        const pipTargetX = st.x + pvx * 0.5 + fvx * 0.2 + pipWobX;
        const pipTargetZ = st.z + pvz * 0.5 + fvz * 0.2 + pipWobZ;
        const pipTargetY = headY + 0.3 + pipWobY;
        if (!st.pipInit) {
          st.pip.x = st.x; st.pip.y = headY; st.pip.z = st.z; st.pipInit = true;
        } else {
          const pipSmoothing = Math.min(1, dt * 5.5);
          st.pip.x += (pipTargetX - st.pip.x) * pipSmoothing;
          st.pip.y += (pipTargetY - st.pip.y) * pipSmoothing;
          st.pip.z += (pipTargetZ - st.pip.z) * pipSmoothing;
        }
      }

      updateNearTarget();
      maybeDiscover();

      st.lastSaveAt += dt;
      if (st.lastSaveAt > 1) {
        st.lastSaveAt = 0;
        dispatchRef.current({ type: 'SAVE_POSITION_3D', scene: st.scene, x3: st.x, z3: st.z, rotY: st.rotY, cameraYaw: st.camYaw });
      }
    }

    function draw() {
      const st = stateRef.current;
      const sv = saveRef.current;
      const groundY = groundYAt(st.scene, st.x, st.z);
      playerRig.group.position.set(st.x, groundY - GROUND_FOOT_OFFSET + st.jumpOffset, st.z);
      playerRig.group.rotation.y = st.rotY;
      animateHumanoid(playerRig, st.playerAnim, 0.016, st.moving, st.running, st.emote, st.emoteT);
      playerShadow.position.set(st.x, groundY + 0.02, st.z);
      const shadowShrink = Math.max(0.4, 1 - st.jumpOffset * 1.3);
      playerShadow.scale.set(shadowShrink, shadowShrink, 1);
      playerShadow.material.opacity = 0.32 * shadowShrink;

      const compGroundY = groundYAt(st.scene, st.companion.x, st.companion.z);
      companionRig.group.position.set(st.companion.x, compGroundY, st.companion.z);
      animateCompanion(companionRig, st.companionState, 0.016, st.moving, st.time);

      pip.update(st.pip.x, st.pip.y, st.pip.z, !!sv.dragonflyCompanion, 0.016, st.time);

      if (st.scene === 'vale') {
        const dq = sv.quests.dragonflyQuest;
        nestGroup.visible = dq.state === 'active' && !dq.found;
        if (nestGroup.visible) {
          nestMat.emissiveIntensity = 0.4 + 0.3 * Math.sin(st.time * 2);
          nestGlow.intensity = 0.5 + 0.3 * Math.sin(st.time * 2.4);
          const narr = nestStarGeo.attributes.position.array;
          for (let i = 0; i < NEST_STARS; i++) {
            const s = nestStarSeeds[i];
            const a = s.a + st.time * s.speed;
            narr[i * 3] = Math.cos(a) * s.r;
            narr[i * 3 + 1] = s.h + Math.sin(st.time * 1.1 + s.phase) * 0.08;
            narr[i * 3 + 2] = Math.sin(a) * s.r;
          }
          nestStarGeo.attributes.position.needsUpdate = true;
          nestStarMat.opacity = 0.55 + 0.35 * Math.sin(st.time * 2.6);
        }
      }

      // NPC idle
      for (const key of Object.keys(npcRigs)) {
        const n = npcRigs[key];
        n.anim.idleT = (n.anim.idleT || 0) + 0.016;
        animateHumanoid(n.rig, n.anim, 0.016, false, false, null, 0);
      }

      // camera
      const mode = CAMERA_PRESETS[sv.cameraMode] || CAMERA_PRESETS[1];
      const distMul = sv.cameraDistance || 1;
      const dist = mode.distance * distMul;
      const pitch = sv.cameraMode === 3 ? mode.pitch : st.camPitch;
      camera.fov = mode.fov;
      camera.updateProjectionMatrix();
      const focus = new THREE.Vector3(st.x, groundY + 1.1, st.z);
      const horiz = dist * Math.cos(pitch);
      const vert = dist * Math.sin(pitch) + mode.height * 0.3;
      let offX = Math.sin(st.camYaw) * horiz;
      let offZ = Math.cos(st.camYaw) * horiz;
      let offY = vert;
      // A steep look-up angle has offY well below zero; naively clamping
      // just the Y coordinate afterward would flatten the whole view back
      // toward horizontal. Instead, when the floor would be violated,
      // scale the entire offset vector toward the focus point — this
      // pulls the camera closer along the same ray, keeping the actual
      // look-up angle intact instead of leveling it out.
      const floorY = st.scene === 'vale' ? heightAt(focus.x + offX, focus.z + offZ) + 0.6 : 0.4;
      if (offY < -0.001 && focus.y + offY < floorY) {
        const scale = Math.min(1, Math.max(0.12, (floorY - focus.y) / offY));
        offX *= scale; offY *= scale; offZ *= scale;
      }
      const camX = focus.x + offX;
      const camZ = focus.z + offZ;
      const camY = focus.y + offY;
      camera.position.set(camX, camY, camZ);
      camera.lookAt(focus);

      // weather + terrain (vale only)
      if (st.scene === 'vale') {
        terrain.update(st.x, st.z);
        const { nightAmount } = sky.update(st.time, st.x, st.z);
        fireflies.update(st.time, st.x, st.z);
        fog.update(st.time, st.x, st.z);
        aurora.update(st.time, st.x, st.z, nightAmount);
        shootingStars.update(0.016, st.time, st.x, st.z);
        clouds.update(st.time, st.x, st.z, nightAmount);
        const rainState = rain.update(0.016, st.time, st.x, st.z);
        if (rainState.active) {
          // a passing shower dims the light and thickens the fog a touch —
          // cheap global tweaks rather than wet-surface shaders
          sky.sun.intensity *= 1 - rainState.intensity * 0.45;
          sky.hemi.intensity *= 1 - rainState.intensity * 0.25;
          valeScene.fog.color.lerp(new THREE.Color('#5c6478'), rainState.intensity * 0.5);
        }

        for (const c of world.crystals) {
          const pulse = 0.6 + 0.4 * Math.sin(st.time * 2 + c.seed);
          c.mesh.material.emissiveIntensity = 0.3 + pulse * 0.5;
          c.mesh.rotation.y += 0.006;
        }
        for (const l of world.lanterns) {
          l.mat.emissiveIntensity = 0.7 + 0.3 * Math.sin(st.time * 3 + l.seed);
        }
        for (const tr of world.trees) {
          tr.canopy.rotation.z = Math.sin(st.time * 0.8 + tr.sway) * 0.05;
        }
        // river surface undulation
        const pos = world.riverGeo.attributes.position;
        const base = world.riverBasePositions;
        for (let i = 0; i < pos.count; i++) {
          const bx = base[i * 3], by = base[i * 3 + 1];
          pos.setY(i, by + Math.sin(st.time * 1.6 + bx * 0.4) * 0.05);
        }
        pos.needsUpdate = true;
        world.foamTex.offset.y = (st.time * 0.12) % 1;

        for (const [id, item] of world.collectibleMeshes) {
          const found = sv.inventory.collectibles.includes(id);
          item.group.visible = !found;
          if (!found) { item.group.position.y += Math.sin(st.time * 3 + item.seed) * 0.0015; item.mesh.rotation.y += 0.02; }
        }
        for (const [id, item] of world.fragmentMeshes) {
          const active = sv.quests.mainQuest.state === 'active' && !sv.quests.mainQuest.foundFragmentIds.includes(id);
          item.group.visible = active;
          if (active) { item.mesh.rotation.y += 0.03; item.mesh.rotation.x += 0.015; }
        }
      }

      renderer.render(scenes[st.scene], camera);
    }

    raf = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', resize);
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);
      mount.removeEventListener('pointerdown', onPointerDown);
      renderer.dispose();
      if (renderer.domElement.parentNode) renderer.domElement.parentNode.removeChild(renderer.domElement);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // emote trigger
  useEffect(() => {
    if (emoteRequest && emoteRequest.nonce !== stateRef.current.emoteNonce) {
      stateRef.current.emote = emoteRequest.type;
      stateRef.current.emoteT = 0;
      stateRef.current.emoteNonce = emoteRequest.nonce;
    }
  }, [emoteRequest]);

  // mobile joystick
  const handleJoyStart = (e) => { e.preventDefault(); moveJoy(e); };
  const handleJoyMove = (e) => { moveJoy(e); };
  const handleJoyEnd = () => { stateRef.current.joyVec = { x: 0, y: 0 }; if (joyKnobRef.current) joyKnobRef.current.style.transform = 'translate(0px,0px)'; };
  function moveJoy(e) {
    const base = e.currentTarget.parentElement.getBoundingClientRect();
    const touch = e.touches ? e.touches[0] : e;
    let dx = touch.clientX - (base.left + base.width / 2);
    let dy = touch.clientY - (base.top + base.height / 2);
    const max = base.width / 2;
    const len = Math.hypot(dx, dy);
    if (len > max) { dx = (dx / len) * max; dy = (dy / len) * max; }
    stateRef.current.joyVec = { x: dx / max, y: dy / max };
    if (joyKnobRef.current) joyKnobRef.current.style.transform = `translate(${dx}px,${dy}px)`;
  }

  function handleActionTap(e) {
    e.preventDefault();
    if (threeApiRef.current.handleInteract) threeApiRef.current.handleInteract();
  }

  function handleJumpTap(e) {
    e.preventDefault();
    if (threeApiRef.current.triggerJump) threeApiRef.current.triggerJump();
  }

  return (
    <div className="game-viewport" ref={mountRef}>
      <div ref={promptRef} className="interact-prompt-3d" style={{ display: 'none' }} />
      {isMobile && (
        <>
          <div
            className="joystick-base"
            onTouchStart={handleJoyStart} onTouchMove={handleJoyMove} onTouchEnd={handleJoyEnd}
          >
            <div className="joystick-knob" ref={joyKnobRef} />
          </div>
          <button className="action-btn" onTouchStart={handleActionTap} onClick={handleActionTap}>E</button>
          <button className="action-btn action-btn-jump" onTouchStart={handleJumpTap} onClick={handleJumpTap}>↑</button>
        </>
      )}
    </div>
  );
}
