import { useEffect, useState } from 'react';
import AvatarPreview from './AvatarPreview3D.jsx';
import { CLOTHING_CATALOG } from '../data/gameData.js';
import { IconClose } from './icons.jsx';

const SLOT_TABS = [
  { id: 'top', label: 'Topp' },
  { id: 'bottom', label: 'Underdel' },
  { id: 'shoes', label: 'Sko' },
  { id: 'accessory', label: 'Tilbehør' },
];

export default function Wardrobe({ save, onSave, onBuy, onClose }) {
  const [draft, setDraft] = useState(save.equippedOutfit);
  const [slot, setSlot] = useState('top');

  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const previewPlayer = { ...save.player, outfit: draft };
  const items = CLOTHING_CATALOG[slot];

  function selectOwned(item) {
    setDraft((d) => ({ ...d, [slot]: item.id, [`${slot}Color`]: item.color }));
  }

  function buy(item) {
    if (save.stardust < item.cost) return;
    onBuy(item.id, item.cost);
  }

  return (
    <div className="modal-overlay">
      <div className="panel-window wardrobe-window">
        <div className="panel-header">
          <h2>Garderobe</h2>
          <button className="icon-close" onClick={onClose}><IconClose /></button>
        </div>
        <div className="wardrobe-layout">
          <div className="wardrobe-preview">
            <AvatarPreview player={previewPlayer} size={200} />
            <div className="wardrobe-stardust">Stjernestøv: {save.stardust}</div>
          </div>
          <div className="wardrobe-picker">
            <div className="tab-row">
              {SLOT_TABS.map((t) => (
                <button key={t.id} className={'tab-btn' + (slot === t.id ? ' tab-btn--active' : '')} onClick={() => setSlot(t.id)}>
                  {t.label}
                </button>
              ))}
            </div>
            <div className="panel-scroll wardrobe-scroll">
              {items.filter((i) => !i.questReward || save.ownedClothing.includes(i.id)).map((item) => {
                const owned = save.ownedClothing.includes(item.id);
                const equipped = draft[slot] === item.id;
                return (
                  <div key={item.id} className={'wardrobe-item' + (equipped ? ' wardrobe-item--active' : '')}>
                    <span className="item-swatch" style={{ background: item.color }} />
                    <span className="wardrobe-item-name">{item.name}</span>
                    {owned ? (
                      <button className="btn btn--ghost btn--small" onClick={() => selectOwned(item)}>
                        {equipped ? 'Valgt' : 'Ta på'}
                      </button>
                    ) : (
                      <button
                        className="btn btn--primary btn--small"
                        disabled={save.stardust < item.cost}
                        onClick={() => buy(item)}
                      >
                        Kjøp ({item.cost})
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
        <div className="creator-actions">
          <button className="btn btn--ghost" onClick={onClose}>Avbryt</button>
          <button className="btn btn--primary" onClick={() => { onSave(draft); onClose(); }}>Lagre antrekk</button>
        </div>
      </div>
    </div>
  );
}
