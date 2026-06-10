import { useState, useEffect } from 'react';

// Module-level cache so each unique sprite URL is only processed once
const cache = new Map<string, string>();

export function useChromaKey(src: string): string {
  const [out, setOut] = useState<string>(() => cache.get(src) ?? src);

  useEffect(() => {
    if (cache.has(src)) { setOut(cache.get(src)!); return; }

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
        const r = d[i], g = d[i + 1], b = d[i + 2];
        // Remove pixels where green dominates (chroma key green #00FF00 and residuals)
        if (g > 100 && g > r + 40 && g > b + 40) {
          d[i + 3] = 0;
        }
      }

      ctx.putImageData(imageData, 0, 0);
      canvas.toBlob((blob) => {
        if (!blob) return;
        const url = URL.createObjectURL(blob);
        cache.set(src, url);
        setOut(url);
      }, 'image/png');
    };
    img.src = src;
  }, [src]);

  return out;
}
