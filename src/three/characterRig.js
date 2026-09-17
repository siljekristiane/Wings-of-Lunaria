import * as THREE from 'three';

// Builds a soft, capsule-based humanoid (no external model/rig — animated by
// rotating named joint groups each frame). Returns the root group plus a
// lookup of the joints an animator needs.
export function buildHumanoid(colors) {
  const { skin, hair, top, bottom, shoes, eye, hairStyle } = colors;
  const root = new THREE.Group();

  const skinMat = new THREE.MeshStandardMaterial({ color: skin, roughness: 0.8 });
  const hairMat = new THREE.MeshStandardMaterial({ color: hair, roughness: 0.7 });
  const topMat = new THREE.MeshStandardMaterial({ color: top, roughness: 0.85 });
  const bottomMat = new THREE.MeshStandardMaterial({ color: bottom, roughness: 0.85 });
  const shoesMat = new THREE.MeshStandardMaterial({ color: shoes, roughness: 0.6 });
  const eyeMat = new THREE.MeshStandardMaterial({ color: eye, emissive: eye, emissiveIntensity: 0.15 });
  const darkMat = new THREE.MeshStandardMaterial({ color: '#2a2333' });

  const hips = new THREE.Group();
  hips.position.y = 0.92;
  root.add(hips);

  // torso
  const torso = new THREE.Mesh(new THREE.CapsuleGeometry(0.22, 0.34, 3, 8), topMat);
  torso.position.y = 0.34;
  torso.castShadow = true;
  hips.add(torso);

  // head group (neck up)
  const head = new THREE.Group();
  head.position.y = 0.62;
  hips.add(head);

  const headMesh = new THREE.Mesh(new THREE.SphereGeometry(0.16, 16, 12), skinMat);
  headMesh.castShadow = true;
  head.add(headMesh);

  const eyeL = new THREE.Mesh(new THREE.SphereGeometry(0.02, 8, 6), eyeMat);
  eyeL.position.set(-0.06, 0.01, 0.145);
  head.add(eyeL);
  const eyeR = eyeL.clone();
  eyeR.position.x = 0.06;
  head.add(eyeR);

  const browGeo = new THREE.BoxGeometry(0.045, 0.012, 0.012);
  const browL = new THREE.Mesh(browGeo, darkMat);
  browL.position.set(-0.06, 0.06, 0.15);
  head.add(browL);
  const browR = browL.clone();
  browR.position.x = 0.06;
  head.add(browR);

  const mouth = new THREE.Mesh(new THREE.TorusGeometry(0.03, 0.006, 6, 10, Math.PI), darkMat);
  mouth.position.set(0, -0.06, 0.15);
  mouth.rotation.z = Math.PI;
  head.add(mouth);

  // hair (varies loosely by style)
  let hairMesh;
  if (hairStyle && hairStyle.includes('Kort')) {
    hairMesh = new THREE.Mesh(new THREE.SphereGeometry(0.168, 14, 10, 0, Math.PI * 2, 0, Math.PI * 0.62), hairMat);
    hairMesh.position.y = 0.015;
  } else if (hairStyle && hairStyle.includes('Krøll')) {
    hairMesh = new THREE.Group();
    for (let i = 0; i < 6; i++) {
      const puff = new THREE.Mesh(new THREE.SphereGeometry(0.055, 8, 6), hairMat);
      const a = (i / 6) * Math.PI * 2;
      puff.position.set(Math.cos(a) * 0.1, 0.09 + Math.sin(a * 2) * 0.02, Math.sin(a) * 0.1);
      hairMesh.add(puff);
    }
  } else {
    // long / braided / ponytail: sphere cap + back drape
    hairMesh = new THREE.Group();
    const cap = new THREE.Mesh(new THREE.SphereGeometry(0.166, 14, 10, 0, Math.PI * 2, 0, Math.PI * 0.55), hairMat);
    cap.position.y = 0.02;
    hairMesh.add(cap);
    const drape = new THREE.Mesh(new THREE.CapsuleGeometry(0.09, 0.22, 2, 8), hairMat);
    drape.position.set(0, -0.14, -0.08);
    hairMesh.add(drape);
  }
  head.add(hairMesh);

  // arms (pivot at shoulder)
  function buildArm(side) {
    const arm = new THREE.Group();
    arm.position.set(side * 0.26, 0.5, 0);
    const upper = new THREE.Mesh(new THREE.CapsuleGeometry(0.05, 0.28, 2, 6), topMat);
    upper.position.y = -0.16;
    upper.castShadow = true;
    arm.add(upper);
    const hand = new THREE.Mesh(new THREE.SphereGeometry(0.045, 8, 6), skinMat);
    hand.position.y = -0.32;
    arm.add(hand);
    hips.add(arm);
    return arm;
  }
  const armL = buildArm(-1);
  const armR = buildArm(1);

  // legs (pivot at hip)
  function buildLeg(side) {
    const leg = new THREE.Group();
    leg.position.set(side * 0.1, 0.02, 0);
    const upper = new THREE.Mesh(new THREE.CapsuleGeometry(0.06, 0.3, 2, 6), bottomMat);
    upper.position.y = -0.17;
    upper.castShadow = true;
    leg.add(upper);
    const shoe = new THREE.Mesh(new THREE.BoxGeometry(0.09, 0.06, 0.15), shoesMat);
    shoe.position.set(0, -0.35, 0.03);
    leg.add(shoe);
    hips.add(leg);
    return leg;
  }
  const legL = buildLeg(-1);
  const legR = buildLeg(1);

  return {
    group: root,
    parts: { hips, torso, head, armL, armR, legL, legR, eyeL, eyeR },
    materials: { skinMat, hairMat, topMat, bottomMat, shoesMat },
  };
}

