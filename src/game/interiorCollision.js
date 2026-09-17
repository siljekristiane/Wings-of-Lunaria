export function resolveRects(x, y, radius, rects, bounds) {
  let nx = Math.max(bounds.minX + radius, Math.min(bounds.maxX - radius, x));
  let ny = Math.max(bounds.minY + radius, Math.min(bounds.maxY - radius, y));

  for (const r of rects) {
    const halfW = r.w / 2, halfH = r.h / 2;
    if (Math.abs(nx - r.x) < halfW + radius && Math.abs(ny - r.y) < halfH + radius) {
      const dxLeft = nx - (r.x - halfW - radius);
      const dxRight = (r.x + halfW + radius) - nx;
      const dyTop = ny - (r.y - halfH - radius);
      const dyBottom = (r.y + halfH + radius) - ny;
      const min = Math.min(dxLeft, dxRight, dyTop, dyBottom);
      if (min === dxLeft) nx = r.x - halfW - radius;
      else if (min === dxRight) nx = r.x + halfW + radius;
      else if (min === dyTop) ny = r.y - halfH - radius;
      else ny = r.y + halfH + radius;
    }
  }
  return { x: nx, y: ny };
}
