// Tova IDE Modern Design System
// モダンで洗練されたデザイン定義

export const colors = {
  // Primary Colors - シンプルでクリーンな配色
  primary: {
    50: '#f0f4ff',
    100: '#e0e9ff',
    200: '#c7d7fe',
    300: '#a5b8fc',
    400: '#818cf8',
    500: '#6366f1', // メインカラー
    600: '#4f46e5',
    700: '#4338ca',
    800: '#3730a3',
    900: '#312e81',
  },
  
  // Neutral Colors - グレースケール
  neutral: {
    0: '#ffffff',
    50: '#fafafa',
    100: '#f5f5f5',
    200: '#e5e5e5',
    300: '#d4d4d4',
    400: '#a3a3a3',
    500: '#737373',
    600: '#525252',
    700: '#404040',
    800: '#262626',
    900: '#171717',
    950: '#0a0a0a',
  },
  
  // Semantic Colors
  success: {
    light: '#d1fae5',
    main: '#10b981',
    dark: '#059669',
  },
  
  warning: {
    light: '#fef3c7',
    main: '#f59e0b',
    dark: '#d97706',
  },
  
  error: {
    light: '#fee2e2',
    main: '#ef4444',
    dark: '#dc2626',
  },
  
  info: {
    light: '#dbeafe',
    main: '#3b82f6',
    dark: '#2563eb',
  },
  
  // Background Colors - ほぼ白のグラデーション許可
  background: {
    primary: '#ffffff',
    secondary: '#fafafa',
    tertiary: '#f5f5f5',
    gradient: 'linear-gradient(135deg, #ffffff 0%, #fafafa 100%)',
    hover: '#f9fafb',
    active: '#f3f4f6',
  },
  
  // Border Colors
  border: {
    light: '#f0f0f0',
    main: '#e5e5e5',
    dark: '#d4d4d4',
    focus: '#6366f1',
  },
  
  // Text Colors
  text: {
    primary: '#171717',
    secondary: '#525252',
    tertiary: '#737373',
    disabled: '#a3a3a3',
    inverse: '#ffffff',
  },
  
  // Code Editor Colors
  editor: {
    background: '#ffffff',
    lineNumber: '#a3a3a3',
    selection: '#e0e9ff',
    cursor: '#6366f1',
    bracket: '#6366f1',
  },
};

export const typography = {
  fontFamily: {
    sans: '-apple-system, BlinkMacSystemFont, "Segoe UI", "Noto Sans", Helvetica, Arial, sans-serif',
    mono: '"SF Mono", Monaco, "Cascadia Code", "Roboto Mono", Consolas, "Courier New", monospace',
  },
  
  fontSize: {
    xs: '0.75rem',     // 12px
    sm: '0.875rem',    // 14px
    base: '1rem',      // 16px
    lg: '1.125rem',    // 18px
    xl: '1.25rem',     // 20px
    '2xl': '1.5rem',   // 24px
    '3xl': '1.875rem', // 30px
    '4xl': '2.25rem',  // 36px
  },
  
  fontWeight: {
    normal: 400,
    medium: 500,
    semibold: 600,
    bold: 700,
  },
  
  lineHeight: {
    tight: 1.25,
    normal: 1.5,
    relaxed: 1.75,
  },
  
  letterSpacing: {
    tight: '-0.025em',
    normal: '0',
    wide: '0.025em',
  },
};

export const spacing = {
  0: '0',
  1: '0.25rem',   // 4px
  2: '0.5rem',    // 8px
  3: '0.75rem',   // 12px
  4: '1rem',      // 16px
  5: '1.25rem',   // 20px
  6: '1.5rem',    // 24px
  8: '2rem',      // 32px
  10: '2.5rem',   // 40px
  12: '3rem',     // 48px
  16: '4rem',     // 64px
  20: '5rem',     // 80px
  24: '6rem',     // 96px
};

export const borderRadius = {
  none: '0',
  sm: '0.25rem',   // 4px
  base: '0.5rem',  // 8px
  md: '0.625rem',  // 10px
  lg: '0.75rem',   // 12px
  xl: '1rem',      // 16px
  '2xl': '1.5rem', // 24px
  full: '9999px',
};

