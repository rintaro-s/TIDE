import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

type Theme = 'dark' | 'light' | 'modern-blue' | 'liquid-glass' | 'material' | 'anime';

interface WallpaperSettings {
  enabled: boolean;
  imagePath?: string;
  opacity: number; // 0-100
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
    opacity: 30
  });

  useEffect(() => {
    // Load theme and wallpaper from electron store
    const loadSettings = async () => {
      try {
        if (window.electronAPI) {
          const savedTheme = await window.electronAPI.store.get('theme');
          if (savedTheme) {
            setTheme(savedTheme);
          }
          
          const savedWallpaper = await window.electronAPI.store.get('wallpaper');
          if (savedWallpaper) {
            setWallpaper(savedWallpaper);
          }
        }
      } catch (error) {
        console.error('Failed to load settings:', error);
      }
    };

    loadSettings();
  }, []);

  useEffect(() => {
    // Apply theme to document
    document.documentElement.setAttribute('data-theme', theme);
    
    // Save theme to electron store
    if (window.electronAPI) {
      window.electronAPI.store.set('theme', theme);
    }
  }, [theme]);

  useEffect(() => {
    // Apply wallpaper
    if (wallpaper.enabled && wallpaper.imagePath) {
      // Convert Windows path to file:// URL
      const normalizedPath = wallpaper.imagePath.replace(/\\/g, '/');
      const fileUrl = normalizedPath.startsWith('file://') 
        ? normalizedPath 
        : `file:///${normalizedPath}`;
      
      document.body.style.backgroundImage = `url("${fileUrl}")`;
      document.body.style.backgroundSize = 'cover';
      document.body.style.backgroundPosition = 'center';
      document.body.style.backgroundAttachment = 'fixed';
      document.body.style.backgroundRepeat = 'no-repeat';
      
      // Create overlay if it doesn't exist
      let overlay = document.querySelector('.wallpaper-overlay') as HTMLElement;
      if (!overlay) {
        overlay = document.createElement('div');
        overlay.className = 'wallpaper-overlay';
        overlay.style.position = 'fixed';
        overlay.style.top = '0';
        overlay.style.left = '0';
        overlay.style.right = '0';
        overlay.style.bottom = '0';
        overlay.style.backgroundColor = 'var(--bg-primary)';
        overlay.style.pointerEvents = 'none';
        overlay.style.zIndex = '-1';
        document.body.appendChild(overlay);
      }
      overlay.style.opacity = String((100 - wallpaper.opacity) / 100);
    } else {
      document.body.style.backgroundImage = 'none';
      const overlay = document.querySelector('.wallpaper-overlay');
      if (overlay) {
        overlay.remove();
      }
    }
    
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