export interface Theme {
  strokeWidth: number;
  borderRadius: number;
  fontSize: number;
  defaultBg: string;
}

export const THEMES: Record<string, Theme> = {
  default: {
    strokeWidth: 2,
    borderRadius: 8,
    fontSize: 24,
    defaultBg: '#e0e0e0',
  },
  clean: {
    strokeWidth: 1,
    borderRadius: 4,
    fontSize: 20,
    defaultBg: '#f0f0f0',
  },
  bold: {
    strokeWidth: 3,
    borderRadius: 12,
    fontSize: 28,
    defaultBg: '#d0d0d0',
  },
};

export function getTheme(name?: string): Theme {
  if (!name) return THEMES.default;
  const theme = THEMES[name];
  if (!theme) {
    throw new Error(
      `Unknown theme "${name}". Available themes: ${Object.keys(THEMES).join(', ')}`,
    );
  }
  return theme;
}
