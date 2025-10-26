// Logger and Toast Notification System

export type LogLevel = 'info' | 'success' | 'warning' | 'error' | 'debug';

export interface LogEntry {
  id: string;
  level: LogLevel;
  message: string;
  details?: string;
  timestamp: Date;
  command?: string;
}

class Logger {
  private logs: LogEntry[] = [];
  private listeners: ((log: LogEntry) => void)[] = [];
  private maxLogs = 1000;

  log(level: LogLevel, message: string, details?: string | Record<string, any>, command?: string) {
    // detailsがオブジェクトの場合は文字列化
    const detailsStr = typeof details === 'object' && details !== null 
      ? JSON.stringify(details, null, 2) 
      : details;

    const entry: LogEntry = {
      id: `${Date.now()}-${Math.random()}`,
      level,
      message,
      details: detailsStr,
      timestamp: new Date(),
      command
    };

    this.logs.push(entry);
    
    // 最大ログ数を超えたら古いものを削除
    if (this.logs.length > this.maxLogs) {
      this.logs.shift();
    }

    // コンソールにも出力
    const prefix = `[${level.toUpperCase()}] ${entry.timestamp.toLocaleTimeString()}`;
    const fullMessage = `${prefix} ${message}${detailsStr ? '\n' + detailsStr : ''}${command ? '\nCommand: ' + command : ''}`;
    
    switch (level) {
      case 'error':
        console.error(fullMessage);
        break;
      case 'warning':
        console.warn(fullMessage);
        break;
      case 'debug':
        console.debug(fullMessage);
        break;
      default:
        console.log(fullMessage);
    }

    // リスナーに通知
    this.listeners.forEach(listener => listener(entry));
  }

  info(message: string, details?: string | Record<string, any>, command?: string) {
    this.log('info', message, details, command);
  }

  success(message: string, details?: string | Record<string, any>, command?: string) {
    this.log('success', message, details, command);
  }

  warning(message: string, details?: string | Record<string, any>, command?: string) {
    this.log('warning', message, details, command);
  }

  error(message: string, details?: string | Record<string, any>, command?: string) {
    this.log('error', message, details, command);
  }

  debug(message: string, details?: string | Record<string, any>, command?: string) {
    this.log('debug', message, details, command);
  }

  getLogs(): LogEntry[] {
    return [...this.logs];
  }

  subscribe(listener: (log: LogEntry) => void) {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  clear() {
    this.logs = [];
  }
}

export const logger = new Logger();

// Toast notification helper
export interface Toast {
  id: string;
  type: 'info' | 'success' | 'warning' | 'error';
  message: string;
  details?: string;
  duration?: number;
}

class ToastManager {
  private toasts: Toast[] = [];
  private listeners: ((toasts: Toast[]) => void)[] = [];
  private timeoutHandles = new Map<string, ReturnType<typeof setTimeout>>();

  show(type: Toast['type'], message: string, details?: string, duration = 5000): string {
    const toast: Toast = {
      id: `toast-${Date.now()}-${Math.random()}`,
      type,
      message,
      details,
      duration
    };

    this.toasts.push(toast);
    this.notifyListeners();

    // ログにも記録
    logger.log(type, message, details);

    // 自動削除
    if (duration > 0) {
      const timeout = setTimeout(() => {
        this.remove(toast.id);
      }, duration);
      this.timeoutHandles.set(toast.id, timeout);
    }

    return toast.id;
  }

  info(message: string, details?: string, duration?: number): string {
    return this.show('info', message, details, duration);
  }

  success(message: string, details?: string, duration?: number): string {
    return this.show('success', message, details, duration);
  }

  warning(message: string, details?: string, duration?: number): string {
    return this.show('warning', message, details, duration);
  }

  error(message: string, details?: string, duration?: number): string {
    return this.show('error', message, details, duration);
  }

  remove(id: string) {
    const timeout = this.timeoutHandles.get(id);
    if (timeout) {
      clearTimeout(timeout);
      this.timeoutHandles.delete(id);
    }
    this.toasts = this.toasts.filter(t => t.id !== id);
    this.notifyListeners();
  }

  getToasts(): Toast[] {
    return [...this.toasts];
  }

  update(id: string, updates: Partial<Omit<Toast, 'id'>>) {
    const index = this.toasts.findIndex(t => t.id === id);
    if (index === -1) return;

    const current = this.toasts[index];
    const next: Toast = {
      ...current,
      ...updates,
      id: current.id
    };

    this.toasts[index] = next;
    this.notifyListeners();

    logger.log(next.type, next.message, next.details);

    if (updates.duration !== undefined) {
      const existing = this.timeoutHandles.get(id);
      if (existing) {
        clearTimeout(existing);
        this.timeoutHandles.delete(id);
      }

      if (updates.duration > 0) {
        const timeout = setTimeout(() => {
          this.remove(id);
        }, updates.duration);
        this.timeoutHandles.set(id, timeout);
      }
    }
  }

  subscribe(listener: (toasts: Toast[]) => void) {
    this.listeners.push(listener);
    listener(this.toasts); // 初期状態を通知
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  private notifyListeners() {
    this.listeners.forEach(listener => listener(this.toasts));
  }
}

export const toast = new ToastManager();

export default { logger, toast };
