import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { buildHumanoid, animateHumanoid } from '../three/characterRig.js';

// Small self-contained 3D viewport (own renderer) that shows a live,
// auto-rotating preview of the avatar rig — used in character creation and
// the wardrobe, where clothing/appearance changes need to read instantly.
export default function AvatarPreview3D({ player, size = 220 }) {
  const mountRef = useRef(null);
  const stateRef = useRef({});

  useEffect(() => {
    const mount = mountRef.current;
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(2, window.devicePixelRatio || 1));
    renderer.setSize(size, size);
    mount.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(32, 1, 0.1, 20);
    // Framed to fit the whole figure (head to feet) with some headroom —
    // the rig's hips sit at y=0.92 and the head top lands around y=2.0,
    // so the vertical center of the body is well above the scene origin.
    camera.position.set(0, 1.3, 4.4);
    camera.lookAt(0, 1.2, 0);

    scene.add(new THREE.HemisphereLight('#e8e3ff', '#20304a', 0.9));
    const key = new THREE.DirectionalLight('#fff3d6', 0.9);
    key.position.set(2, 3, 2);
    scene.add(key);

    let rig = buildHumanoid(colorsOf(player));
    scene.add(rig.group);
    stateRef.current.rig = rig;
    stateRef.current.colors = colorsOf(player);

    let raf;
    let t = 0;
    function loop() {
      t += 0.016;
      rig.group.rotation.y = Math.sin(t * 0.5) * 0.5;
      animateHumanoid(rig, stateRef.current.anim || (stateRef.current.anim = {}), 0.016, false, false, null, 0);
      renderer.render(scene, camera);
      raf = requestAnimationFrame(loop);
    }
    raf = requestAnimationFrame(loop);

    stateRef.current.rebuild = (nextPlayer) => {
      scene.remove(rig.group);
      rig = buildHumanoid(colorsOf(nextPlayer));
      scene.add(rig.group);
      stateRef.current.rig = rig;
    };

    return () => {
      cancelAnimationFrame(raf);
      renderer.dispose();
      if (renderer.domElement.parentNode) renderer.domElement.parentNode.removeChild(renderer.domElement);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const colors = colorsOf(player);
    const prev = stateRef.current.colors;
    if (prev && JSON.stringify(prev) !== JSON.stringify(colors) && stateRef.current.rebuild) {
      stateRef.current.rebuild(player);
      stateRef.current.colors = colors;
    }
  }, [player]);

  return <div ref={mountRef} style={{ width: size, height: size }} />;
}

function colorsOf(player) {
  const eq = player.outfit || {};
  return {
    skin: player.skinTone, hair: player.hairColor, eye: player.eyeColor, hairStyle: player.hairStyle,
    top: eq.topColor, bottom: eq.bottomColor, shoes: eq.shoesColor,
  };
}
