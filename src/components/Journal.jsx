import { useEffect, useState } from 'react';
import { AREAS, QUEST_MAIN, COLLECTIBLES, STAR_FRAGMENTS } from '../data/gameData.js';
import { IconClose } from './icons.jsx';

const TABS = ['Kart', 'Oppdrag', 'Ledetråder', 'Samlingsbok', 'Notater'];

const MAP_POINTS = {
  asterwyn_vale: { x: 50, y: 60, label: 'Asterwyn Vale' },
  asterwyn_academy: { x: 50, y: 20, label: 'Asterwyn Academy' },
  friendship_square: { x: 78, y: 55, label: 'Vennskapstorget' },
  whisperwood_path: { x: 14, y: 82, label: 'Sti mot Whisperwood' },
  moonmere_portal: { x: 84, y: 25, label: 'Portal til Moonmere' },
};

export default function Journal({ save, onClose }) {
  const [tab, setTab] = useState('Kart');

  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const q = save.quests.mainQuest;

  return (
    <div className="modal-overlay">
      <div className="panel-window panel-window--wide">
        <div className="panel-header">
          <h2>Dagbok</h2>
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
          {tab === 'Kart' && (
            <div className="journal-map">
              <svg viewBox="0 0 100 100" className="map-svg">
                <rect x="0" y="0" width="100" height="100" rx="4" fill="#26224a" />
                <path d="M0 68 Q40 62 55 66 Q75 70 100 66" stroke="#3c6b8f" strokeWidth="3" fill="none" opacity="0.7" />
                {AREAS.map((a) => {
                  const pt = MAP_POINTS[a.id];
                  const discovered = save.discoveredAreas.includes(a.id);
                  return (
                    <g key={a.id} opacity={discovered ? 1 : 0.22}>
                      <circle cx={pt.x} cy={pt.y} r={discovered ? 3 : 2} fill={discovered ? '#d9b45c' : '#8a86ad'} />
                      <text x={pt.x} y={pt.y - 4} fontSize="3.4" fill="#f5f2ff" textAnchor="middle">
                        {discovered ? pt.label : '???'}
                      </text>
                    </g>
                  );
                })}
              </svg>
              <p className="panel-hint">Uoppdagede områder vises svakt på kartet. Utforsk dalen for å avdekke mer.</p>
            </div>
          )}

          {tab === 'Oppdrag' && (
            <div className="quest-list">
              <div className="quest-entry">
                <h3>{QUEST_MAIN.title}</h3>
                <p className="quest-status">
                  Status: {q.state === 'not_started' ? 'Ikke startet' : q.state === 'active' ? `Aktiv (${q.fragmentsFound} av 3 fragmenter)` : 'Fullført'}
                </p>
                {q.state !== 'not_started' && <p>{QUEST_MAIN.description}</p>}
              </div>
            </div>
          )}

          {tab === 'Ledetråder' && (
            <div className="quest-list">
              {save.dialogueFlags.rowanClueGiven ? (
                <div className="quest-entry">
                  <h3>En skapning i Whisperwood</h3>
                  <p>Rowan Thale tror en liten skapning inne i skogen trenger hjelp. Whisperwood er ikke trygt å utforske ennå — dette blir et fremtidig oppdrag.</p>
                </div>
              ) : (
                <p className="panel-hint">Ingen ledetråder oppdaget ennå.</p>
              )}
            </div>
          )}

          {tab === 'Samlingsbok' && (
            <div className="item-grid">
              {[...COLLECTIBLES, ...STAR_FRAGMENTS.map((f, i) => ({ id: f.id, name: `Stjernefragment ${i + 1}` }))].map((c) => {
                const found = save.inventory.collectibles.includes(c.id) || save.quests.mainQuest.foundFragmentIds.includes(c.id);
                return (
                  <div key={c.id} className={'item-card' + (found ? '' : ' item-card--locked')}>
                    <span className="item-swatch" style={{ background: found ? '#9fd9e0' : '#4a4670' }} />
                    <span>{found ? c.name : '???'}</span>
                  </div>
                );
              })}
            </div>
          )}

          {tab === 'Notater' && (
            <div className="quest-list">
              {save.discoveredAreas.includes('asterwyn_academy') && (
                <p className="journal-note">Asterwyn Academy reiser seg over dalen med tårn som gløder svakt om kvelden.</p>
              )}
              {save.discoveredAreas.includes('friendship_square') && (
                <p className="journal-note">Vennskapstorget er stedet reisende møtes for å dele historier.</p>
              )}
              {save.discoveredAreas.includes('moonmere_portal') && (
                <p className="journal-note">Portalen til Moonmere summer av gammel magi, men holdes låst inntil videre.</p>
              )}
              {save.discoveredAreas.length <= 1 && <p className="panel-hint">Utforsk dalen for å samle notater.</p>}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
