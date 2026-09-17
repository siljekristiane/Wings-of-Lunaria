# Wings of Lunaria

A playable browser prototype of an original fantasy adventure game. You are a
Wingkeeper exploring the magical valley of Asterwyn Vale together with a
personal companion creature — focused on exploration, friendship, gentle
quests and self-expression rather than combat or competition.

## Running it

```bash
npm install
npm run dev
```

Open the printed local URL. `npm run build` produces a production build in `dist/`.

## What's here

- Three-step character & companion creator (appearance, companion, confirm)
- An explorable Asterwyn Vale with a river, bridge, Friendship Square, a
  locked Moonmere portal, and the path toward Whisperwood
- Third-person-style movement (WASD/arrows, Shift to run, on-screen joystick
  on touch devices), with four selectable camera modes and adjustable distance
- NPCs with dialogue (Headkeeper Elowen, Mira Vale, Rowan Thale)
- A complete quest, "Det falmede stjernekartet" (find 3 star fragments and
  return them to Elowen for a reward)
- Physical collectibles, a backpack, a journal (map/quests/clues/collection
  log/notes), and a wardrobe reached via the mirror or closet in your room
  inside Asterwyn Academy
- A radial emote menu (wave / cheer / thank you), animated grass and trees,
  drifting fog, aurora, and shooting stars
- Progress is saved to `localStorage` and restored on reload

## What's simulated vs. fully interactive

Everything listed above is fully interactive and playable — movement,
collision, dialogue, the quest, the wardrobe, the journal/backpack, saving,
and the emote menu all work end to end.

The world itself is **2D top-down**, styled to read as a soft, semi-realistic
scene rather than literal 3D: depth is faked with layering/scale (a painter's
algorithm sort) instead of a real camera/mesh pipeline, and characters are
drawn as stylized procedural shapes on `<canvas>` rather than 3D models. The
four "camera modes" change zoom/framing rather than a true 3D perspective.
The valley is a large bounded area (not infinite) whose edges are hidden by
drifting fog so no boundary is ever visible during normal play.
