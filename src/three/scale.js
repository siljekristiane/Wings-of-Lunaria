// The 2D prototype's layout (gameData.js) uses "pixel-ish" units in the
// thousands. S converts those into sane meter-scale 3D world units while
// keeping every landmark's relative position and size faithful to the
// original design.
export const S = 1 / 40;
export const sx = (v) => v * S;
