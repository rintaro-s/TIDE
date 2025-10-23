import React, { useEffect, useState } from 'react';
import { useTheme } from '../../contexts/ThemeContext';
import './Wallpaper.css';

export const Wallpaper: React.FC = () => {
  const { wallpaper } = useTheme();
  const [imageUrl, setImageUrl] = useState<string>('');

  useEffect(() => {
    const loadImage = async () => {
      if (wallpaper.enabled && wallpaper.imagePath) {
        try {
          // Read image file as base64
          const data = await window.electronAPI.fs.readFile(wallpaper.imagePath, 'base64');
          // Determine image type from extension
          const ext = wallpaper.imagePath.split('.').pop()?.toLowerCase();
          const mimeType = ext === 'png' ? 'image/png' : ext === 'jpg' || ext === 'jpeg' ? 'image/jpeg' : 'image/png';
          setImageUrl(`data:${mimeType};base64,${data}`);
        } catch (error) {
          console.error('Failed to load wallpaper image:', error);
          setImageUrl('');
        }
      } else {
        setImageUrl('');
      }
    };

    loadImage();
  }, [wallpaper.enabled, wallpaper.imagePath]);

  if (!wallpaper.enabled || !imageUrl) {
    return null;
  }

  return (
    <div 
      className="app-wallpaper"
      style={{
        backgroundImage: `url(${imageUrl})`,
        opacity: wallpaper.opacity / 100,
        filter: `brightness(${wallpaper.brightness}%)`
      }}
    />
  );
};
