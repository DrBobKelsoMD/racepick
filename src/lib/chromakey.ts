import { useState, useEffect } from 'react';

const cache = new Map<string, string>();

// Alternating skin tones: light olive-tan and dark brown
const SKIN_TONES = [
  { r: 210, g: 155, b: 105 }, // olive/tan (light)
  { r: 110, g: 62,  b: 28  }, // dark brown
];

function hexToRgb(hex: string) {
  return {
    r: parseInt(hex.slice(1, 3), 16),
    g: parseInt(hex.slice(3, 5), 16),
    b: parseInt(hex.slice(5, 7), 16),
  };
}

export function useFootballSprite(src: string, jerseyHex: string, playerIndex: number): string {
  const skinIdx = playerIndex % 2;
  const cacheKey = `${src}|${jerseyHex}|${skinIdx}`;
  const [out, setOut] = useState<string>(() => cache.get(cacheKey) ?? src);

  useEffect(() => {
    if (!src) { setOut(''); return; }
    if (cache.has(cacheKey)) { setOut(cache.get(cacheKey)!); return; }

    const jersey = hexToRgb(jerseyHex);
    const skin = SKIN_TONES[skinIdx];

    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      const ctx = canvas.getContext('2d')!;
      ctx.drawImage(img, 0, 0);

      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const d = imageData.data;

      for (let i = 0; i < d.length; i += 4) {
        const r = d[i], g = d[i + 1], b = d[i + 2], a = d[i + 3];
        if (a < 10) continue;

        // Remove green screen
        if (g > 100 && g > r + 40 && g > b + 40) {
          d[i + 3] = 0;
          continue;
        }

        const brightness = (r + g + b) / 3;

        // Keep very dark outlines as-is
        if (brightness < 40) continue;

        // Skin pixels: warm orange-brown (R dominant over G, G dominant over B)
        if (r > 80 && r > g + 15 && g > b + 5 && brightness > 40 && brightness < 220) {
          const f = brightness / 120;
          d[i]     = Math.min(255, Math.round(skin.r * f));
          d[i + 1] = Math.min(255, Math.round(skin.g * f));
          d[i + 2] = Math.min(255, Math.round(skin.b * f));
          continue;
        }

        // Everything else (jersey, pants, helmet) → player's color with brightness shading
        const f = brightness / 220;
        d[i]     = Math.min(255, Math.round(jersey.r * f));
        d[i + 1] = Math.min(255, Math.round(jersey.g * f));
        d[i + 2] = Math.min(255, Math.round(jersey.b * f));
      }

      ctx.putImageData(imageData, 0, 0);
      canvas.toBlob((blob) => {
        if (!blob) return;
        const url = URL.createObjectURL(blob);
        cache.set(cacheKey, url);
        setOut(url);
      }, 'image/png');
    };
    img.src = src;
  }, [cacheKey]); // eslint-disable-line react-hooks/exhaustive-deps

  return out;
}
