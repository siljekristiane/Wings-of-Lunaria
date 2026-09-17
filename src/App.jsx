import { useCallback, useEffect, useRef, useState } from 'react';
import StartScreen from './components/StartScreen.jsx';
import CharacterCreator from './components/CharacterCreator.jsx';
import GameScene3D from './three/GameScene3D.jsx';
import HUD from './components/HUD.jsx';
import Backpack from './components/Backpack.jsx';
import Journal from './components/Journal.jsx';
import Wardrobe from './components/Wardrobe.jsx';
import PauseMenu from './components/PauseMenu.jsx';
import DialogueBox from './components/DialogueBox.jsx';
import RadialMenu from './components/RadialMenu.jsx';
import Toast from './components/Toast.jsx';
import { NPCS, QUEST_MAIN } from './data/gameData.js';
import { createDefaultSave, normalizeSave } from './data/defaultSave.js';
import { loadSave, writeSave } from './hooks/useGameSave.js';

const isMobile = typeof window !== 'undefined' && ('ontouchstart' in window || navigator.maxTouchPoints > 0);

export default function App() {
  const [screen, setScreen] = useState('title'); // 'title' | 'creator' | 'game'
  const [save, setSave] = useState(() => normalizeSave(loadSave()));
  const [ui, setUi] = useState({ modal: null, dialogueNpc: null });
  const [showRadial, setShowRadial] = useState(false);
  const [emoteRequest, setEmoteRequest] = useState(null);
  const [toasts, setToasts] = useState([]);
  const emoteNonce = useRef(0);
  const toastId = useRef(0);

  useEffect(() => {
    if (save) writeSave(save);
  }, [save]);

  const pushToast = useCallback((text) => {
    const id = ++toastId.current;
    setToasts((list) => [...list, { id, text }]);
    setTimeout(() => setToasts((list) => list.filter((t) => t.id !== id)), 3200);
  }, []);

  const dispatch = useCallback((action) => {
    switch (action.type) {
      case 'OPEN_DIALOGUE':
        setUi({ modal: 'dialogue', dialogueNpc: action.npcId });
        break;
      case 'OPEN_WARDROBE':
        setUi({ modal: 'wardrobe', dialogueNpc: null });
        break;
      case 'NOTIFY':
        pushToast(action.text);
        break;
      case 'CHANGE_SCENE':
        setSave((prev) => ({
          ...prev,
          position: { ...prev.position, scene: action.scene, x3: action.x3, z3: action.z3, rotY: action.rotY },
        }));
        break;
      case 'SAVE_POSITION_3D':
        setSave((prev) => ({
          ...prev,
          cameraYaw: action.cameraYaw,
          position: { ...prev.position, scene: action.scene, x3: action.x3, z3: action.z3, rotY: action.rotY },
        }));
        break;
      case 'DISCOVER_AREA':
        setSave((prev) => (prev.discoveredAreas.includes(action.id) ? prev : { ...prev, discoveredAreas: [...prev.discoveredAreas, action.id] }));
        break;
      case 'COLLECT_ITEM':
        setSave((prev) => {
          if (prev.inventory.collectibles.includes(action.id)) return prev;
          pushToast(`+1 ${action.name}`);
          return { ...prev, inventory: { ...prev.inventory, collectibles: [...prev.inventory.collectibles, action.id] } };
        });
        break;
      case 'COLLECT_FRAGMENT':
        setSave((prev) => {
          const q = prev.quests.mainQuest;
          if (q.state !== 'active' || q.foundFragmentIds.includes(action.id)) return prev;
          const foundFragmentIds = [...q.foundFragmentIds, action.id];
          pushToast(
            foundFragmentIds.length >= 3
              ? `Stjernefragmenter: ${foundFragmentIds.length} av 3 — gå tilbake til Elowen!`
              : `Stjernefragmenter: ${foundFragmentIds.length} av 3`
          );
          return {
            ...prev,
            quests: { ...prev.quests, mainQuest: { ...q, foundFragmentIds, fragmentsFound: foundFragmentIds.length } },
          };
        });
        break;
      default:
        break;
    }
  }, [pushToast]);

  const handleDialogueAction = useCallback((action) => {
    setSave((prev) => {
      if (action === 'accept_quest') {
        pushToast('Oppdrag startet: ' + QUEST_MAIN.title);
        return { ...prev, quests: { ...prev.quests, mainQuest: { ...prev.quests.mainQuest, state: 'active' } } };
      }
      if (action === 'complete_quest') {
        const owned = prev.ownedClothing.includes(QUEST_MAIN.rewardItem)
          ? prev.ownedClothing
          : [...prev.ownedClothing, QUEST_MAIN.rewardItem];
        pushToast(`+${QUEST_MAIN.rewardStardust} Stjernestøv, +${QUEST_MAIN.rewardXp} EP, ny gjenstand mottatt!`);
        return {
          ...prev,
          stardust: prev.stardust + QUEST_MAIN.rewardStardust,
          xp: prev.xp + QUEST_MAIN.rewardXp,
          ownedClothing: owned,
          quests: { ...prev.quests, mainQuest: { ...prev.quests.mainQuest, state: 'complete' } },
        };
      }
      if (action === 'rowan_clue') {
        return { ...prev, dialogueFlags: { ...prev.dialogueFlags, rowanClueGiven: true } };
      }
      if (action === 'mira_simple' || action === 'mira_bold') {
        return { ...prev, dialogueFlags: { ...prev.dialogueFlags, miraChoice: action } };
      }
      return prev;
    });
  }, [pushToast]);

  const handleSaveOutfit = useCallback((outfit) => {
    setSave((prev) => ({ ...prev, equippedOutfit: outfit }));
  }, []);

  const handleBuyClothing = useCallback((itemId, cost) => {
    setSave((prev) => {
      if (prev.stardust < cost || prev.ownedClothing.includes(itemId)) return prev;
      pushToast('Kjøpt nytt plagg!');
      return { ...prev, stardust: prev.stardust - cost, ownedClothing: [...prev.ownedClothing, itemId] };
    });
  }, [pushToast]);

  const handleSetCamera = useCallback((patch) => {
    setSave((prev) => ({ ...prev, ...patch }));
  }, []);

  // global shortcuts, active only during gameplay.
  // Modal-specific Esc handling (closing backpack/journal/etc.) lives in each modal;
  // this only covers opening things and the "nothing is open" Esc → pause menu case.
  useEffect(() => {
    if (screen !== 'game') return;
    const onKey = (e) => {
      const key = e.key.toLowerCase();
      if (key === 'escape') {
        if (showRadial) setShowRadial(false);
        else if (!ui.modal) setUi({ modal: 'pause', dialogueNpc: null });
        return;
      }
      if (ui.modal || showRadial) return;
      if (key === 'i') setUi({ modal: 'backpack', dialogueNpc: null });
      else if (key === 'j') setUi({ modal: 'journal', dialogueNpc: null });
      else if (key === 'm' || key === 'q') setShowRadial(true);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [screen, ui.modal, showRadial]);

  function handleCreationComplete(player, companion) {
    const newSave = createDefaultSave(player, companion);
    setSave(newSave);
    writeSave(newSave);
    setScreen('game');
  }

  function selectEmote(type) {
    emoteNonce.current += 1;
    setEmoteRequest({ type, nonce: emoteNonce.current });
    setShowRadial(false);
  }

  if (screen === 'title') {
    return (
      <StartScreen
        hasSave={!!(save && save.createdCharacter)}
        onStartNew={() => setScreen('creator')}
        onContinue={() => setScreen('game')}
      />
    );
  }

  if (screen === 'creator' || !save) {
    return <CharacterCreator onComplete={handleCreationComplete} />;
  }

  const paused = !!ui.modal || showRadial;
  const dialogueNpc = ui.dialogueNpc ? NPCS.find((n) => n.id === ui.dialogueNpc) : null;

  return (
    <div className="app-root">
      <GameScene3D save={save} paused={paused} dispatch={dispatch} emoteRequest={emoteRequest} isMobile={isMobile} />
      <HUD
        save={save}
        isMobile={isMobile}
        onOpenBackpack={() => setUi({ modal: 'backpack', dialogueNpc: null })}
        onOpenJournal={() => setUi({ modal: 'journal', dialogueNpc: null })}
        onOpenEmotes={() => setShowRadial(true)}
        onOpenPause={() => setUi({ modal: 'pause', dialogueNpc: null })}
      />
      <Toast toasts={toasts} />

      {ui.modal === 'backpack' && <Backpack save={save} onClose={() => setUi({ modal: null, dialogueNpc: null })} />}
      {ui.modal === 'journal' && <Journal save={save} onClose={() => setUi({ modal: null, dialogueNpc: null })} />}
      {ui.modal === 'pause' && (
        <PauseMenu save={save} onSetCamera={handleSetCamera} onClose={() => setUi({ modal: null, dialogueNpc: null })} />
      )}
      {ui.modal === 'wardrobe' && (
        <Wardrobe
          save={save}
          onSave={handleSaveOutfit}
          onBuy={handleBuyClothing}
          onClose={() => setUi({ modal: null, dialogueNpc: null })}
        />
      )}
      {ui.modal === 'dialogue' && dialogueNpc && (
        <DialogueBox
          npc={dialogueNpc}
          save={save}
          onChoice={handleDialogueAction}
          onClose={() => setUi({ modal: null, dialogueNpc: null })}
        />
      )}
      {showRadial && <RadialMenu onSelect={selectEmote} onClose={() => setShowRadial(false)} />}
    </div>
  );
}
