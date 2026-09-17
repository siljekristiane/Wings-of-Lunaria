import { useState } from 'react';
import AvatarPreview from './AvatarPreview.jsx';
import CompanionPreview from './CompanionPreview.jsx';
import {
  SKIN_TONES, HAIR_COLORS, EYE_COLORS, FACE_SHAPES, HAIR_STYLES,
  CLOTHING_CATALOG, COMPANION_TYPES, COMPANION_COLORS, COMPANION_GLOWS, COMPANION_ACCESSORIES,
} from '../data/gameData.js';

function Swatch({ value, options, onChange, render }) {
  return (
    <div className="swatch-row">
      {options.map((opt) => (
        <button
          key={opt}
          type="button"
          className={'swatch' + (opt === value ? ' swatch--active' : '')}
          style={render ? render(opt) : { background: opt }}
          onClick={() => onChange(opt)}
          aria-label={String(opt)}
        />
      ))}
    </div>
  );
}

function ChoiceRow({ value, options, onChange }) {
  return (
    <div className="choice-row">
      {options.map((raw) => {
        const opt = typeof raw === 'object' ? raw : { value: raw, label: raw };
        return (
          <button
            key={opt.value}
            type="button"
            className={'choice-pill' + (opt.value === value ? ' choice-pill--active' : '')}
            onClick={() => onChange(opt.value)}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}

const DEFAULT_PLAYER = {
  name: '',
  skinTone: SKIN_TONES[0],
  faceShape: FACE_SHAPES[0],
  hairStyle: HAIR_STYLES[0],
  hairColor: HAIR_COLORS[0],
  eyeColor: EYE_COLORS[0],
  outfit: {
    top: 'top_starter_tunic', topColor: CLOTHING_CATALOG.top[0].color,
    bottom: 'bottom_starter_pants', bottomColor: CLOTHING_CATALOG.bottom[0].color,
    shoes: 'shoes_starter_boots', shoesColor: CLOTHING_CATALOG.shoes[0].color,
    accessory: 'acc_none', accessoryColor: 'transparent',
  },
};

const DEFAULT_COMPANION = {
  type: 'lysrev',
  name: '',
  color: COMPANION_COLORS[0],
  eyeColor: EYE_COLORS[0],
  glow: COMPANION_GLOWS[0],
  accessory: 'Ingen',
};

export default function CharacterCreator({ onComplete }) {
  const [step, setStep] = useState(1);
  const [player, setPlayer] = useState(DEFAULT_PLAYER);
  const [companion, setCompanion] = useState(DEFAULT_COMPANION);

  const setOutfitPiece = (slot, itemId) => {
    const item = CLOTHING_CATALOG[slot].find((i) => i.id === itemId);
    setPlayer((p) => ({ ...p, outfit: { ...p.outfit, [slot]: itemId, [`${slot}Color`]: item.color } }));
  };

  const canGoStep2 = player.name.trim().length > 0;
  const canGoStep3 = companion.name.trim().length > 0;

  return (
    <div className="creator-screen">
      <div className="creator-steps">
        <span className={step === 1 ? 'step-dot step-dot--active' : 'step-dot'}>1</span>
        <span className={step === 2 ? 'step-dot step-dot--active' : 'step-dot'}>2</span>
        <span className={step === 3 ? 'step-dot step-dot--active' : 'step-dot'}>3</span>
      </div>

      {step === 1 && (
        <div className="creator-panel">
          <h2>Skap din Wingkeeper</h2>
          <div className="creator-layout">
            <div className="creator-preview">
              <AvatarPreview player={player} size={240} />
            </div>
            <div className="creator-controls">
              <label className="field-label">Navn</label>
              <input
                className="text-input"
                value={player.name}
                maxLength={18}
                placeholder="Skriv navnet ditt..."
                onChange={(e) => setPlayer((p) => ({ ...p, name: e.target.value }))}
              />

              <label className="field-label">Hudtone</label>
              <Swatch value={player.skinTone} options={SKIN_TONES} onChange={(v) => setPlayer((p) => ({ ...p, skinTone: v }))} />

              <label className="field-label">Ansiktsform</label>
              <ChoiceRow value={player.faceShape} options={FACE_SHAPES} onChange={(v) => setPlayer((p) => ({ ...p, faceShape: v }))} />

              <label className="field-label">Hårstil</label>
              <ChoiceRow value={player.hairStyle} options={HAIR_STYLES} onChange={(v) => setPlayer((p) => ({ ...p, hairStyle: v }))} />

              <label className="field-label">Hårfarge</label>
              <Swatch value={player.hairColor} options={HAIR_COLORS} onChange={(v) => setPlayer((p) => ({ ...p, hairColor: v }))} />

              <label className="field-label">Øyenfarge</label>
              <Swatch value={player.eyeColor} options={EYE_COLORS} onChange={(v) => setPlayer((p) => ({ ...p, eyeColor: v }))} />

              <label className="field-label">Topp</label>
              <ChoiceRow
                value={player.outfit.top}
                options={CLOTHING_CATALOG.top.map((i) => ({ value: i.id, label: i.name }))}
                onChange={(v) => setOutfitPiece('top', v)}
              />
              <label className="field-label">Underdel</label>
              <ChoiceRow
                value={player.outfit.bottom}
                options={CLOTHING_CATALOG.bottom.map((i) => ({ value: i.id, label: i.name }))}
                onChange={(v) => setOutfitPiece('bottom', v)}
              />
              <label className="field-label">Sko</label>
              <ChoiceRow
                value={player.outfit.shoes}
                options={CLOTHING_CATALOG.shoes.map((i) => ({ value: i.id, label: i.name }))}
                onChange={(v) => setOutfitPiece('shoes', v)}
              />
              <label className="field-label">Tilbehør</label>
              <ChoiceRow
                value={player.outfit.accessory}
                options={CLOTHING_CATALOG.accessory.filter((i) => !i.questReward).map((i) => ({ value: i.id, label: i.name }))}
                onChange={(v) => setOutfitPiece('accessory', v)}
              />
            </div>
          </div>
          <div className="creator-actions">
            <button className="btn btn--primary" disabled={!canGoStep2} onClick={() => setStep(2)}>
              Neste: Velg følgesvenn →
            </button>
          </div>
        </div>
      )}

      {step === 2 && (
        <div className="creator-panel">
          <h2>Velg din magiske følgesvenn</h2>
          <div className="companion-type-grid">
            {COMPANION_TYPES.map((c) => (
              <button
                key={c.id}
                type="button"
                className={'companion-card' + (companion.type === c.id ? ' companion-card--active' : '')}
                onClick={() => setCompanion((co) => ({ ...co, type: c.id, color: c.baseColor }))}
              >
                <CompanionPreview companion={{ ...companion, type: c.id, color: c.baseColor }} size={110} />
                <strong>{c.name}</strong>
                <span>{c.desc}</span>
              </button>
            ))}
          </div>

          <div className="creator-layout">
            <div className="creator-preview">
              <CompanionPreview companion={companion} size={220} />
            </div>
            <div className="creator-controls">
              <label className="field-label">Navn</label>
              <input
                className="text-input"
                value={companion.name}
                maxLength={16}
                placeholder="Gi følgesvennen et navn..."
                onChange={(e) => setCompanion((c) => ({ ...c, name: e.target.value }))}
              />
              <label className="field-label">Farge</label>
              <Swatch value={companion.color} options={COMPANION_COLORS} onChange={(v) => setCompanion((c) => ({ ...c, color: v }))} />
              <label className="field-label">Øyenfarge</label>
              <Swatch value={companion.eyeColor} options={EYE_COLORS} onChange={(v) => setCompanion((c) => ({ ...c, eyeColor: v }))} />
              <label className="field-label">Glødeffekt</label>
              <Swatch value={companion.glow} options={COMPANION_GLOWS} onChange={(v) => setCompanion((c) => ({ ...c, glow: v }))} />
              <label className="field-label">Tilbehør</label>
              <ChoiceRow value={companion.accessory} options={COMPANION_ACCESSORIES} onChange={(v) => setCompanion((c) => ({ ...c, accessory: v }))} />
            </div>
          </div>

          <div className="creator-actions">
            <button className="btn btn--ghost" onClick={() => setStep(1)}>← Tilbake</button>
            <button className="btn btn--primary" disabled={!canGoStep3} onClick={() => setStep(3)}>
              Neste: Bekreft →
            </button>
          </div>
        </div>
      )}

      {step === 3 && (
        <div className="creator-panel creator-panel--confirm">
          <h2>Klar for eventyret</h2>
          <div className="confirm-duo">
            <div className="creator-preview">
              <AvatarPreview player={player} size={220} />
              <strong>{player.name}</strong>
            </div>
            <div className="creator-preview">
              <CompanionPreview companion={companion} size={200} />
              <strong>{companion.name}</strong>
            </div>
          </div>
          <p className="confirm-quote">
            «Lunaria våkner ikke av én vinge alene, men av båndene vi velger å beskytte.»
          </p>
          <div className="creator-actions">
            <button className="btn btn--ghost" onClick={() => setStep(2)}>← Tilbake</button>
            <button className="btn btn--primary btn--big" onClick={() => onComplete(player, companion)}>
              Begynn eventyret
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export { DEFAULT_PLAYER, DEFAULT_COMPANION };
