import { useSettings } from './useSettings.ts';
import { useSystemTheme } from './useSystemTheme.ts';

type Theme = 'light' | 'dark' | 'black';

/**
 * Returns the actual theme being displayed (eg "light" or "dark")
 * regardless of whether that's by system theme or direct setting.
 */
const useTheme = (): Theme => {
  const { themeMode } = useSettings();
  const systemTheme = useSystemTheme();

  return themeMode === 'system' ? systemTheme : themeMode;
};

export { useTheme };
