// Minimal line-icon set to keep the UI free of emoji, per the visual style brief.
export function IconBackpack(props) {
  return (
    <svg viewBox="0 0 24 24" width="20" height="20" {...props}>
      <path d="M9 7V6a3 3 0 0 1 6 0v1" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      <path d="M7 7h10a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V9a2 2 0 0 1 2-2Z" fill="none" stroke="currentColor" strokeWidth="1.6" />
      <path d="M9 7v3a3 3 0 0 0 6 0V7" fill="none" stroke="currentColor" strokeWidth="1.4" />
      <rect x="10" y="13" width="4" height="3" rx="0.6" fill="none" stroke="currentColor" strokeWidth="1.2" />
    </svg>
  );
}
export function IconJournal(props) {
  return (
    <svg viewBox="0 0 24 24" width="20" height="20" {...props}>
      <path d="M5 5.5A2 2 0 0 1 7 4h10a1 1 0 0 1 1 1v14a1 1 0 0 1-1 1H7a2 2 0 0 1-2-2Z" fill="none" stroke="currentColor" strokeWidth="1.6" />
      <path d="M12 4v16" stroke="currentColor" strokeWidth="1.2" opacity="0.5" />
    </svg>
  );
}
export function IconSparkle(props) {
  return (
    <svg viewBox="0 0 24 24" width="20" height="20" {...props}>
      <path d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8Z" fill="currentColor" />
    </svg>
  );
}
export function IconMenu(props) {
  return (
    <svg viewBox="0 0 24 24" width="20" height="20" {...props}>
      <path d="M4 7h16M4 12h16M4 17h16" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}
export function IconClose(props) {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" {...props}>
      <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}
export function IconStar(props) {
  return (
    <svg viewBox="0 0 24 24" width="16" height="16" {...props}>
      <path d="M12 3l2.6 6 6.4.5-4.9 4.2 1.6 6.3L12 16.8 6.3 20l1.6-6.3L3 9.5l6.4-.5Z" fill="currentColor" />
    </svg>
  );
}
