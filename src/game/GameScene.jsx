import { useEffect, useRef } from 'react';
import {
  VALE_LANDMARKS, TREES, ROCKS, CRYSTALS, LANTERNS, NPCS, COLLECTIBLES, STAR_FRAGMENTS, INTERIORS, CAMERA_MODES,
  RIVERBANK_PROPS,
} from '../data/gameData.js';
import { resolveVale } from './collision.js';
import { resolveRects } from './interiorCollision.js';
import {
  drawSky, drawAurora, drawShootingStars, drawGroundFog, drawFireflies, drawGround, drawGrassSway, drawFlowers,
  drawPaths, drawReed,
  drawTree, drawRock, drawRiverAndBridge, drawFriendshipSquare, drawAcademy, drawPortal, drawCrystal, drawLantern,
  drawCollectibleGlow, drawCharacter, drawCompanionCanvas, drawNameTag, drawInteractPrompt,
  drawAcademyHallInterior, drawRoomInterior,
} from './render.js';

const PLAYER_RADIUS = 13;
const BASE_SPEED = 148; // px/sec
const RUN_MULT = 1.7;
const INTERACT_RANGE = 60;

function facingFromVector(vx, vy) {
  if (Math.abs(vx) > Math.abs(vy)) return vx > 0 ? 'right' : 'left';
  if (vy !== 0) return vy > 0 ? 'down' : 'up';
  return null;
}

