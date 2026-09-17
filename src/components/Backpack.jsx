import { useEffect, useState } from 'react';
import { CLOTHING_CATALOG, COLLECTIBLES, STAR_FRAGMENTS } from '../data/gameData.js';
import { IconClose } from './icons.jsx';

const TABS = ['Klær', 'Tilbehør', 'Quest-gjenstander', 'Samleobjekter', 'Ressurser'];

function findItem(id) {
  for (const slot of Object.keys(CLOTHING_CATALOG)) {
    const found = CLOTHING_CATALOG[slot].find((i) => i.id === id);
    if (found) return { ...found, slot };
  }
  return null;
}

export default function Backpack({ save, onClose }) {
  const [tab, setTab] = useState('Klær');

  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const clothingOwned = save.ownedClothing.map(findItem).filter(Boolean);
  const clothes = clothingOwned.filter((i) => i.slot !== 'accessory');
  const accessories = clothingOwned.filter((i) => i.slot === 'accessory' && i.id !== 'acc_none');
  const q = save.quests.mainQuest;

  return (
    <div className="modal-overlay">
      <div className="panel-window">
        <div className="panel-header">
          <h2>Ryggsekk</h2>
          <button className="icon-close" onClick={onClose}><IconClose /></button>
        </div>
        <div className="tab-row">
          {TABS.map((t) => (
            <button key={t} className={'tab-btn' + (tab === t ? ' tab-btn--active' : '')} onClick={() => setTab(t)}>
              {t}
            </button>
          ))}
        </div>
        <div className="panel-scroll">
          {tab === 'Klær' && (
            <>
              <p className="panel-hint">Klær tas på ved speilet eller klesskapet på rommet ditt.</p>
              <div className="item-grid">
                {clothes.map((i) => (
                  <div key={i.id} className="item-card">
                    <span className="item-swatch" style={{ background: i.color }} />
                    <span>{i.name}</span>
                  </div>
                ))}
              </div>
            </>
          )}
          {tab === 'Tilbehør' && (
            <div className="item-grid">
              {accessories.length === 0 && <p className="panel-hint">Ingen tilbehør ennå.</p>}
              {accessories.map((i) => (
                <div key={i.id} className="item-card">
                  <span className="item-swatch" style={{ background: i.color }} />
                  <span>{i.name}</span>
                </div>
              ))}
            </div>
          )}
          {tab === 'Quest-gjenstander' && (
            <div className="item-grid">
              {q.state !== 'not_started' && (
                <div className="item-card item-card--quest">
                  <span className="item-swatch item-swatch--glow" />
                  <span>Stjernefragmenter ({q.fragmentsFound} av {STAR_FRAGMENTS.length})</span>
                </div>
              )}
              {q.state === 'not_started' && <p className="panel-hint">Ingen aktive oppdrag ennå. Finn Headkeeper Elowen.</p>}
            </div>
          )}
          {tab === 'Samleobjekter' && (
            <div className="item-grid">
              {COLLECTIBLES.filter((c) => save.inventory.collectibles.includes(c.id)).map((c) => (
                <div key={c.id} className="item-card">
                  <span className="item-swatch" style={{ background: '#9fd9e0' }} />
                  <span>{c.name}</span>
                </div>
              ))}
              {save.inventory.collectibles.length === 0 && <p className="panel-hint">Ingen samleobjekter funnet ennå.</p>}
            </div>
          )}
          {tab === 'Ressurser' && (
            <div className="item-grid">
              <div className="item-card">
                <span className="item-swatch" style={{ background: '#d9b45c' }} />
                <span>Stjernestøv: {save.stardust}</span>
              </div>
              <div className="item-card">
                <span className="item-swatch" style={{ background: '#a89bd9' }} />
                <span>Erfaring: {save.xp}</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
