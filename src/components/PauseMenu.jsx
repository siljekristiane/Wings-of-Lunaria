import { useEffect } from 'react';
import { CAMERA_MODES } from '../data/gameData.js';
import { IconClose } from './icons.jsx';

export default function PauseMenu({ save, onClose, onSetCamera }) {
  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <div className="modal-overlay">
      <div className="panel-window">
        <div className="panel-header">
          <h2>Meny</h2>
          <button className="icon-close" onClick={onClose}><IconClose /></button>
        </div>
        <div className="panel-scroll">
          <button className="btn btn--primary" style={{ width: '100%', marginBottom: 20 }} onClick={onClose}>
            Fortsett å spille
          </button>

          <h3 className="settings-heading">Kameramodus</h3>
          <div className="choice-row">
            {CAMERA_MODES.map((m) => (
              <button
                key={m.id}
                className={'choice-pill' + (save.cameraMode === m.id ? ' choice-pill--active' : '')}
                onClick={() => onSetCamera({ cameraMode: m.id })}
              >
                {m.name}
              </button>
            ))}
          </div>

          <h3 className="settings-heading">Kameraavstand</h3>
          <input
            type="range"
            min="0.7"
            max="1.5"
            step="0.05"
            value={save.cameraDistance}
            onChange={(e) => onSetCamera({ cameraDistance: parseFloat(e.target.value) })}
            className="range-input"
          />

          <h3 className="settings-heading">Kontroller</h3>
          <ul className="controls-list">
            <li>WASD / piltaster — Beveg deg</li>
            <li>Shift — Løp</li>
            <li>E — Samhandle</li>
            <li>I — Ryggsekk</li>
            <li>J — Dagbok</li>
            <li>R — Emote-meny</li>
            <li>Esc — Lukk / meny</li>
          </ul>

          <p className="confirm-quote" style={{ marginTop: 24 }}>
            «Lunaria våkner ikke av én vinge alene, men av båndene vi velger å beskytte.»
          </p>
        </div>
      </div>
    </div>
  );
}
