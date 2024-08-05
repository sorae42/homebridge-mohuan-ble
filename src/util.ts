const { round } = Math;

/** Convert {@link Colour.HSV HSV} to {@link Colour.RGB RGB}.
 *
 * See [HSL and HSV](https://en.wikipedia.org/wiki/HSL_and_HSV).
 * @param {integer} h - Hue, between 0˚ and 360˚.
 * @param {integer} s - Saturation, between 0% and 100%.
 * @param {integer} [v=100] - Value, between 0% and 100%.
 * @return {RGB} rgb - The corresponding {@link Colour.RGB RGB} value.
 */
export function hsvToRgb(h: number, s: number, v: number = 100) {
  let r: number, g: number, b: number;
  h /= 60.0;
  s /= 100.0;
  v /= 100.0;
  const C = v * s;
  const m = v - C;
  let x = (h % 2) - 1.0;
  if (x < 0) {
    x = -x;
  }
  x = C * (1.0 - x);
  switch (Math.floor(h) % 6) {
    case 0:
      r = C + m;
      g = x + m;
      b = m;
      break;
    case 1:
      r = x + m;
      g = C + m;
      b = m;
      break;
    case 2:
      r = m;
      g = C + m;
      b = x + m;
      break;
    case 3:
      r = m;
      g = x + m;
      b = C + m;
      break;
    case 4:
      r = x + m;
      g = m;
      b = C + m;
      break;
    case 5:
      r = C + m;
      g = m;
      b = x + m;
      break;
    default: 
      r = 255;
      g = 0;
      b = 0;
  }

  return [round(r * 255), round(g * 255), round(b * 255)];
}
