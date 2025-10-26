import React, { useEffect, useRef } from 'react';
import { useTheme } from '../../contexts/ThemeContext';
import './Wallpaper.css';

const Wallpaper: React.FC = () => {
  const { wallpaper, theme } = useTheme();
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    // Apply wallpaper styling
    if (wallpaper.enabled && wallpaper.imagePath) {
      containerRef.current.style.backgroundImage = `url(file://${wallpaper.imagePath})`;
      containerRef.current.style.backgroundSize = 'cover';
      containerRef.current.style.backgroundPosition = 'center';
      containerRef.current.style.backgroundRepeat = 'no-repeat';
      
      // Apply opacity (0-100 scale)
      const opacityValue = (wallpaper.opacity || 70) / 100;
      containerRef.current.style.opacity = `${opacityValue}`;
    } else {
      containerRef.current.style.backgroundImage = 'none';
      containerRef.current.style.opacity = '1';
    }
  }, [wallpaper]);

  return (
    <div
      id="app-wallpaper-layer"
      ref={containerRef}
      className="wallpaper-container"
      data-surface="wallpaper"
    />
  );
};

export default Wallpaper;
