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
    
    // Apply wallpaper using CSS custom properties for better performance
    if (wallpaper.enabled && wallpaper.imagePath) {
      try {
        // Convert Windows path to file:// URL properly
        let normalizedPath = wallpaper.imagePath;
        
        // Replace backslashes with forward slashes
        normalizedPath = normalizedPath.replace(/\\/g, '/');
        
        // Remove any existing file:// protocol
        normalizedPath = normalizedPath.replace(/^file:\/+/, '');
        
        // Build proper file URL
        const fileUrl = `file:///${normalizedPath}`;
        
        console.log('📂 Original path:', wallpaper.imagePath);
        console.log('🔗 File URL:', fileUrl);
        
        // Calculate opacity for the overlay (invert the wallpaper opacity)
        // If wallpaper opacity is 30%, overlay should be 70% opaque to darken it
        const overlayOpacity = (100 - wallpaper.opacity) / 100;
        
        // Apply wallpaper to CSS custom properties
        document.documentElement.style.setProperty('--wallpaper-image', `url("${fileUrl}")`);
        document.documentElement.style.setProperty('--wallpaper-opacity', String(overlayOpacity));
        
        console.log('✅ Wallpaper CSS variables set');
        console.log('   --wallpaper-image:', `url("${fileUrl}")`);
        console.log('   --wallpaper-opacity:', overlayOpacity);
        
        // Debug: Check if CSS variables are actually applied
        const appliedImage = document.documentElement.style.getPropertyValue('--wallpaper-image');
        const appliedOpacity = document.documentElement.style.getPropertyValue('--wallpaper-opacity');
        console.log('🔍 CSS Variables verification:');
        console.log('   Applied --wallpaper-image:', appliedImage);
        console.log('   Applied --wallpaper-opacity:', appliedOpacity);
        
        // Add a class to body to indicate wallpaper is active
        document.body.classList.add('wallpaper-enabled');
        console.log('✅ Added wallpaper-enabled class to body');
        
        // Debug: Check if MainWorkspace element exists
        const mainWorkspace = document.querySelector('.main-workspace');
        if (mainWorkspace) {
          console.log('✅ MainWorkspace element found');
          const computedStyle = window.getComputedStyle(mainWorkspace, '::before');
          console.log('🔍 ::before pseudo-element background-image:', computedStyle.backgroundImage);
        } else {
          console.warn('⚠️ MainWorkspace element not found');
        }
        
      } catch (error) {
        console.error('❌ Failed to apply wallpaper:', error);
      }
    } else {
      // Remove wallpaper
      console.log('🚫 Removing wallpaper - enabled:', wallpaper.enabled, 'imagePath:', wallpaper.imagePath);
      document.documentElement.style.removeProperty('--wallpaper-image');
      document.documentElement.style.removeProperty('--wallpaper-opacity');
      document.body.classList.remove('wallpaper-enabled');
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