// Drives idle/walk/run/emote poses each frame. `state` carries per-instance
// timers so multiple rig instances can share this one animator function.
export function animateHumanoid(rig, state, dt, moving, running, emote, emoteT) {
  const { hips, torso, head, armL, armR, legL, legR, eyeL, eyeR } = rig.parts;
  state.walkPhase = (state.walkPhase || 0) + dt * (running ? 9 : 5.6) * (moving ? 1 : 0);
  state.idleT = (state.idleT || 0) + dt;
  state.blinkT = (state.blinkT || 0) + dt;

  const breathe = Math.sin(state.idleT * 1.6) * 0.015;
  hips.position.y = 0.92 + (moving ? Math.abs(Math.sin(state.walkPhase)) * 0.03 : breathe);

  if (!emote) {
    const swing = moving ? Math.sin(state.walkPhase) * (running ? 0.9 : 0.6) : Math.sin(state.idleT * 0.9) * 0.03;
    armL.rotation.x = swing;
    armR.rotation.x = -swing;
    legL.rotation.x = moving ? -Math.sin(state.walkPhase) * (running ? 0.8 : 0.55) : 0;
    legR.rotation.x = moving ? Math.sin(state.walkPhase) * (running ? 0.8 : 0.55) : 0;
    armL.rotation.z = 0.06;
    armR.rotation.z = -0.06;
    torso.rotation.y = moving ? Math.sin(state.walkPhase) * 0.06 : Math.sin(state.idleT * 0.5) * 0.02;
    head.rotation.y = moving ? 0 : Math.sin(state.idleT * 0.35) * 0.18;
    hips.position.y += 0; // (breathe already applied above)
  } else if (emote === 'wave') {
    legL.rotation.x = 0; legR.rotation.x = 0; torso.rotation.y = 0;
    armL.rotation.x = 0.1;
    armR.rotation.z = -2.1;
    armR.rotation.x = Math.sin(emoteT * 9) * 0.5;
    head.rotation.y = -0.2;
  } else if (emote === 'cheer') {
    legL.rotation.x = 0; legR.rotation.x = 0;
    const jump = Math.abs(Math.sin(emoteT * 6));
    hips.position.y = 0.92 + jump * 0.16;
    armL.rotation.z = 2.6; armR.rotation.z = -2.6;
    armL.rotation.x = 0; armR.rotation.x = 0;
    head.rotation.y = 0;
    torso.rotation.y = 0;
  } else if (emote === 'thanks') {
    legL.rotation.x = 0; legR.rotation.x = 0;
    const bow = Math.min(1, emoteT * 2.2) * Math.max(0, 1 - Math.max(0, emoteT - 1.1) * 1.4);
    hips.rotation.x = bow * 0.5;
    armR.rotation.x = -1.3 * bow;
    armR.rotation.z = -0.5 * bow;
    armL.rotation.x = 0.1;
    torso.rotation.y = 0;
    head.rotation.y = 0;
    if (bow < 0.02) hips.rotation.x = 0;
  }

  // gentle blink
  if (state.blinkT > 3.2) {
    const bp = state.blinkT - 3.2;
    const closed = bp < 0.12 || (bp > 0.16 && bp < 0.2);
    eyeL.scale.y = closed ? 0.1 : 1;
    eyeR.scale.y = closed ? 0.1 : 1;
    if (bp > 0.24) state.blinkT = 0;
  }
}
