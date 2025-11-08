import React, { useEffect, useRef } from 'react';
import { useTheme } from '../../contexts/ThemeContext';
import './Wallpaper.css';

const Wallpaper: React.FC = () => {
  const { wallpaper, theme } = useTheme();
  const containerRef = useRef<HTMLDivElement>(null);

  // Convert local file path to a safe file:// URL (cross-platform)
  const toFileUrl = (p?: string): string | undefined => {
    if (!p) return undefined;
    // If already an URL (http/https/data), return as-is
    if (/^(https?:|data:)/i.test(p)) return p;
    // Normalize backslashes and ensure triple slash for Windows drive letters
    const normalized = p.replace(/\\/g, '/');
    const prefixed = normalized.startsWith('/') ? normalized : `/${normalized}`;
    return `file://${encodeURI(prefixed)}`;
  };

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const hasImage = Boolean(wallpaper.enabled && wallpaper.imagePath);

    // Toggle body class for wallpaper-aware styles
    if (hasImage) {
      document.body.classList.add('has-wallpaper');
    } else {
      document.body.classList.remove('has-wallpaper');
    }

    if (hasImage) {
      const url = toFileUrl(wallpaper.imagePath);
      el.style.backgroundImage = url ? `url(${url})` : 'none';
      el.style.backgroundSize = 'cover';
      el.style.backgroundPosition = 'center';
      el.style.backgroundRepeat = 'no-repeat';

      // Apply opacity (0-100 scale)
      const opacityValue = Math.max(0, Math.min(100, wallpaper.opacity ?? 70)) / 100;
      el.style.opacity = `${opacityValue}`;

      // Apply brightness filter (0-100)
      const brightnessValue = Math.max(0, Math.min(100, wallpaper.brightness ?? 100));
      el.style.filter = `brightness(${brightnessValue}%)`;
    } else {
      el.style.backgroundImage = 'none';
      el.style.opacity = '0';
      el.style.filter = '';
    }

    // Cleanup on unmount
    return () => {
      document.body.classList.remove('has-wallpaper');
    };
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
