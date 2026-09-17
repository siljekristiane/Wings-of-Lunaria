export default function StartScreen({ hasSave, onStartNew, onContinue }) {
  return (
    <div className="start-screen">
      <div className="start-glow" />
      <h1 className="start-title">Wings of Lunaria</h1>
      <p className="start-subtitle">En rolig magisk verden av utforskning, vennskap og oppdagelser</p>
      <div className="start-actions">
        {hasSave && (
          <button className="btn btn--primary btn--big" onClick={onContinue}>Fortsett eventyret</button>
        )}
        <button className={hasSave ? 'btn btn--ghost btn--big' : 'btn btn--primary btn--big'} onClick={onStartNew}>
          {hasSave ? 'Start et nytt eventyr' : 'Begynn eventyret'}
        </button>
      </div>
    </div>
  );
}
