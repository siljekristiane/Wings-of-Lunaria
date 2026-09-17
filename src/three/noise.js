// Deterministic hash-based value noise (no external noise library) used for
// procedural terrain height so tiles generated independently still line up
// seamlessly — the same world (x,z) always yields the same height.
function hash(x, y) {
  const s = Math.sin(x * 127.1 + y * 311.7) * 43758.5453123;
  return s - Math.floor(s);
}

function smooth(t) {
  return t * t * (3 - 2 * t);
}

function noise2D(x, y) {
  const x0 = Math.floor(x), y0 = Math.floor(y);
  const x1 = x0 + 1, y1 = y0 + 1;
  const sx = smooth(x - x0), sy = smooth(y - y0);
  const n00 = hash(x0, y0), n10 = hash(x1, y0), n01 = hash(x0, y1), n11 = hash(x1, y1);
  const ix0 = n00 + (n10 - n00) * sx;
  const ix1 = n01 + (n11 - n01) * sx;
  return ix0 + (ix1 - ix0) * sy;
}

function fbm(x, y, octaves = 5) {
  let total = 0, amp = 0.5, freq = 1, max = 0;
  for (let i = 0; i < octaves; i++) {
    total += noise2D(x * freq, y * freq) * amp;
    max += amp;
    amp *= 0.5;
    freq *= 2;
  }
  return total / max;
}

// World height at (x,z), in meter-scale 3D world units. Flattened near the
// origin (the vale's landmarks) and rolling into natural hills/valleys
// further out — genuinely infinite since it's a pure function of position.
export function heightAt(x, z) {
  const dist = Math.hypot(x, z);
  const flatten = Math.min(1, Math.max(0, (dist - 16) / 22));
  const base = fbm(x * 0.05, z * 0.05, 5);
  const ridges = fbm(x * 0.16 + 500, z * 0.16 + 500, 3);
  return ((base - 0.5) * 9 + (ridges - 0.5) * 1.6) * flatten;
}