export default function GameScene({ save, paused, dispatch, emoteRequest, isMobile }) {
  const canvasRef = useRef(null);
  const containerRef = useRef(null);
  const saveRef = useRef(save);
  saveRef.current = save;

  const stateRef = useRef({
    scene: save.position.scene,
    x: save.position.x,
    y: save.position.y,
    facing: 'down',
    moving: false,
    running: false,
    walkPhase: 0,
    companion: { x: save.position.x - 30, y: save.position.y + 26 },
    camera: { x: save.position.x, y: save.position.y },
    keys: {},
    joyVec: { x: 0, y: 0 },
    time: 0,
    emote: null,
    emoteT: 0,
    emoteNonce: -1,
    nearTarget: null,
    fireflies: [],
    shootingStars: [],
    nextShootingStar: 4 + Math.random() * 6,
    lastSaveAt: 0,
    discovered: new Set(save.discoveredAreas),
  });

  // init fireflies once
  if (stateRef.current.fireflies.length === 0) {
    let seed = 3131;
    const rand = () => { seed = (seed * 9301 + 49297) % 233280; return seed / 233280; };
    for (let i = 0; i < 40; i++) {
      stateRef.current.fireflies.push({ ox: (rand() - 0.5) * 900, oy: (rand() - 0.5) * 500, seed: rand() * 10, sx: 0, sy: 0 });
    }
  }

  // keyboard input
  useEffect(() => {
    const down = (e) => {
      stateRef.current.keys[e.key.toLowerCase()] = true;
      if (e.key.toLowerCase() === 'e') handleInteract();
    };
    const up = (e) => { stateRef.current.keys[e.key.toLowerCase()] = false; };
    window.addEventListener('keydown', down);
    window.addEventListener('keyup', up);
    return () => { window.removeEventListener('keydown', down); window.removeEventListener('keyup', up); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [paused, dispatch]);

  function handleInteract() {
    if (paused) return;
    const near = stateRef.current.nearTarget;
    if (!near) return;
    switch (near.type) {
      case 'npc':
        dispatch({ type: 'OPEN_DIALOGUE', npcId: near.id });
        break;
      case 'collectible':
        dispatch({ type: 'COLLECT_ITEM', id: near.id, name: near.name });
        break;
      case 'fragment':
        dispatch({ type: 'COLLECT_FRAGMENT', id: near.id });
        break;
      case 'academyDoor':
        stateRef.current.scene = 'academyHall';
        stateRef.current.x = 0; stateRef.current.y = 200;
        dispatch({ type: 'CHANGE_SCENE', scene: 'academyHall', x: 0, y: 200 });
        dispatch({ type: 'DISCOVER_AREA', id: 'asterwyn_academy' });
        break;
      case 'toRoom':
        stateRef.current.scene = 'room';
        stateRef.current.x = 0; stateRef.current.y = 170;
        dispatch({ type: 'CHANGE_SCENE', scene: 'room', x: 0, y: 170 });
        break;
      case 'exitToVale':
        stateRef.current.scene = 'vale';
        stateRef.current.x = 0; stateRef.current.y = -380;
        dispatch({ type: 'CHANGE_SCENE', scene: 'vale', x: 0, y: -380 });
        break;
      case 'exitToHall':
        stateRef.current.scene = 'academyHall';
        stateRef.current.x = 300; stateRef.current.y = -150;
        dispatch({ type: 'CHANGE_SCENE', scene: 'academyHall', x: 300, y: -150 });
        break;
      case 'wardrobe':
        dispatch({ type: 'OPEN_WARDROBE' });
        break;
      case 'portal':
        dispatch({ type: 'NOTIFY', text: 'Portalen til Moonmere er låst. Den åpnes i et senere kapittel.' });
        dispatch({ type: 'DISCOVER_AREA', id: 'moonmere_portal' });
        break;
      case 'sign':
        dispatch({ type: 'NOTIFY', text: 'Stien snor seg inn mot Whisperwood — ukjent territorium ennå.' });
        dispatch({ type: 'DISCOVER_AREA', id: 'whisperwood_path' });
        break;
      case 'crystal':
        dispatch({ type: 'NOTIFY', text: 'En stille krystall. Den summer svakt av gammel magi.' });
        break;
      case 'desk':
        dispatch({ type: 'NOTIFY', text: 'Skrivebordet ditt, fullt av skisser fra dalen.' });
        break;
      case 'chest':
        dispatch({ type: 'NOTIFY', text: 'Kisten er tom ennå — kanskje du finner noe å legge i den.' });
        break;
      case 'window':
        dispatch({ type: 'NOTIFY', text: 'Utsikt over Asterwyn Vale. Dalen sover aldri helt.' });
        break;
      default:
        break;
    }
  }

  // emote trigger
  useEffect(() => {
    if (emoteRequest && emoteRequest.nonce !== stateRef.current.emoteNonce) {
      stateRef.current.emote = emoteRequest.type;
      stateRef.current.emoteT = 0;
      stateRef.current.emoteNonce = emoteRequest.nonce;
    }
  }, [emoteRequest]);

  // resize canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    const resize = () => {
      const rect = container.getBoundingClientRect();
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      canvas.style.width = rect.width + 'px';
      canvas.style.height = rect.height + 'px';
      const ctx = canvas.getContext('2d');
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    window.addEventListener('resize', resize);
    return () => window.removeEventListener('resize', resize);
  }, []);

  // main loop
  useEffect(() => {
    let raf;
    let last = performance.now();

    const loop = (now) => {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      step(dt);
      draw();
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [paused, dispatch]);

  function step(dt) {
    const st = stateRef.current;
    st.time += dt;

    if (st.emote) {
      st.emoteT += dt;
      const duration = st.emote === 'cheer' ? 1.4 : st.emote === 'thanks' ? 1.8 : 1.3;
      if (st.emoteT > duration) { st.emote = null; st.emoteT = 0; }
    }

    let vx = 0, vy = 0;
    if (!paused) {
      const k = st.keys;
      if (k['w'] || k['arrowup']) vy -= 1;
      if (k['s'] || k['arrowdown']) vy += 1;
      if (k['a'] || k['arrowleft']) vx -= 1;
      if (k['d'] || k['arrowright']) vx += 1;
      vx += st.joyVec.x;
      vy += st.joyVec.y;
      const len = Math.hypot(vx, vy);
      if (len > 1) { vx /= len; vy /= len; }
      st.running = !!(k['shift']) && len > 0;
    } else {
      st.running = false;
    }

    const moving = vx !== 0 || vy !== 0;
    st.moving = moving && !st.emote;
    if (st.moving) {
      const speed = BASE_SPEED * (st.running ? RUN_MULT : 1);
      const nx = st.x + vx * speed * dt;
      const ny = st.y + vy * speed * dt;
      let resolved;
      if (st.scene === 'vale') resolved = resolveVale(nx, ny, PLAYER_RADIUS);
      else {
        const cfg = INTERIORS[st.scene];
        resolved = resolveRects(nx, ny, PLAYER_RADIUS, cfg.colliders, cfg.bounds);
      }
      st.x = resolved.x; st.y = resolved.y;
      const f = facingFromVector(vx, vy);
      if (f) st.facing = f;
      st.walkPhase += dt * (st.running ? 11 : 7);
    }

    // companion follow — trails to the side-behind so it never overlaps/hides behind the avatar
    const facingVec = { down: [0, 1], up: [0, -1], left: [-1, 0], right: [1, 0] }[st.facing] || [0, 1];
    const perp = { x: -facingVec[1], y: facingVec[0] };
    const wobble = Math.sin(st.time * 1.6) * 5;
    const targetX = st.x - facingVec[0] * 34 + perp.x * 38 + wobble;
    const targetY = st.y - facingVec[1] * 20 + perp.y * 22 + 26;
    const smoothing = Math.min(1, dt * 4.2);
    st.companion.x += (targetX - st.companion.x) * smoothing;
    st.companion.y += (targetY - st.companion.y) * smoothing;

    // camera
    const sv = saveRef.current;
    const modeCfg = CAMERA_MODES.find((m) => m.id === sv.cameraMode) || CAMERA_MODES[0];
    st.zoom = modeCfg.baseZoom / (sv.cameraDistance || 1);
    const camLead = sv.cameraMode === 3 ? 0 : 18;
    const camTargetX = st.x + facingVec[0] * camLead;
    const camTargetY = st.y + facingVec[1] * camLead * 0.6;
    const camSmooth = Math.min(1, dt * 3.2);
    st.camera.x += (camTargetX - st.camera.x) * camSmooth;
    st.camera.y += (camTargetY - st.camera.y) * camSmooth;

    // weather: shooting stars
    st.nextShootingStar -= dt;
    if (st.nextShootingStar <= 0 && st.scene === 'vale') {
      st.shootingStars.push({
        x: Math.random() * 400 + 100, y: Math.random() * 80,
        vx: 180 + Math.random() * 80, vy: 70 + Math.random() * 30,
        life: 1.1, maxLife: 1.1,
      });
      st.nextShootingStar = 6 + Math.random() * 8;
    }
    for (const s of st.shootingStars) {
      s.x += s.vx * dt; s.y += s.vy * dt; s.life -= dt;
    }
    st.shootingStars = st.shootingStars.filter((s) => s.life > 0);

    // interactables
    updateNearTarget();

    // area discovery
    maybeDiscover();

    // throttled position save
    st.lastSaveAt += dt;
    if (st.lastSaveAt > 1) {
      st.lastSaveAt = 0;
      dispatch({ type: 'SAVE_POSITION', scene: st.scene, x: st.x, y: st.y });
    }
  }

  function maybeDiscover() {
    const st = stateRef.current;
    if (st.scene !== 'vale') return;
    const checks = [
      { id: 'friendship_square', x: VALE_LANDMARKS.friendshipSquare.x, y: VALE_LANDMARKS.friendshipSquare.y, r: 260 },
      { id: 'asterwyn_academy', x: VALE_LANDMARKS.academyDoor.x, y: VALE_LANDMARKS.academyDoor.y, r: 320 },
    ];
    for (const c of checks) {
      if (!st.discovered.has(c.id) && Math.hypot(st.x - c.x, st.y - c.y) < c.r) {
        st.discovered.add(c.id);
        dispatch({ type: 'DISCOVER_AREA', id: c.id });
      }
    }
    if (!st.discovered.has('asterwyn_vale')) {
      st.discovered.add('asterwyn_vale');
      dispatch({ type: 'DISCOVER_AREA', id: 'asterwyn_vale' });
    }
  }

  function updateNearTarget() {
    const st = stateRef.current;
    let best = null, bestD = INTERACT_RANGE;
    const consider = (id, type, x, y, label, extra) => {
      const d = Math.hypot(st.x - x, st.y - y);
      if (d < bestD) { bestD = d; best = { id, type, x, y, label, ...extra }; }
    };

    const sv = saveRef.current;
    if (st.scene === 'vale') {
      for (const n of NPCS) consider(n.id, 'npc', n.x, n.y, `E — Snakk med ${n.name}`);
      for (const c of COLLECTIBLES) {
        if (sv.inventory.collectibles.includes(c.id)) continue;
        consider(c.id, 'collectible', c.x, c.y, 'E — Samle', { name: c.name });
      }
      if (sv.quests.mainQuest.state === 'active') {
        for (const f of STAR_FRAGMENTS) {
          if (sv.quests.mainQuest.foundFragmentIds.includes(f.id)) continue;
          consider(f.id, 'fragment', f.x, f.y, 'E — Samle stjernefragment');
        }
      }
      consider('academyDoor', 'academyDoor', VALE_LANDMARKS.academyDoor.x, VALE_LANDMARKS.academyDoor.y - 10, 'E — Åpne akademidøren');
      consider('portal', 'portal', VALE_LANDMARKS.moonmerePortal.x, VALE_LANDMARKS.moonmerePortal.y, 'E — Undersøk portalen');
      consider('sign', 'sign', VALE_LANDMARKS.whisperwoodPath.x, VALE_LANDMARKS.whisperwoodPath.y, 'E — Undersøk stien');
      for (const c of CRYSTALS) consider(c.id, 'crystal', c.x, c.y, 'E — Undersøk krystallen');
    } else if (st.scene === 'academyHall') {
      const ext = INTERIORS.academyHall.exitToVale;
      const tr = INTERIORS.academyHall.toRoom;
      consider('exitToVale', 'exitToVale', ext.x, ext.y, 'E — Gå ut i dalen');
      consider('toRoom', 'toRoom', tr.x, tr.y, 'E — Gå opp til rommet ditt');
    } else if (st.scene === 'room') {
      const mir = INTERIORS.room.mirror;
      const wd = INTERIORS.room.wardrobe;
      const ext = INTERIORS.room.exitToHall;
      consider('mirror', 'wardrobe', mir.x, mir.y, 'E — Skift antrekk');
      consider('wardrobe', 'wardrobe', wd.x, wd.y, 'E — Skift antrekk');
      consider('desk', 'desk', 200, -140, 'E — Undersøk skrivebordet');
      consider('chest', 'chest', -230, 120, 'E — Undersøk kisten');
      consider('window', 'window', 0, -195, 'E — Se ut vinduet');
      consider('exitToHall', 'exitToHall', ext.x, ext.y, 'E — Gå ned til akademiet');
    }
    st.nearTarget = best;
  }

  function draw() {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const rect = canvas.getBoundingClientRect();
    const w = rect.width, h = rect.height;
    const st = stateRef.current;
    const zoom = st.zoom || 1;

    const toScreen = (wx, wy) => {
      const x = w / 2 + (wx - st.camera.x) * zoom;
      const y = h / 2 + (wy - st.camera.y) * zoom * 0.86 + h * 0.06;
      return { x, y, vw: w, vh: h };
    };

    ctx.clearRect(0, 0, w, h);
    drawSky(ctx, w, h, st.time, st.scene);

    if (st.scene === 'vale') {
      drawVale(ctx, toScreen, st, w, h, zoom);
    } else if (st.scene === 'academyHall') {
      drawAcademyHallInterior(ctx, toScreen, st.time);
      drawEntities(ctx, toScreen, st, [], zoom);
    } else if (st.scene === 'room') {
      drawRoomInterior(ctx, toScreen, st.time);
      drawEntities(ctx, toScreen, st, [], zoom);
    }

    if (st.scene === 'vale') {
      drawGroundFog(ctx, w, h, st.time);
      drawAurora(ctx, w, h, st.time);
      drawShootingStars(ctx, st.shootingStars);
      for (const fp of st.fireflies) {
        const wx = st.camera.x + fp.ox;
        const wy = st.camera.y + fp.oy + Math.sin(st.time * 0.7 + fp.seed) * 14;
        const p = toScreen(wx, wy);
        fp.sx = p.x; fp.sy = p.y;
      }
      drawFireflies(ctx, st.fireflies, st.time);
    }

    if (st.nearTarget) {
      const p = toScreen(st.nearTarget.x, st.nearTarget.y - 46);
      drawInteractPrompt(ctx, p, st.nearTarget.label);
    }

    if (isMobile) drawMobileHint();
  }

  function drawMobileHint() {}

  function drawVale(ctx, toScreen, st, w, h, zoom) {
    const sv = saveRef.current;
    drawGround(ctx, w, h, st.camera.x, st.camera.y, zoom);
    drawPaths(ctx, toScreen);
    drawFriendshipSquare(ctx, toScreen);
    drawRiverAndBridge(ctx, toScreen, st.camera.x, st.camera.y, st.time, 900 / zoom);
    drawFlowers(ctx, toScreen);
    drawGrassSway(ctx, toScreen, st.camera.x, st.camera.y, st.time, 700 / zoom);

    const entities = [];
    for (const t of TREES) {
      if (Math.abs(t.x - st.camera.x) > 900 / zoom || Math.abs(t.y - st.camera.y) > 700 / zoom) continue;
      entities.push({ y: t.y + 40, draw: () => drawTree(ctx, toScreen(t.x, t.y), t, st.time) });
    }
    for (const r of ROCKS) {
      if (Math.abs(r.x - st.camera.x) > 900 / zoom || Math.abs(r.y - st.camera.y) > 700 / zoom) continue;
      entities.push({ y: r.y + 6, draw: () => drawRock(ctx, toScreen(r.x, r.y), r) });
    }
    for (const rp of RIVERBANK_PROPS) {
      if (Math.abs(rp.x - st.camera.x) > 900 / zoom || Math.abs(rp.y - st.camera.y) > 700 / zoom) continue;
      entities.push({
        y: rp.y,
        draw: () => (rp.kind === 'rock' ? drawRock(ctx, toScreen(rp.x, rp.y), rp) : drawReed(ctx, toScreen(rp.x, rp.y), rp, st.time)),
      });
    }
    for (const c of CRYSTALS) entities.push({ y: c.y, draw: () => drawCrystal(ctx, toScreen(c.x, c.y), st.time, c.x) });
    for (const l of LANTERNS) entities.push({ y: l.y, draw: () => drawLantern(ctx, toScreen(l.x, l.y), st.time, l.x) });
    entities.push({ y: VALE_LANDMARKS.academyBuilding.y + VALE_LANDMARKS.academyBuilding.h / 2, draw: () => drawAcademy(ctx, toScreen, st.time) });
    entities.push({ y: VALE_LANDMARKS.moonmerePortal.y + 60, draw: () => drawPortal(ctx, toScreen(VALE_LANDMARKS.moonmerePortal.x, VALE_LANDMARKS.moonmerePortal.y), st.time) });

    for (const c of COLLECTIBLES) {
      if (sv.inventory.collectibles.includes(c.id)) continue;
      entities.push({ y: c.y, draw: () => drawCollectibleGlow(ctx, toScreen(c.x, c.y), st.time, '#d9b45c', c.x) });
    }
    if (sv.quests.mainQuest.state === 'active') {
      for (const f of STAR_FRAGMENTS) {
        if (sv.quests.mainQuest.foundFragmentIds.includes(f.id)) continue;
        entities.push({ y: f.y, draw: () => drawCollectibleGlow(ctx, toScreen(f.x, f.y), st.time, '#9fd9e0', f.x) });
      }
    }
    for (const n of NPCS) {
      entities.push({
        y: n.y,
        draw: () => {
          const p = toScreen(n.x, n.y);
          drawCharacter(ctx, p, {
            facing: 'down', moving: false,
            colors: { skin: '#e8c9a0', hair: n.color, top: n.color, bottom: '#4a4370', shoes: '#3a3350', eye: '#2a2333', hairStyle: '' },
          });
          drawNameTag(ctx, { x: p.x, y: p.y - 46 }, n.name);
        },
      });
    }

    entities.push({
      y: st.companion.y,
      draw: () => drawCompanionCanvas(ctx, toScreen(st.companion.x, st.companion.y), sv.companion, { t: st.time, moving: st.moving, phase: st.walkPhase }),
    });
    entities.push({
      y: st.y,
      draw: () => drawCharacter(ctx, toScreen(st.x, st.y), {
        facing: st.facing, moving: st.moving, walkPhase: st.walkPhase,
        emote: st.emote, emoteT: st.emoteT,
        colors: playerColors(sv),
      }),
    });

    entities.sort((a, b) => a.y - b.y);
    for (const e of entities) e.draw();
  }

  function drawEntities(ctx, toScreen, st) {
    const sv = saveRef.current;
    const entities = [];
    entities.push({
      y: st.companion.y,
      draw: () => drawCompanionCanvas(ctx, toScreen(st.companion.x, st.companion.y), sv.companion, { t: st.time, moving: st.moving, phase: st.walkPhase }),
    });
    entities.push({
      y: st.y,
      draw: () => drawCharacter(ctx, toScreen(st.x, st.y), {
        facing: st.facing, moving: st.moving, walkPhase: st.walkPhase,
        emote: st.emote, emoteT: st.emoteT,
        colors: playerColors(sv),
      }),
    });
    entities.sort((a, b) => a.y - b.y);
    for (const e of entities) e.draw();
  }

  // mobile joystick handlers
  const joyRef = useRef(null);
  const handleJoyStart = (e) => { e.preventDefault(); moveJoy(e); };
  const handleJoyMove = (e) => { if (e.buttons === undefined || e.touches || e.buttons === 1) moveJoy(e); };
  const handleJoyEnd = () => { stateRef.current.joyVec = { x: 0, y: 0 }; if (joyRef.current) joyRef.current.style.transform = 'translate(0px,0px)'; };
  function moveJoy(e) {
    const base = e.currentTarget.parentElement.getBoundingClientRect();
    const touch = e.touches ? e.touches[0] : e;
    let dx = touch.clientX - (base.left + base.width / 2);
    let dy = touch.clientY - (base.top + base.height / 2);
    const max = base.width / 2;
    const len = Math.hypot(dx, dy);
    if (len > max) { dx = (dx / len) * max; dy = (dy / len) * max; }
    stateRef.current.joyVec = { x: dx / max, y: dy / max };
    if (joyRef.current) joyRef.current.style.transform = `translate(${dx}px,${dy}px)`;
  }

  return (
    <div className="game-viewport" ref={containerRef}>
      <canvas ref={canvasRef} className="game-canvas" />
      {isMobile && (
        <>
          <div
            className="joystick-base"
            onTouchStart={handleJoyStart}
            onTouchMove={handleJoyMove}
            onTouchEnd={handleJoyEnd}
            onMouseDown={handleJoyStart}
            onMouseMove={handleJoyMove}
            onMouseUp={handleJoyEnd}
            onMouseLeave={handleJoyEnd}
          >
            <div className="joystick-knob" ref={joyRef} />
          </div>
          <button className="action-btn" onTouchStart={(e) => { e.preventDefault(); handleInteract(); }} onClick={handleInteract}>
            E
          </button>
        </>
      )}
    </div>
  );
}

function playerColors(save) {
  const p = save.player;
  const eq = save.equippedOutfit;
  return {
    skin: p.skinTone, hair: p.hairColor, eye: p.eyeColor, hairStyle: p.hairStyle,
    top: eq.topColor, bottom: eq.bottomColor, shoes: eq.shoesColor,
  };
}
