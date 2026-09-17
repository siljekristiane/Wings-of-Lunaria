export function createDefaultSave(player, companion) {
  const ownedClothing = Array.from(
    new Set([player.outfit.top, player.outfit.bottom, player.outfit.shoes, player.outfit.accessory])
  );
  return {
    version: 1,
    createdCharacter: true,
    player,
    companion,
    ownedClothing,
    equippedOutfit: { ...player.outfit },
    stardust: 30,
    xp: 0,
    inventory: { collectibles: [] },
    discoveredAreas: [],
    quests: {
      mainQuest: { state: 'not_started', fragmentsFound: 0, foundFragmentIds: [] },
    },
    dialogueFlags: { rowanClueGiven: false, miraChoice: null },
    cameraMode: 1,
    cameraDistance: 1,
    position: { scene: 'vale', x: 0, y: -260 },
  };
}

// Merge a loaded save with the current default shape so older saves don't crash on new fields.
export function normalizeSave(loaded) {
  if (!loaded) return null;
  const fallback = createDefaultSave(loaded.player, loaded.companion);
  return {
    ...fallback,
    ...loaded,
    inventory: { ...fallback.inventory, ...loaded.inventory },
    quests: { mainQuest: { ...fallback.quests.mainQuest, ...(loaded.quests && loaded.quests.mainQuest) } },
    dialogueFlags: { ...fallback.dialogueFlags, ...loaded.dialogueFlags },
    position: { ...fallback.position, ...loaded.position },
    equippedOutfit: { ...fallback.equippedOutfit, ...loaded.equippedOutfit },
  };
}
