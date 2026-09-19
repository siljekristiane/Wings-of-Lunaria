import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { buildCompanion, animateCompanion } from '../three/companionRig.js';

export default function CompanionPreview3D({ companion, size = 200 }) {
  const mountRef = useRef(null);
  const stateRef = useRef({});

  useEffect(() => {
    const mount = mountRef.current;
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(2, window.devicePixelRatio || 1));
    renderer.setSize(size, size);
    mount.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(34, 1, 0.1, 20);
    // Companions now stand on legs (raising their whole silhouette by that
    // leg height), so the old low lookAt/camera pitch mostly showed the
    // top of their backs — pulled back and leveled out for a proper
    // three-quarter side view of the whole animal.
    camera.position.set(1.3, 0.6, 0.95);
    camera.lookAt(0, 0.32, 0);

    scene.add(new THREE.HemisphereLight('#e8e3ff', '#20304a', 0.9));
    const key = new THREE.DirectionalLight('#fff3d6', 0.8);
    key.position.set(2, 3, 2);
    scene.add(key);
    const fill = new THREE.DirectionalLight('#8fa0d9', 0.3);
    fill.position.set(-1.5, 1, -1.2);
    scene.add(fill);

    let rig = buildCompanion(companion.type, companion);
    scene.add(rig.group);
    stateRef.current.rig = rig;
    stateRef.current.sig = sigOf(companion);

    let raf;
    let t = 0;
    function loop() {
      t += 0.016;
      rig.group.rotation.y = Math.sin(t * 0.5) * 0.6;
      animateCompanion(rig, stateRef.current.anim || (stateRef.current.anim = {}), 0.016, false, t);
      renderer.render(scene, camera);
      raf = requestAnimationFrame(loop);
    }
    raf = requestAnimationFrame(loop);

    stateRef.current.rebuild = (next) => {
      scene.remove(rig.group);
      rig = buildCompanion(next.type, next);
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
    const sig = sigOf(companion);
    if (stateRef.current.sig !== sig && stateRef.current.rebuild) {
      stateRef.current.rebuild(companion);
      stateRef.current.sig = sig;
    }
  }, [companion]);

  return <div ref={mountRef} style={{ width: size, height: size }} />;
}

function sigOf(c) {
  return `${c.type}|${c.color}|${c.eyeColor}|${c.glow}|${c.accessory}`;
}
