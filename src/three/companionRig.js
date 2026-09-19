import * as THREE from 'three';

// Four distinct original companion species, each built from simple smooth
// primitives so they read as different creatures at a glance.
export function buildCompanion(type, colors) {
  const { color, eyeColor, glow } = colors;
  const bodyMat = new THREE.MeshStandardMaterial({ color, roughness: 0.75 });
  const eyeMat = new THREE.MeshStandardMaterial({ color: eyeColor, emissive: eyeColor, emissiveIntensity: 0.3 });
  const glowMat = new THREE.MeshBasicMaterial({ color: glow, transparent: true, opacity: 0.16 });

  const root = new THREE.Group();
  const bob = new THREE.Group();
  root.add(bob);

  // Centered a little higher than the old legless bodies sat, so it reads
  // as an aura around the creature's core rather than a glowing egg
  // floating between its feet now that legs raise the whole silhouette.
  const light = new THREE.PointLight(glow, 0.6, 2.2);
  light.position.y = 0.32;
  bob.add(light);

  const glowSphere = new THREE.Mesh(new THREE.SphereGeometry(0.2, 12, 10), glowMat);
  glowSphere.position.y = 0.32;
  bob.add(glowSphere);

  let tail = null;
  let earL = null, earR = null;
  let wingL = null, wingR = null;
  let legs = null;
  let movement = 'walk';

  // Four simple pivoting legs so the ground-dwelling species actually
  // plant their feet and walk rather than hovering with an empty gap
  // between their body and the terrain. An optional paw material gives
  // dark "sock" feet (foxes, wolves) instead of matching the body color.
  function buildLegs(legRadius, legLen, spanX, spanZ, pawMat) {
    const list = [];
    for (const lx of [spanX, -spanX]) {
      for (const lz of [spanZ, -spanZ]) {
        const pivot = new THREE.Group();
        pivot.position.set(lx, legLen, lz);
        const legMesh = new THREE.Mesh(new THREE.CapsuleGeometry(legRadius, legLen * 0.55, 2, 6), bodyMat);
        legMesh.position.y = -legLen / 2;
        pivot.add(legMesh);
        if (pawMat) {
          const paw = new THREE.Mesh(new THREE.SphereGeometry(legRadius * 1.15, 8, 6), pawMat);
          paw.position.y = -legLen + legRadius * 0.4;
          pivot.add(paw);
        }
        bob.add(pivot);
        list.push(pivot);
      }
    }
    return { frontL: list[0], frontR: list[1], backL: list[2], backR: list[3] };
  }

  if (type === 'lysrev') {
    // A classic red fox palette: cream/white chest, muzzle and tail-tip
    // against the orange coat, with dark "socks" — the markings that
    // actually make a fox read as a fox rather than a generic orange blob.
    const creamMat = new THREE.MeshStandardMaterial({ color: '#fdf3e0', roughness: 0.8 });
    const darkMat = new THREE.MeshStandardMaterial({ color: '#2b2420', roughness: 0.7 });
    const noseMat = new THREE.MeshStandardMaterial({ color: '#1c1815', roughness: 0.5 });
    const LH = 0.16; // leg height — everything else sits this much higher, on top of the legs
    legs = buildLegs(0.035, LH, 0.13, 0.09, darkMat);
    const body = new THREE.Mesh(new THREE.CapsuleGeometry(0.15, 0.22, 3, 8), bodyMat);
    body.rotation.z = Math.PI / 2;
    body.position.y = 0.18 + LH;
    bob.add(body);
    // cream chest/belly patch along the underside
    const belly = new THREE.Mesh(new THREE.SphereGeometry(0.13, 10, 8), creamMat);
    belly.scale.set(1.1, 0.75, 0.72);
    belly.position.set(0.02, 0.1 + LH, 0);
    bob.add(belly);
    const head = new THREE.Mesh(new THREE.SphereGeometry(0.14, 12, 10), bodyMat);
    head.position.set(0.24, 0.25 + LH, 0);
    bob.add(head);
    // cream muzzle wrapping the lower half of the face
    const muzzle = new THREE.Mesh(new THREE.SphereGeometry(0.1, 10, 8), creamMat);
    muzzle.scale.set(1.2, 0.85, 0.9);
    muzzle.position.set(0.33, 0.21 + LH, 0);
    bob.add(muzzle);
    const snout = new THREE.Mesh(new THREE.ConeGeometry(0.045, 0.1, 8), creamMat);
    snout.rotation.z = -Math.PI / 2;
    snout.position.set(0.4, 0.22 + LH, 0);
    bob.add(snout);
    const nose = new THREE.Mesh(new THREE.SphereGeometry(0.022, 8, 6), noseMat);
    nose.position.set(0.45, 0.22 + LH, 0);
    bob.add(nose);
    // two-tone ears: orange outer cone, small cream inner cone facing forward
    earL = new THREE.Group();
    earL.position.set(0.2, 0.38 + LH, 0.075);
    const earOuterL = new THREE.Mesh(new THREE.ConeGeometry(0.06, 0.15, 8), bodyMat);
    earL.add(earOuterL);
    const earInnerL = new THREE.Mesh(new THREE.ConeGeometry(0.032, 0.09, 8), creamMat);
    earInnerL.position.set(0.008, -0.02, 0.02);
    earL.add(earInnerL);
    bob.add(earL);
    earR = earL.clone(true);
    earR.position.z = -0.075;
    earR.children[1].position.z = -0.02;
    bob.add(earR);
    // big, bushy white-tipped tail
    tail = new THREE.Group(); tail.position.set(-0.23, 0.22 + LH, 0); bob.add(tail);
    const tailMesh = new THREE.Mesh(new THREE.CapsuleGeometry(0.1, 0.24, 2, 8), bodyMat);
    tailMesh.rotation.z = Math.PI / 2.9;
    tailMesh.position.set(-0.1, 0.1, 0);
    tail.add(tailMesh);
    const tailTip = new THREE.Mesh(new THREE.SphereGeometry(0.095, 10, 8), creamMat);
    tailTip.position.set(-0.22, 0.24, 0);
    tail.add(tailTip);
    const eyeL = new THREE.Mesh(new THREE.SphereGeometry(0.02, 6, 6), eyeMat);
    eyeL.position.set(0.33, 0.29 + LH, 0.065); bob.add(eyeL);
    const eyeR = eyeL.clone(); eyeR.position.z = -0.065; bob.add(eyeR);
  } else if (type === 'skykatt') {
    const LH = 0.14;
    legs = buildLegs(0.035, LH, 0.13, 0.1);
    const body = new THREE.Mesh(new THREE.SphereGeometry(0.2, 14, 10), bodyMat);
    body.position.y = 0.2 + LH; bob.add(body);
    const head = new THREE.Mesh(new THREE.SphereGeometry(0.14, 12, 10), bodyMat);
    head.position.set(0.2, 0.28 + LH, 0); bob.add(head);
    earL = new THREE.Mesh(new THREE.ConeGeometry(0.05, 0.09, 6), bodyMat);
    earL.position.set(0.16, 0.4 + LH, 0.07); bob.add(earL);
    earR = earL.clone(); earR.position.z = -0.07; bob.add(earR);
    tail = new THREE.Group(); tail.position.set(-0.2, 0.22 + LH, 0); bob.add(tail);
    const tailMesh = new THREE.Mesh(new THREE.CapsuleGeometry(0.05, 0.26, 2, 8), bodyMat);
    tailMesh.rotation.z = Math.PI / 2.4;
    tail.add(tailMesh);
    for (let i = 0; i < 3; i++) {
      const puff = new THREE.Mesh(new THREE.SphereGeometry(0.07, 8, 6), new THREE.MeshStandardMaterial({ color: '#eef0f7', transparent: true, opacity: 0.75 }));
      puff.position.set(-0.1 + i * 0.1, 0.42 + LH + (i % 2) * 0.03, 0);
      bob.add(puff);
    }
    const eyeL = new THREE.Mesh(new THREE.SphereGeometry(0.02, 6, 6), eyeMat);
    eyeL.position.set(0.3, 0.3 + LH, 0.06); bob.add(eyeL);
    const eyeR = eyeL.clone(); eyeR.position.z = -0.06; bob.add(eyeR);
  } else if (type === 'maaneulv') {
    const LH = 0.19;
    legs = buildLegs(0.04, LH, 0.15, 0.1);
    const body = new THREE.Mesh(new THREE.CapsuleGeometry(0.17, 0.26, 3, 8), bodyMat);
    body.rotation.z = Math.PI / 2;
    body.position.y = 0.2 + LH; bob.add(body);
    const head = new THREE.Mesh(new THREE.SphereGeometry(0.135, 12, 10), bodyMat);
    head.position.set(0.26, 0.26 + LH, 0); bob.add(head);
    earL = new THREE.Mesh(new THREE.ConeGeometry(0.055, 0.14, 8), bodyMat);
    earL.position.set(0.22, 0.4 + LH, 0.06); bob.add(earL);
    earR = earL.clone(); earR.position.z = -0.06; bob.add(earR);
    tail = new THREE.Group(); tail.position.set(-0.24, 0.22 + LH, 0); bob.add(tail);
    const tailMesh = new THREE.Mesh(new THREE.CapsuleGeometry(0.07, 0.24, 2, 8), bodyMat);
    tailMesh.rotation.z = Math.PI / 3;
    tail.add(tailMesh);
    const eyeL = new THREE.Mesh(new THREE.SphereGeometry(0.02, 6, 6), eyeMat);
    eyeL.position.set(0.35, 0.28 + LH, 0.06); bob.add(eyeL);
    const eyeR = eyeL.clone(); eyeR.position.z = -0.06; bob.add(eyeR);
  } else {
    // stjernedrage
    movement = 'float';
    const body = new THREE.Mesh(new THREE.CapsuleGeometry(0.13, 0.2, 3, 8), bodyMat);
    body.rotation.z = Math.PI / 2;
    body.position.y = 0.3; bob.add(body);
    const head = new THREE.Mesh(new THREE.SphereGeometry(0.1, 12, 10), bodyMat);
    head.position.set(0.2, 0.35, 0); bob.add(head);
    wingL = new THREE.Group(); wingL.position.set(-0.02, 0.36, 0.1); bob.add(wingL);
    const wingMeshL = new THREE.Mesh(new THREE.ConeGeometry(0.16, 0.05, 3), bodyMat);
    wingMeshL.rotation.set(Math.PI / 2, 0, Math.PI / 2);
    wingMeshL.position.x = 0.12;
    wingL.add(wingMeshL);
    wingR = new THREE.Group(); wingR.position.set(-0.02, 0.36, -0.1); bob.add(wingR);
    const wingMeshR = wingMeshL.clone(); wingR.add(wingMeshR);
    tail = new THREE.Group(); tail.position.set(-0.16, 0.3, 0); bob.add(tail);
    const tailMesh = new THREE.Mesh(new THREE.ConeGeometry(0.04, 0.22, 6), bodyMat);
    tailMesh.rotation.z = Math.PI / 2;
    tailMesh.position.x = -0.1;
    tail.add(tailMesh);
    const eyeL = new THREE.Mesh(new THREE.SphereGeometry(0.016, 6, 6), eyeMat);
    eyeL.position.set(0.27, 0.37, 0.05); bob.add(eyeL);
    const eyeR = eyeL.clone(); eyeR.position.z = -0.05; bob.add(eyeR);
  }

  return { group: root, bob, parts: { tail, earL, earR, wingL, wingR, legs }, movement };
}

