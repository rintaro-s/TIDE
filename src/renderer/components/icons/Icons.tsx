import React from 'react';

interface IconProps {
  className?: string;
  size?: number;
  color?: string;
}

const createIcon = (path: string, viewBox = "0 0 24 24") => {
  const Icon: React.FC<IconProps> = ({ className, size = 24, color = "currentColor" }) => (
    <svg
      className={className}
      width={size}
      height={size}
      viewBox={viewBox}
      fill="none"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d={path} />
    </svg>
  );
  return Icon;
};

export const Icons = {
  // Navigation and layout
  Menu: createIcon("M3 12h18M3 6h18M3 18h18"),
  X: createIcon("M18 6L6 18M6 6l12 12"),
  ChevronDown: createIcon("M6 9l6 6 6-6"),
  ChevronRight: createIcon("M9 18l6-6-6-6"),
  ChevronLeft: createIcon("M15 18l-6-6 6-6"),
  
  // File and folder operations
  File: createIcon("M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8zM14 2v6h6M16 13H8M16 17H8M10 9H8"),
  Folder: createIcon("M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"),
  FolderOpen: createIcon("M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"),
  Plus: createIcon("M12 5v14M5 12h14"),
  
  // Development tools
  Code: createIcon("M16 18l6-6-6-6M8 6l-6 6 6 6"),
  Terminal: createIcon("M4 17l6-6-6-6M12 19h8"),
  Settings: createIcon("M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2zM12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z"),
  
  // Communication and collaboration  
  Users: createIcon("M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75M13 7a4 4 0 1 1-8 0 4 4 0 0 1 8 0z"),
  MessageCircle: createIcon("M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"),
  Send: createIcon("M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z"),
  
  // Status and actions
  Check: createIcon("M20 6L9 17l-5-5"),
  AlertTriangle: createIcon("M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0zM12 9v4M12 17h.01"),
  Info: createIcon("M12 16v-4M12 8h.01"),
  
  // Media and content
  Book: createIcon("M4 19.5A2.5 2.5 0 0 1 6.5 17H20M4 19.5A2.5 2.5 0 0 0 6.5 22H20v-5H6.5A2.5 2.5 0 0 1 4 19.5zM2 3h20v14H4z"),
  Search: createIcon("M11 17a6 6 0 1 0 0-12 6 6 0 0 0 0 12zM21 21l-4.35-4.35"),
  
  // Build and upload
  Play: createIcon("M8 5v14l11-7z"),
  Upload: createIcon("M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M17 8l-5-5-5 5M12 3v12"),
  Download: createIcon("M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3"),
  
  // Network and connectivity
  Wifi: createIcon("M5 12.55a11 11 0 0 1 14 0M1.42 9a16 16 0 0 1 21.16 0M8.53 16.11a6 6 0 0 1 6.95 0M12 20h.01"),
  WifiOff: createIcon("M1 1l22 22M16.72 11.06A10.94 10.94 0 0 1 19 12.55M5 12.55a10.94 10.94 0 0 1 5.17-2.39M10.71 5.05A16 16 0 0 1 22.58 9M1.42 9a15.91 15.91 0 0 1 4.7-2.88M8.53 16.11a6 6 0 0 1 6.95 0M12 20h.01"),
  
  // Window controls
  Minimize: createIcon("M6 19h12"),
  Maximize: createIcon("M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3"),
  Close: createIcon("M18 6L6 18M6 6l12 12"),
  
  // Additional icons for specific features
  Cpu: createIcon("M4 16v-2.38C4 11.5 2.97 10.5 3 8.5A4.77 4.77 0 0 1 7.5 4c.66 0 1.32.27 1.77.74.46.47.73 1.17.73 1.76V8.5A4.77 4.77 0 0 1 14.5 4c.66 0 1.32.27 1.77.74.46.47.73 1.17.73 1.76V8.5A4.77 4.77 0 0 1 21.5 4c.66 0 1.32.27 1.77.74.46.47.73 1.17.73 1.76V10.5c0 1.63-.34 3.24-1 4.74A6.5 6.5 0 0 1 17 20h-4a6.5 6.5 0 0 1-6-4.76c-.66-1.5-1-3.11-1-4.74V8.5c0-.59.27-1.29.73-1.76C7.18 6.27 7.84 6 8.5 6A4.77 4.77 0 0 1 13 10.5v2.38A4.5 4.5 0 0 0 17.5 8.5c.66 0 1.32.27 1.77.74.46.47.73 1.17.73 1.76V16"),
  Database: createIcon("M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"),
  Monitor: createIcon("M8 21h8M12 17v4M6 13h.01M10 13h.01M14 13h.01M18 13h.01M7 13a4 4 0 0 1-4-4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v4a4 4 0 0 1-4 4z"),
  Package: createIcon("M16.5 9.4l-5-2.9L7 9.4M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"),
  Save: createIcon("M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"),
  Share: createIcon("M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8M16 6l-4-4-4 4M12 2v13"),
  Copy: createIcon("M20 9h-9a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h9a2 2 0 0 0 2-2v-9a2 2 0 0 0-2-2zM5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"),
  
  // Arduino specific
  Zap: createIcon("M13 2L3 14h9l-1 8 10-12h-9l1-8z"),
  Layers: createIcon("M12 2l10 6-10 6L2 8l10-6zM2 17l10 6 10-6M2 12l10 6 10-6")
};