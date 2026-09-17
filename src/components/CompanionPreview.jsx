// SVG preview for the four original companion species.
export default function CompanionPreview({ companion, size = 200 }) {
  const { type, color, eyeColor, glow } = companion;

  return (
    <svg width={size} height={size} viewBox="0 0 160 160" role="img" aria-label="Følgesvenn-forhåndsvisning">
      <defs>
        <radialGradient id={`glow-${type}`} cx="50%" cy="50%" r="60%">
          <stop offset="0%" stopColor={glow} stopOpacity="0.55" />
          <stop offset="100%" stopColor={glow} stopOpacity="0" />
        </radialGradient>
      </defs>
      <ellipse cx="80" cy="80" rx="70" ry="70" fill={`url(#glow-${type})`} />
      <ellipse cx="80" cy="138" rx="30" ry="7" fill="#1c2440" opacity="0.15" />

      {type === 'lysrev' && <Lysrev color={color} eyeColor={eyeColor} />}
      {type === 'skykatt' && <Skykatt color={color} eyeColor={eyeColor} />}
      {type === 'maaneulv' && <Maaneulv color={color} eyeColor={eyeColor} />}
      {type === 'stjernedrage' && <Stjernedrage color={color} eyeColor={eyeColor} />}

      {companion.accessory === 'Liten sløyfe' && <path d="M74 58 L66 52 L66 64 Z M86 58 L94 52 L94 64 Z" fill="#d98fa3" />}
      {companion.accessory === 'Stjerneanheng' && <circle cx="80" cy="92" r="5" fill="#d9b45c" stroke="#fff" strokeWidth="1" />}
      {companion.accessory === 'Blomsterkrans' && <circle cx="80" cy="44" r="30" fill="none" stroke="#d98fa3" strokeWidth="4" strokeDasharray="4 6" />}
      {companion.accessory === 'Skjerf' && <rect x="60" y="86" width="40" height="10" rx="5" fill="#a89bd9" />}
    </svg>
  );
}

function Lysrev({ color, eyeColor }) {
  return (
    <g>
      <path d="M40 95 Q20 130 45 128 Q55 118 60 100 Z" fill={color} />
      <ellipse cx="80" cy="100" rx="42" ry="32" fill={color} />
      <path d="M50 70 L38 40 L62 62 Z" fill={color} />
      <path d="M110 70 L122 40 L98 62 Z" fill={color} />
      <path d="M52 44 L44 50 L56 56 Z" fill="#3a2a2a" opacity="0.5" />
      <path d="M108 44 L116 50 L104 56 Z" fill="#3a2a2a" opacity="0.5" />
      <ellipse cx="80" cy="108" rx="20" ry="16" fill="#fffaf0" />
      <circle cx="66" cy="92" r="6" fill={eyeColor} />
      <circle cx="94" cy="92" r="6" fill={eyeColor} />
      <ellipse cx="80" cy="106" rx="4" ry="3" fill="#3a2a2a" />
    </g>
  );
}

function Skykatt({ color, eyeColor }) {
  return (
    <g>
      <ellipse cx="42" cy="112" rx="18" ry="10" fill={color} opacity="0.85" />
      <ellipse cx="80" cy="102" rx="46" ry="36" fill={color} />
      <path d="M56 68 L48 42 L68 60 Z" fill={color} />
      <path d="M104 68 L112 42 L92 60 Z" fill={color} />
      <ellipse cx="80" cy="112" rx="18" ry="14" fill="#fffaf5" />
      <path d="M66 94 Q68 90 72 94" stroke="#2a2333" strokeWidth="2.5" fill="none" strokeLinecap="round" />
      <circle cx="66" cy="94" r="6" fill={eyeColor} />
      <circle cx="94" cy="94" r="6" fill={eyeColor} />
      <path d="M80 106 L74 112 L86 112 Z" fill="#e89bb0" />
      <ellipse cx="120" cy="110" rx="16" ry="9" fill={color} opacity="0.7" />
    </g>
  );
}

function Maaneulv({ color, eyeColor }) {
  return (
    <g>
      <ellipse cx="80" cy="104" rx="44" ry="34" fill={color} />
      <path d="M52 66 L44 34 L68 58 Z" fill={color} />
      <path d="M108 66 L116 34 L92 58 Z" fill={color} />
      <path d="M56 40 L50 46 L60 50 Z" fill="#e8e3d9" opacity="0.6" />
      <path d="M104 40 L110 46 L100 50 Z" fill="#e8e3d9" opacity="0.6" />
      <ellipse cx="80" cy="114" rx="20" ry="15" fill="#eef0f7" />
      <circle cx="66" cy="96" r="6" fill={eyeColor} />
      <circle cx="94" cy="96" r="6" fill={eyeColor} />
      <path d="M80 108 L74 116 L86 116 Z" fill="#2a2333" />
      <ellipse cx="80" cy="70" rx="10" ry="6" fill="#c9e8ff" opacity="0.6" />
    </g>
  );
}

function Stjernedrage({ color, eyeColor }) {
  return (
    <g>
      <path d="M30 90 Q10 70 26 100 Q30 108 42 108 Z" fill={color} opacity="0.9" />
      <path d="M130 90 Q150 70 134 100 Q130 108 118 108 Z" fill={color} opacity="0.9" />
      <ellipse cx="80" cy="104" rx="36" ry="30" fill={color} />
      <path d="M64 78 Q80 62 96 78 Q86 80 80 88 Q74 80 64 78 Z" fill={color} />
      <ellipse cx="80" cy="112" rx="16" ry="11" fill="#fdf7e3" />
      <circle cx="68" cy="98" r="5.5" fill={eyeColor} />
      <circle cx="92" cy="98" r="5.5" fill={eyeColor} />
      <path d="M80 126 Q76 134 82 138 Q86 132 80 126 Z" fill={color} />
      <circle cx="80" cy="70" r="3" fill="#fff3c9" />
      <circle cx="68" cy="76" r="2" fill="#fff3c9" />
      <circle cx="92" cy="76" r="2" fill="#fff3c9" />
    </g>
  );
}
