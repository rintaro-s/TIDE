import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import './styles/global.css';

// グローバルオブジェクトをウィンドウとして定義
if (typeof (window as any).global === 'undefined') {
  (window as any).global = window;
}

// グローバルエラーハンドリング
window.addEventListener('error', (event) => {
  console.error('❌ Global Error:', event.error);
  console.error('Stack:', event.error?.stack);
  console.error('Message:', event.message);
  console.error('Filename:', event.filename, 'Line:', event.lineno, 'Col:', event.colno);
});

// Promise rejectハンドリング
window.addEventListener('unhandledrejection', (event) => {
  console.error('❌ Unhandled Promise Rejection:', event.reason);
  console.error('Promise:', event.promise);
});

// コンソールの拡張ロギング
const originalLog = console.log;
const originalError = console.error;
const originalWarn = console.warn;
const originalInfo = console.info;

console.log = function(...args: any[]) {
  originalLog('%c[LOG]', 'color: #4CAF50; font-weight: bold;', ...args);
};

console.error = function(...args: any[]) {
  originalError('%c[ERROR]', 'color: #f44336; font-weight: bold;', ...args);
};

console.warn = function(...args: any[]) {
  originalWarn('%c[WARN]', 'color: #FF9800; font-weight: bold;', ...args);
};

console.info = function(...args: any[]) {
  originalInfo('%c[INFO]', 'color: #2196F3; font-weight: bold;', ...args);
};

console.log('🚀 Starting Tova IDE...');
console.log('🌍 Window object:', typeof window !== 'undefined' ? 'Available' : 'Not available');
console.log('📦 React version:', React.version);

const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);

console.log('✅ React root created');

// Use StrictMode only in development
const isDev = process.env.NODE_ENV === 'development';

if (isDev) {
  root.render(
    <React.StrictMode>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </React.StrictMode>
  );
} else {
  root.render(
    <BrowserRouter>
      <App />
    </BrowserRouter>
  );
}

console.log('✅ App rendered');