export function animateCompanion(rig, state, dt, moving, t) {
  state.phase = (state.phase || 0) + dt * (moving ? 6 : 2);
  const { bob, parts, movement } = rig;
  if (parts.legs) {
    // diagonal trot: front-left+back-right swing together, opposite the
    // other diagonal pair — the standard walk gait for a four-legged gait
    const swing = moving ? Math.sin(state.phase) * 0.5 : Math.sin(t * 1.1) * 0.04;
    parts.legs.frontL.rotation.x = swing;
    parts.legs.backR.rotation.x = swing;
    parts.legs.frontR.rotation.x = -swing;
    parts.legs.backL.rotation.x = -swing;
  }
  if (movement === 'float') {
    bob.position.y = 0.15 + Math.sin(t * 1.8) * 0.08;
    if (parts.wingL) { parts.wingL.rotation.z = Math.sin(t * 12) * 0.5; parts.wingR.rotation.z = -Math.sin(t * 12) * 0.5; }
  } else {
    bob.position.y = moving ? Math.abs(Math.sin(state.phase)) * 0.06 : Math.sin(t * 1.4) * 0.02;
  }
  if (parts.tail) parts.tail.rotation.y = Math.sin(t * (moving ? 5 : 2)) * 0.4;
  if (parts.earL) {
    const twitch = Math.sin(t * 0.7) > 0.92 ? 0.3 : 0;
    parts.earL.rotation.z = twitch;
    parts.earR.rotation.z = -twitch;
  }
}
