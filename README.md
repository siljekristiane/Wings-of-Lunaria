# Wings of Lunaria

A playable browser prototype of an original fantasy adventure game, rendered
in real 3D with Three.js. You are a Wingkeeper exploring the magical valley
of Asterwyn Vale together with a personal companion creature — focused on
exploration, friendship, gentle quests and self-expression rather than
combat or competition.

## Running it

```bash
npm install
npm run dev
```

Open the printed local URL. `npm run build` produces a production build in `dist/`.

## What's here

- Three-step character & companion creator with a live-rotating 3D preview
- A genuinely 3D, procedurally-terrained Asterwyn Vale — hash-based height
  noise streamed in tiles around the player, so it's seamless with no
  visible edges and unbounded once you walk past the authored content
- A river with an animated surface and moonlight reflections, a bridge with
  jittered planks, dirt paths, trees/rocks/crystals/lanterns/flowers, a
  locked Moonmere portal, and the path toward Whisperwood
- Third-person orbit camera (drag with mouse/touch to rotate) with four
  selectable modes and an adjustable distance slider, plus a day-night
  lighting cycle, ground fog, aurora, and shooting stars
- Procedurally-animated 3D avatar, four companion species, and NPCs
  (Headkeeper Elowen, Mira Vale, Rowan Thale) with dialogue
- A complete quest, "Det falmede stjernekartet" (find 3 star fragments and
  return them to Elowen for a reward)
- Physical collectibles, a backpack, a journal (map/quests/clues/collection
  log/notes), and a wardrobe reached via the mirror or closet in your room
  inside Asterwyn Academy — all as UI overlays on top of the 3D scene
- A radial emote menu (wave / cheer / thank you) with animated 3D poses
- Progress, appearance, and 3D position/rotation/camera are saved to
  `localStorage` and restored on reload

## What's simulated vs. fully interactive

Everything listed above is fully interactive and playable in real 3D —
movement, collision, camera orbiting, dialogue, the quest, the wardrobe, the
journal/backpack, saving, and the emote menu all work end to end.

A few things are deliberately simplified rather than faked as more than they
are:

- **Characters** (avatar/companions/NPCs) are built from primitive 3D shapes
  (capsules/spheres/boxes) in a jointed hierarchy, animated by code — not
  true GLTF skeletal animation with blend trees, since there's no
  model-authoring pipeline available here to make rigged character models.
- **Materials** are solid-shaded/procedural rather than normal/roughness-map
  PBR textures.
- **Water and fog** are animated planes/sprites, not volumetric raymarching
  or real planar reflections — a soft "moonlight glint" streak stands in for
  a true reflection.
- **Shadow mapping is off on purpose.** A moving sun with a live shadow
  camera over this much scattered geometry is the single most expensive
  thing a scene like this can do, especially on mobile GPUs — depth reads
  instead from vertex-color ground shading and emissive glow accents, a
  "baked lighting" stand-in per the brief's own optimization notes. Point
  lights were likewise removed from purely decorative objects (crystals,
  lanterns, collectibles) in favor of emissive materials, keeping the visual
  glow without the per-light rendering cost.
- The journal's map is a stylized 2D overview (not a live 3D minimap render).
