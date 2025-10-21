import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

type Theme = 'dark' | 'light' | 'modern-blue' | 'liquid-glass' | 'material' | 'anime';

export interface WallpaperSettings {
  enabled: boolean;
  imagePath?: string;
  opacity: number; // 0-100: 0=透明（見えない）, 100=完全不透明
  brightness: number; // 0-100: 0=完全に暗い, 100=明るい
}

interface ThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
  wallpaper: WallpaperSettings;
  setWallpaper: (settings: WallpaperSettings) => void;
}

export const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

interface ThemeProviderProps {
  children: ReactNode;
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
  const [theme, setTheme] = useState<Theme>('dark');
  const [wallpaper, setWallpaper] = useState<WallpaperSettings>({
    enabled: false,
    opacity: 70,
    brightness: 100
  });

  console.log('🎨 ThemeProvider initializing', { theme, wallpaper });

  useEffect(() => {
    console.log('📦 Loading theme and wallpaper settings...');
    // Load theme and wallpaper from electron store
    const loadSettings = async () => {
      try {
        if (window.electronAPI) {
          console.log('✅ electronAPI available');
          const savedTheme = await window.electronAPI.store.get('theme');
          if (savedTheme) {
            console.log('📁 Loaded theme:', savedTheme);
            setTheme(savedTheme);
          }
          
          const savedWallpaper = await window.electronAPI.store.get('wallpaper');
          if (savedWallpaper) {
            console.log('📁 Loaded wallpaper:', savedWallpaper);
            setWallpaper(savedWallpaper);
          }
        } else {
          console.warn('⚠️ electronAPI not available');
        }
      } catch (error) {
        console.error('❌ Failed to load settings:', error);
      }
    };

    loadSettings();
  }, []);

  useEffect(() => {
    console.log('🎨 Applying theme:', theme);
    // Apply theme to document
    document.documentElement.setAttribute('data-theme', theme);
    
    // Save theme to electron store
    if (window.electronAPI) {
      window.electronAPI.store.set('theme', theme);
    }
  }, [theme]);

  useEffect(() => {
    console.log('🖼️ Applying wallpaper settings...', wallpaper);
    
    // Save wallpaper settings
    if (window.electronAPI) {
      window.electronAPI.store.set('wallpaper', wallpaper);
    }
  }, [wallpaper]);

  const toggleTheme = () => {
    const themes: Theme[] = ['dark', 'light', 'modern-blue', 'liquid-glass', 'material', 'anime'];
    const currentIndex = themes.indexOf(theme);
    const nextIndex = (currentIndex + 1) % themes.length;
    setTheme(themes[nextIndex]);
  };

  return (
    <ThemeContext.Provider value={{ theme, setTheme, toggleTheme, wallpaper, setWallpaper }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = (): ThemeContextType => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};