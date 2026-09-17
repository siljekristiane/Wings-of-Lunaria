import { useEffect } from 'react';

const EMOTES = [
  { id: 'wave', label: 'Vink' },
  { id: 'cheer', label: 'Juble' },
  { id: 'thanks', label: 'Takk' },
];

export default function RadialMenu({ onSelect, onClose }) {
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const radius = 78;
  return (
    <div className="radial-overlay" onClick={onClose}>
      <div className="radial-menu" onClick={(e) => e.stopPropagation()}>
        <div className="radial-center">Velg en emote</div>
        {EMOTES.map((em, i) => {
          const angle = (i / EMOTES.length) * Math.PI * 2 - Math.PI / 2;
          const x = Math.cos(angle) * radius;
          const y = Math.sin(angle) * radius;
          return (
            <button
              key={em.id}
              className="radial-item"
              style={{ transform: `translate(${x}px, ${y}px)` }}
              onClick={() => onSelect(em.id)}
            >
              {em.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
