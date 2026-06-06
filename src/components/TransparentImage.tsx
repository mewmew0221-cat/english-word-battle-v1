import React, { useState, useEffect } from 'react';

const imageCache: Record<string, string> = {};

interface TransparentImageProps {
  src: string;
  alt: string;
  className?: string;
}

export const TransparentImage: React.FC<TransparentImageProps> = ({ src, alt, className }) => {
  const [processedSrc, setProcessedSrc] = useState<string>(src);

  useEffect(() => {
    // If we have already processed this source, use the cached version
    if (imageCache[src]) {
      setProcessedSrc(imageCache[src]);
      return;
    }

    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        setProcessedSrc(src);
        return;
      }

      ctx.drawImage(img, 0, 0);
      try {
        const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imgData.data;

        // Use top-left pixel (0,0) as the background color key
        const keyR = data[0];
        const keyG = data[1];
        const keyB = data[2];
        const keyA = data[3];

        // If the top-left pixel is already transparent, we don't need chroma-keying
        if (keyA === 0) {
          setProcessedSrc(src);
          return;
        }

        // Color difference tolerance (Euclidean distance in RGB space)
        const tolerance = 40;

        for (let i = 0; i < data.length; i += 4) {
          const r = data[i];
          const g = data[i + 1];
          const b = data[i + 2];
          const a = data[i + 3];

          if (a > 0) {
            const dist = Math.sqrt(
              Math.pow(r - keyR, 2) +
              Math.pow(g - keyG, 2) +
              Math.pow(b - keyB, 2)
            );
            if (dist <= tolerance) {
              data[i + 3] = 0; // set alpha to 0 (transparent)
            }
          }
        }

        ctx.putImageData(imgData, 0, 0);
        const dataUrl = canvas.toDataURL('image/png');
        imageCache[src] = dataUrl;
        setProcessedSrc(dataUrl);
      } catch (err) {
        console.error('Failed to process image background removal:', err);
        setProcessedSrc(src);
      }
    };
    img.onerror = () => {
      setProcessedSrc(src);
    };
    img.src = src;
  }, [src]);

  return <img src={processedSrc} alt={alt} className={className} />;
};
