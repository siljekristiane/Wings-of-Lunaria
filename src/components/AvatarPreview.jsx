// Soft, semi-realistic SVG avatar preview (front view) used in character creation & wardrobe.
export default function AvatarPreview({ player, size = 220 }) {
  const { skinTone, faceShape, hairStyle, hairColor, eyeColor, outfit } = player;
  const topColor = outfit?.topColor || '#8fb3c9';
  const bottomColor = outfit?.bottomColor || '#6b5b4a';
  const shoesColor = outfit?.shoesColor || '#5a4632';
  const accColor = outfit?.accessoryColor;

  const faceWidth = faceShape === 'Rund' ? 46 : faceShape === 'Smal' ? 34 : faceShape === 'Hjerteformet' ? 42 : 40;

  return (
    <svg width={size} height={size} viewBox="0 0 160 220" role="img" aria-label="Avatar-forhåndsvisning">
      <defs>
        <radialGradient id="softGlow" cx="50%" cy="35%" r="65%">
          <stop offset="0%" stopColor="#fffdf5" stopOpacity="0.35" />
          <stop offset="100%" stopColor="#fffdf5" stopOpacity="0" />
        </radialGradient>
      </defs>
      <ellipse cx="80" cy="205" rx="34" ry="8" fill="#1c2440" opacity="0.18" />

      {/* legs */}
      <rect x="58" y="150" width="18" height="48" rx="8" fill={bottomColor} />
      <rect x="84" y="150" width="18" height="48" rx="8" fill={bottomColor} />
      {/* shoes */}
      <rect x="55" y="192" width="24" height="14" rx="6" fill={shoesColor} />
      <rect x="81" y="192" width="24" height="14" rx="6" fill={shoesColor} />

      {/* torso */}
      <path d="M52 108 Q80 96 108 108 L112 158 Q80 170 48 158 Z" fill={topColor} />
      {/* arms */}
      <rect x="34" y="108" width="16" height="52" rx="8" fill={topColor} transform="rotate(6 42 108)" />
      <rect x="110" y="108" width="16" height="52" rx="8" fill={topColor} transform="rotate(-6 118 108)" />
      <circle cx="42" cy="163" r="8" fill={skinTone} />
      <circle cx="118" cy="163" r="8" fill={skinTone} />

      {/* neck */}
      <rect x="72" y="92" width="16" height="18" fill={skinTone} />

      {/* hair back layer for longer styles */}
      {(hairStyle === 'Langt og bølgete' || hairStyle === 'Flettet krone' || hairStyle === 'Høy hestehale') && (
        <path d="M40 60 Q42 110 52 130 Q60 108 58 70 Z M120 60 Q118 110 108 130 Q100 108 102 70 Z" fill={hairColor} opacity="0.95" />
      )}

      {/* head */}
      <ellipse cx="80" cy="62" rx={faceWidth} ry="44" fill={skinTone} />
      {/* cheeks */}
      <ellipse cx="62" cy="72" rx="7" ry="5" fill="#e8899f" opacity="0.25" />
      <ellipse cx="98" cy="72" rx="7" ry="5" fill="#e8899f" opacity="0.25" />

      {/* eyes */}
      <ellipse cx="66" cy="60" rx="6" ry="7" fill="#2a2333" />
      <ellipse cx="94" cy="60" rx="6" ry="7" fill="#2a2333" />
      <circle cx="66" cy="59" r="3.4" fill={eyeColor} />
      <circle cx="94" cy="59" r="3.4" fill={eyeColor} />
      <circle cx="67" cy="57.5" r="1.1" fill="#fff" />
      <circle cx="95" cy="57.5" r="1.1" fill="#fff" />

      {/* smile */}
      <path d="M70 78 Q80 84 90 78" stroke="#7a4a3a" strokeWidth="2.4" fill="none" strokeLinecap="round" />

      {/* hair front */}
      {hairStyle === 'Kort bob' && <path d="M36 58 Q40 22 80 20 Q120 22 124 58 Q112 40 80 40 Q48 40 36 58 Z" fill={hairColor} />}
      {hairStyle === 'Krøllete løs' && (
        <g fill={hairColor}>
          <circle cx="40" cy="42" r="12" /><circle cx="55" cy="26" r="13" /><circle cx="80" cy="20" r="14" />
          <circle cx="105" cy="26" r="13" /><circle cx="120" cy="42" r="12" /><circle cx="80" cy="46" r="20" opacity="0" />
        </g>
      )}
      {(hairStyle === 'Langt og bølgete' || hairStyle === 'Høy hestehale') && (
        <path d="M34 56 Q38 18 80 16 Q122 18 126 56 Q114 32 80 30 Q46 32 34 56 Z" fill={hairColor} />
      )}
      {hairStyle === 'Flettet krone' && (
        <>
          <path d="M36 50 Q40 16 80 14 Q120 16 124 50 Q112 28 80 26 Q48 28 36 50 Z" fill={hairColor} />
          <ellipse cx="80" cy="26" rx="38" ry="8" fill={hairColor} opacity="0.7" />
        </>
      )}
      {hairStyle === 'Høy hestehale' && <ellipse cx="80" cy="14" rx="10" ry="8" fill={hairColor} />}

      {/* accessory (small circlet / pin near head or neck) */}
      {accColor && accColor !== 'transparent' && <circle cx="80" cy="94" r="6" fill={accColor} stroke="#fff" strokeWidth="1" />}

      <rect x="0" y="0" width="160" height="220" fill="url(#softGlow)" />
    </svg>
  );
}
