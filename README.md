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
- Real 3D grass: tapered, gently curved blade geometry (not flat sprites)
  instanced per terrain tile and swayed by a vertex-shader wind, streamed in
  a pooled grid around the player so exploring never leaks GPU buffers
- Three tree kinds (round/oak, tall/pine, slender pale-trunked birch) with
  hue-jittered canopy materials, an open meadow near the vale's core that
  thickens into denser forest toward the map's edges, plus bush/fern
  undergrowth and stump/moss/root/fallen-branch/leaf-pile clutter clustered
  near the trees, a few hand-placed benches, and two original signposts
- A river with an animated surface, a real shallow-bank/deep-center colour
  gradient (via vertex colors, not a flat fill), and a curved foam strip
  that hugs each bank and follows the river's own bends; a bridge with
  jittered planks, handrails, and four small corner lamps; dirt paths whose
  lanterns walk the path centerline and sit just off the walkable edge
  (never on a path or the bridge deck itself); trees/rocks/crystals/flowers;
  a locked Moonmere portal; and the path toward Whisperwood
- Examine interactions (press E) on lanterns, flower patches, benches and
  signposts give short atmospheric text instead of a reward — alongside the
  existing crystal/portal/sign examine points
- Third-person orbit camera (drag with mouse/touch to rotate) with four
  selectable modes and an adjustable distance slider, plus a day-night
  lighting cycle (~20 minutes of daylight, ~20 of night), drifting clouds,
  occasional rain showers, ground fog, aurora, and shooting stars
- Procedurally-animated 3D avatar (now with a proper neck, subtly pointed
  ears, and correct foot-to-ground placement backed by a contact shadow),
  four companion species, and NPCs (Headkeeper Elowen, Mira Vale, Rowan
  Thale) with dialogue
- A complete quest, "Det falmede stjernekartet" (find 3 star fragments and
  return them to Elowen for a reward), described in a modular
  id/description/steps/rewards shape ready for future quests to be added
  alongside it
- Physical collectibles, a backpack, a journal (map/quests/clues/collection
  log/notes), and a wardrobe reached via the mirror or closet in your room
  inside Asterwyn Academy — all as UI overlays on top of the 3D scene
- A radial emote menu (wave / cheer / thank you) with animated 3D poses
- Progress, appearance, and 3D position/rotation/camera are saved to
  `localStorage` and restored on reload

## What's simulated vs. fully interactive

Everything listed above is fully interactive and playable in real 3D —
movement, collision, camera orbiting, dialogue, the quest, the wardrobe, the
journal/backpack, saving, weather, and the emote menu all work end to end.

A few things are deliberately simplified rather than faked as more than they
are:

- **Characters** (avatar/companions/NPCs) are built from primitive 3D shapes
  (capsules/spheres/boxes) in a jointed hierarchy, animated by code — not
  true GLTF skeletal animation with blend trees, since there's no
  model-authoring pipeline available here to make rigged character models.
- **Materials** are solid-shaded/procedural rather than normal/roughness-map
  PBR textures.
- **Water** has a real shallow/deep vertex-color gradient and a curved
  foam strip along each bank, but no true planar reflection or normal-map
  ripples — a soft "moonlight glint" streak stands in for reflecting the
  sky/trees/lanterns, and rain doesn't leave ripple rings on the surface.
- **Clouds and fog** are animated puff-clusters/sprites, not volumetric
  raymarching.
- **Rain** is a stylized falling-point particle shower (with a matching dip
  in sunlight and a greyer fog tint while it's active), not per-drop
  splash decals or wet-surface shading.
- **The camera doesn't raycast against scenery** — it can clip into a tree
  or the academy wall at some angles rather than pulling in to avoid it.
- **No automatic graphics-quality fallback** for low-end hardware yet; the
  fixed streaming radii (terrain/grass tile counts) are tuned for a
  mid-range mobile GPU rather than adapting live to frame time.
- **Path wear** (extra-worn ground where the player actually walks most)
  isn't tracked — the path decor is static procedural variation, not a
  live-updated heatmap.
- **Shadow mapping is off on purpose.** A moving sun with a live shadow
  camera over this much scattered geometry is the single most expensive
  thing a scene like this can do, especially on mobile GPUs — depth reads
  instead from vertex-color ground shading, a per-character contact shadow
  ellipse, and emissive glow accents, a "baked lighting" stand-in per the
  brief's own optimization notes. Point lights were likewise removed from
  purely decorative objects (crystals, lanterns, collectibles) in favor of
  emissive materials, keeping the visual glow without the per-light cost.
- The journal's map is a stylized 2D overview (not a live 3D minimap render).

## Prepared for later development (not yet activated)

These exist as real, save-compatible data structures so future work can
build on them without another migration pass — none of them currently do
anything in-game:

- **A wing-slot system**: `save.wings` (`unlocked`/`equipped`/`available`)
  plus an actual empty attachment point between the avatar's shoulder
  blades (`rig.parts.wingSlot`) ready for a future flight feature.
- **A named-zone map** (`src/data/zones.js`): Asterwyn Academy, Friendship
  Square, the river, the Whisperwood entrance, the Moonmere portal, an
  outer "Far Wilds" ring, and the vale core as a fallback — with a
  `zoneAt(x, z)` lookup — for future zone-scoped weather, spawns, or quest
  triggers.
- **A quest registry** (`QUESTS` in `src/data/gameData.js`): the existing
  star-fragment quest is now described with `startConditions`/`steps`/
  `completion` fields alongside its rewards, and future quests can be
  appended to the same array without touching the quest engine.
