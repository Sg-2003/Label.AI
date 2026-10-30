/**
 * Color utilities and accessible text contrast calculator according to Phase 12 specs.
 */

function channel(c: number): number {
  c /= 255;
  return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
}

export function luminance(hex: string): number {
  const cleanHex = hex.replace('#', '');
  const n = parseInt(cleanHex, 16);
  const r = (n >> 16) & 255;
  const g = (n >> 8) & 255;
  const b = n & 255;
  return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b);
}

export function readableTextColor(hex: string): string {
  try {
    const L = luminance(hex);
    const contrastWithWhite = 1.05 / (L + 0.05);
    const darkL = luminance('#0f172a');
    const contrastWithDark = (L + 0.05) / (darkL + 0.05);
    return contrastWithWhite >= contrastWithDark ? '#ffffff' : '#0f172a';
  } catch {
    return '#ffffff';
  }
}

// Preset accessible label color palette defined in Phase 12
export const PRESET_LABEL_COLORS = [
  '#22c55e', // Emerald Green (Positive / Yes / Good)
  '#ef4444', // Red (Negative / No / Bad)
  '#64748b', // Slate Gray (Neutral / Other)
  '#3b82f6', // Blue (Feature / Info)
  '#f59e0b', // Amber (Warning / Medium)
  '#8b5cf6', // Purple (Category / Intent)
  '#ec4899', // Pink (High Priority)
  '#06b6d4', // Cyan (Technical)
  '#10b981', // Teal
  '#6366f1', // Indigo
];

export function getNextLabelColor(existingCount: number): string {
  return PRESET_LABEL_COLORS[existingCount % PRESET_LABEL_COLORS.length];
}
