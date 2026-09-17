import { useEffect, useState } from 'react';
import { buildDialogue } from '../game/dialogue.js';

export default function DialogueBox({ npc, save, onChoice, onClose }) {
  const script = buildDialogue(npc.id, save);
  const [lineIndex, setLineIndex] = useState(0);
  const isLast = lineIndex >= script.lines.length - 1;

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') onClose();
      else if (e.key === 'Enter' || e.key === ' ') advance();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lineIndex]);

  function advance() {
    if (!isLast) setLineIndex((i) => i + 1);
    else if (!script.choices && !script.onFinish) onClose();
    else if (!script.choices && script.onFinish) {
      onChoice(script.onFinish);
      onClose();
    }
  }

  return (
    <div className="modal-overlay">
      <div className="dialogue-box">
        <div className="dialogue-name">{script.title}</div>
        <p className="dialogue-line">{script.lines[lineIndex]}</p>
        {isLast && script.choices ? (
          <div className="dialogue-choices">
            {script.choices.map((c) => (
              <button
                key={c.action}
                className="btn btn--primary"
                onClick={() => { onChoice(c.action); onClose(); }}
              >
                {c.label}
              </button>
            ))}
          </div>
        ) : (
          <div className="dialogue-actions">
            <button className="btn btn--ghost" onClick={onClose}>Lukk</button>
            <button className="btn btn--primary" onClick={advance}>
              {isLast ? 'Ferdig' : 'Fortsett →'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