export const shadows = {
  none: 'none',
  sm: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
  base: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px -1px rgba(0, 0, 0, 0.1)',
  md: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -2px rgba(0, 0, 0, 0.1)',
  lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -4px rgba(0, 0, 0, 0.1)',
  xl: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)',
  inner: 'inset 0 2px 4px 0 rgba(0, 0, 0, 0.05)',
  focus: '0 0 0 3px rgba(99, 102, 241, 0.1)',
};

export const transitions = {
  fast: 'all 0.15s ease',
  base: 'all 0.2s ease',
  slow: 'all 0.3s ease',
  spring: 'all 0.3s cubic-bezier(0.68, -0.55, 0.265, 1.55)',
};

export const zIndex = {
  dropdown: 1000,
  sticky: 1020,
  fixed: 1030,
  modalBackdrop: 1040,
  modal: 1050,
  popover: 1060,
  tooltip: 1070,
};

// Component Styles
export const components = {
  button: {
    base: `
      display: inline-flex;
      align-items: center;
      justify-content: center;
      font-family: ${typography.fontFamily.sans};
      font-weight: ${typography.fontWeight.medium};
      border-radius: ${borderRadius.md};
      transition: ${transitions.base};
      cursor: pointer;
      border: none;
      outline: none;
      user-select: none;
    `,
    
    sizes: {
      sm: `
        height: 2rem;
        padding: 0 ${spacing[3]};
        font-size: ${typography.fontSize.sm};
      `,
      md: `
        height: 2.5rem;
        padding: 0 ${spacing[4]};
        font-size: ${typography.fontSize.base};
      `,
      lg: `
        height: 3rem;
        padding: 0 ${spacing[6]};
        font-size: ${typography.fontSize.lg};
      `,
    },
    
    variants: {
      primary: `
        background: ${colors.primary[500]};
        color: ${colors.text.inverse};
        &:hover {
          background: ${colors.primary[600]};
          transform: translateY(-1px);
          box-shadow: ${shadows.md};
        }
        &:active {
          background: ${colors.primary[700]};
          transform: translateY(0);
        }
      `,
      secondary: `
        background: ${colors.background.secondary};
        color: ${colors.text.primary};
        border: 1px solid ${colors.border.main};
        &:hover {
          background: ${colors.background.hover};
          border-color: ${colors.border.dark};
        }
        &:active {
          background: ${colors.background.active};
        }
      `,
      ghost: `
        background: transparent;
        color: ${colors.text.secondary};
        &:hover {
          background: ${colors.background.hover};
          color: ${colors.text.primary};
        }
      `,
    },
  },
  
  input: {
    base: `
      width: 100%;
      height: 2.5rem;
      padding: 0 ${spacing[3]};
      font-family: ${typography.fontFamily.sans};
      font-size: ${typography.fontSize.sm};
      color: ${colors.text.primary};
      background: ${colors.background.primary};
      border: 1px solid ${colors.border.main};
      border-radius: ${borderRadius.md};
      transition: ${transitions.base};
      outline: none;
      
      &:hover {
        border-color: ${colors.border.dark};
      }
      
      &:focus {
        border-color: ${colors.border.focus};
        box-shadow: ${shadows.focus};
      }
      
      &::placeholder {
        color: ${colors.text.disabled};
      }
    `,
  },
  
  card: {
    base: `
      background: ${colors.background.primary};
      border: 1px solid ${colors.border.light};
      border-radius: ${borderRadius.lg};
      box-shadow: ${shadows.sm};
      transition: ${transitions.base};
      
      &:hover {
        box-shadow: ${shadows.md};
      }
    `,
  },
  
  panel: {
    base: `
      background: ${colors.background.primary};
      border-right: 1px solid ${colors.border.light};
      height: 100%;
      overflow: hidden;
      display: flex;
      flex-direction: column;
    `,
  },
};

export const layout = {
  sidebar: {
    width: {
      min: 250,
      default: 350,
      max: 600,
    },
  },
  
  titleBar: {
    height: 48,
  },
  
  statusBar: {
    height: 28,
  },
  
  toolbar: {
    height: 44,
  },
};

// Utility functions
export const hexToRgba = (hex: string, alpha: number): string => {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};

export const createGradient = (color1: string, color2: string, angle: number = 135): string => {
  return `linear-gradient(${angle}deg, ${color1} 0%, ${color2} 100%)`;
};

export default {
  colors,
  typography,
  spacing,
  borderRadius,
  shadows,
  transitions,
  zIndex,
  components,
  layout,
  hexToRgba,
  createGradient,
};
