import * as THREE from 'three';

// A richer gradient ramp for MeshToonMaterial — more steps than a classic
// flat 2-3 band cel shader, and tinted (cool in shadow, warm at the
// highlight) rather than a plain grayscale ramp. This is deliberately a
// blend of "flat stylized" and "smooth PBR": still reads as a designed
// look with clear light/shadow shapes, but with enough steps and color
// temperature shift that it has real depth instead of two flat slabs.
let sharedGradientMap = null;
export function toonGradientMap() {
  if (sharedGradientMap) return sharedGradientMap;
  const canvas = document.createElement('canvas');
  canvas.width = 8; canvas.height = 1;
  const ctx = canvas.getContext('2d');
  const steps = ['#2f3550', '#4a4e68', '#6b6478', '#8f7f80', '#b89a86', '#d9bd9a', '#f0dcb8', '#fff6df'];
  for (let i = 0; i < steps.length; i++) {
    ctx.fillStyle = steps[i];
    ctx.fillRect(i, 0, 1, 1);
  }
  const tex = new THREE.CanvasTexture(canvas);
  tex.minFilter = THREE.NearestFilter;
  tex.magFilter = THREE.NearestFilter;
  sharedGradientMap = tex;
  return tex;
}

export function toonMat(color, extra = {}) {
  return new THREE.MeshToonMaterial({ color, gradientMap: toonGradientMap(), ...extra });
}

// A soft dark ellipse for grounding non-character props (trees, rocks)
// the same way buildContactShadow does for characters — cheap depth cue
// without real shadow mapping.
export function buildPropShadow(radius, opacity = 0.28) {
  const geo = new THREE.CircleGeometry(radius, 12);
  const mat = new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity, depthWrite: false });
  const mesh = new THREE.Mesh(geo, mat);
  mesh.rotation.x = -Math.PI / 2;
  return mesh;
}
