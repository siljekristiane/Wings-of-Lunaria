import { QUEST_MAIN } from '../data/gameData.js';
import { IconBackpack, IconJournal, IconSparkle, IconMenu, IconStar } from './icons.jsx';

export default function HUD({ save, onOpenBackpack, onOpenJournal, onOpenEmotes, onOpenPause, isMobile }) {
  const q = save.quests.mainQuest;
  return (
    <div className="hud">
      <div className="hud-top-left">
        <div className="hud-pill">
          <IconStar className="hud-dust-icon" />
          {save.stardust} Stjernestøv
        </div>
        {q.state === 'active' && (
          <div className="hud-pill hud-quest">
            {QUEST_MAIN.title}: {q.fragmentsFound} av 3
          </div>
        )}
        {q.state === 'complete' && (
          <div className="hud-pill hud-quest hud-quest--done">Oppdrag fullført: {QUEST_MAIN.title}</div>
        )}
      </div>

      <div className="hud-top-right">
        <button className="hud-icon-btn" onClick={onOpenBackpack} title="Ryggsekk (I)"><IconBackpack /></button>
        <button className="hud-icon-btn" onClick={onOpenJournal} title="Dagbok (J)"><IconJournal /></button>
        <button className="hud-icon-btn" onClick={onOpenEmotes} title="Emotes (M/Q)"><IconSparkle /></button>
        <button className="hud-icon-btn" onClick={onOpenPause} title="Meny (Esc)"><IconMenu /></button>
      </div>

      {!isMobile && (
        <div className="hud-controls-hint">WASD/piltaster: Bevege deg · Shift: Løpe · Musedrag: Roter kamera · E: Samhandle · I: Ryggsekk · J: Dagbok · M/Q: Emotes · Esc: Meny</div>
      )}
    </div>
  );
}
