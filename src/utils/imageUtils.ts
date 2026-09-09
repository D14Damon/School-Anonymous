/**
 * Image Utilities for School Anonymous
 * Ensures all profile and post images are resized and cropped to exactly 500x500 square
 * and converted to Base64 data URLs for seamless Firebase / local storage.
 */

export async function processImageToBase64_500x500(file: File | Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = 500;
        canvas.height = 500;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Canvas 2D context unavailable'));
          return;
        }

        // High quality image smoothing
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';

        // Center crop math (object-fit: cover logic)
        const sourceAspect = img.width / img.height;
        const targetAspect = 1; // 500 / 500 = 1

        let sx = 0;
        let sy = 0;
        let sw = img.width;
        let sh = img.height;

        if (sourceAspect > targetAspect) {
          // Image is wider than tall -> crop sides
          sw = img.height * targetAspect;
          sx = (img.width - sw) / 2;
        } else {
          // Image is taller than wide -> crop top/bottom
          sh = img.width / targetAspect;
          sy = (img.height - sh) / 2;
        }

        // Draw cropped & resized image to 500x500 canvas
        ctx.drawImage(img, sx, sy, sw, sh, 0, 0, 500, 500);

        // Convert to Base64 string (JPEG format with 0.88 quality for optimal quality/size balance)
        const base64String = canvas.toDataURL('image/jpeg', 0.88);
        resolve(base64String);
      };
      img.onerror = () => reject(new Error('Failed to load image for processing'));
      img.src = event.target?.result as string;
    };
    reader.onerror = () => reject(new Error('Failed to read image file'));
    reader.readAsDataURL(file);
  });
}

/**
 * Creates a gothic procedural 500x500 Base64 canvas image
 * Used for initial seeding so all mock images are true 500x500 Base64 strings.
 */
export function generateGothicCanvasBase64(
  title: string,
  subtitle: string,
  variant: 'raven' | 'cathedral' | 'candle' | 'crypt' | 'skull' | 'rose' = 'cathedral'
): string {
  const canvas = document.createElement('canvas');
  canvas.width = 500;
  canvas.height = 500;
  const ctx = canvas.getContext('2d');
  if (!ctx) return '';

  // Background gradient
  const bgGrad = ctx.createRadialGradient(250, 250, 50, 250, 250, 300);
  if (variant === 'rose') {
    bgGrad.addColorStop(0, '#2d0e14');
    bgGrad.addColorStop(1, '#0c0709');
  } else if (variant === 'candle') {
    bgGrad.addColorStop(0, '#2b1b0e');
    bgGrad.addColorStop(1, '#0d0905');
  } else if (variant === 'raven') {
    bgGrad.addColorStop(0, '#151928');
    bgGrad.addColorStop(1, '#07090f');
  } else {
    bgGrad.addColorStop(0, '#1e212b');
    bgGrad.addColorStop(1, '#090a0e');
  }
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, 0, 500, 500);

  // Gothic borders & filigree
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.12)';
  ctx.lineWidth = 1;
  ctx.strokeRect(20, 20, 460, 460);
  ctx.strokeRect(30, 30, 440, 440);

  // Corner diamonds
  const corners = [
    [25, 25],
    [475, 25],
    [25, 475],
    [475, 475],
  ];
  ctx.fillStyle = '#b91c1c';
  corners.forEach(([x, y]) => {
    ctx.beginPath();
    ctx.arc(x, y, 4, 0, Math.PI * 2);
    ctx.fill();
  });

  // Center gothic emblem
  ctx.save();
  ctx.translate(250, 210);

  // Arch or Sigil
  ctx.strokeStyle = 'rgba(226, 232, 240, 0.35)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(0, 0, 90, Math.PI, 0, false);
  ctx.lineTo(90, 80);
  ctx.lineTo(-90, 80);
  ctx.closePath();
  ctx.stroke();

  // Decorative inner cross / rune
  ctx.strokeStyle = '#b91c1c';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(0, -60);
  ctx.lineTo(0, 60);
  ctx.moveTo(-45, -15);
  ctx.lineTo(45, -15);
  ctx.stroke();

  // Emoticon / Icon symbol representation in center
  ctx.font = '36px serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  const symbols = {
    raven: '𓅃',
    cathedral: '🏛️',
    candle: '🕯️',
    crypt: '🗝️',
    skull: '☠️',
    rose: '🥀',
  };
  ctx.fillStyle = '#f1f5f9';
  ctx.fillText(symbols[variant] || '✠', 0, 15);
  ctx.restore();

  // Typography
  ctx.textAlign = 'center';
  ctx.fillStyle = '#f8fafc';
  ctx.font = 'bold 22px Georgia, serif';
  ctx.fillText(title.toUpperCase(), 250, 370);

  ctx.fillStyle = '#94a3b8';
  ctx.font = 'italic 14px Georgia, serif';
  ctx.fillText(subtitle, 250, 405);

  ctx.fillStyle = 'rgba(185, 28, 28, 0.7)';
  ctx.font = '10px monospace';
  ctx.fillText('500 × 500  •  BASE64 CERTIFIED', 250, 440);

  return canvas.toDataURL('image/jpeg', 0.9);
}

/**
 * Returns the Anonymous Veil avatar (500x500 base64)
 */
export const ANONYMOUS_AVATAR_BASE64 = generateGothicCanvasBase64(
  'VEILED SCHOLAR',
  'Identity Masked in Shadows',
  'raven'
);
