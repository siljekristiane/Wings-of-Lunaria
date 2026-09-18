// A named-zone map of Asterwyn Vale, kept separate from the landmark/prop
// data in gameData.js. Nothing in the game currently *reads* this file —
// it exists so future systems (zone-scoped weather, spawn rules, quest
// triggers, a minimap overlay) have one place to ask "what zone is the
// player standing in" instead of re-deriving landmark math each time.
//
// Bounds are expressed in the same meter-scale world units as the 3D scene
// (i.e. already run through scale.js's sx()), matching how player/NPC
// positions are tracked everywhere else in the 3D code.
import { VALE_LANDMARKS } from './gameData.js';
import { sx } from '../three/scale.js';

export const ZONES = [
  {
    id: 'academyZone',
    name: 'Asterwyn Academy',
    status: 'active',
    shape: 'box',
    x: sx(VALE_LANDMARKS.academyBuilding.x), z: sx(VALE_LANDMARKS.academyBuilding.y),
    hw: sx(VALE_LANDMARKS.academyBuilding.w) / 2 + sx(60), hh: sx(VALE_LANDMARKS.academyBuilding.h) / 2 + sx(60),
  },
  {
    id: 'friendshipSquare',
    name: 'Friendship Square',
    status: 'active',
    shape: 'circle',
    x: sx(VALE_LANDMARKS.friendshipSquare.x), z: sx(VALE_LANDMARKS.friendshipSquare.y),
    r: sx(VALE_LANDMARKS.friendshipSquare.r) + sx(60),
  },
  {
    id: 'riverZone',
    name: 'The Silverwind River',
    status: 'active',
    shape: 'polyline',
    points: VALE_LANDMARKS.river.points.map(([x, z]) => [sx(x), sx(z)]),
    width: sx(VALE_LANDMARKS.river.width) + sx(70),
  },
  {
    id: 'whisperwoodEntrance',
    name: 'Whisperwood Entrance',
    status: 'future', // path exists and is walkable; no content beyond it yet
    shape: 'circle',
    x: sx(VALE_LANDMARKS.whisperwoodPath.x), z: sx(VALE_LANDMARKS.whisperwoodPath.y),
    r: sx(220),
  },
  {
    id: 'moonmerePortalZone',
    name: 'Moonmere Portal',
    status: 'locked', // visible landmark, deliberately unopenable for now
    shape: 'circle',
    x: sx(VALE_LANDMARKS.moonmerePortal.x), z: sx(VALE_LANDMARKS.moonmerePortal.y),
    r: sx(180),
  },
  {
    id: 'futureForestExpansion',
    name: 'The Far Wilds',
    status: 'future', // procedurally generated terrain/forest already reaches here; reserved for future authored content
    shape: 'ring',
    x: 0, z: 0,
    rMin: sx(2200),
  },
  {
    id: 'asterwynValeCore',
    name: 'Asterwyn Vale',
    status: 'active', // fallback zone: the walkable meadow that isn't inside any of the more specific zones above
    shape: 'ring',
    x: 0, z: 0,
    rMin: 0,
  },
];

function inBox(x, z, zone) {
  return Math.abs(x - zone.x) <= zone.hw && Math.abs(z - zone.z) <= zone.hh;
}

function inCircle(x, z, zone) {
  return Math.hypot(x - zone.x, z - zone.z) <= zone.r;
}

function inPolyline(x, z, zone) {
  for (let i = 0; i < zone.points.length - 1; i++) {
    const [x1, z1] = zone.points[i];
    const [x2, z2] = zone.points[i + 1];
    if (x < Math.min(x1, x2) || x > Math.max(x1, x2)) continue;
    const t = (x - x1) / ((x2 - x1) || 1);
    const zLine = z1 + (z2 - z1) * t;
    if (Math.abs(z - zLine) <= zone.width / 2) return true;
  }
  return false;
}

// Returns the most specific named zone a world position (in meters) falls
// in, or the vale-core fallback if it matches nothing more specific.
export function zoneAt(x, z) {
  for (const zone of ZONES) {
    if (zone.shape === 'box' && inBox(x, z, zone)) return zone;
    if (zone.shape === 'circle' && inCircle(x, z, zone)) return zone;
    if (zone.shape === 'polyline' && inPolyline(x, z, zone)) return zone;
    if (zone.id === 'futureForestExpansion' && Math.hypot(x - zone.x, z - zone.z) >= zone.rMin) return zone;
  }
  return ZONES.find((z2) => z2.id === 'asterwynValeCore');
}
