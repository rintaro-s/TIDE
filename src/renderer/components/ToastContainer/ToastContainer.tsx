import React, { useEffect, useState } from 'react';
import styled from 'styled-components';
import { toast, Toast } from '../../utils/logger';

const ToastContainer: React.FC = () => {
  const [toasts, setToasts] = useState<Toast[]>([]);

  useEffect(() => {
    const unsubscribe = toast.subscribe(setToasts);
    return unsubscribe;
  }, []);

  return (
    <Container>
      {toasts.map((t) => (
        <ToastItem
          key={t.id}
          type={t.type}
          onClick={() => toast.remove(t.id)}
        >
          <ToastIcon type={t.type}>
            {getIcon(t.type)}
          </ToastIcon>
          <ToastContent>
            <ToastMessage>{t.message}</ToastMessage>
            {t.details && <ToastDetails>{t.details}</ToastDetails>}
          </ToastContent>
          <CloseButton onClick={() => toast.remove(t.id)}>
            ×
          </CloseButton>
        </ToastItem>
      ))}
    </Container>
  );
};

const getIcon = (type: Toast['type']) => {
  switch (type) {
    case 'success':
      return '✓';
    case 'error':
      return '✕';
    case 'warning':
      return '⚠';
    case 'info':
    default:
      return 'ℹ';
  }
};

const Container = styled.div`
  position: fixed;
  top: 60px;
  right: 20px;
  z-index: 10000;
  display: flex;
  flex-direction: column;
  gap: 12px;
  max-width: 400px;
`;

const ToastItem = styled.div<{ type: Toast['type'] }>`
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 16px;
  background: white;
  border-radius: 12px;
  box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -4px rgba(0, 0, 0, 0.1);
  border-left: 4px solid ${props => {
    switch (props.type) {
      case 'success': return '#10b981';
      case 'error': return '#ef4444';
      case 'warning': return '#f59e0b';
      case 'info': return '#3b82f6';
      default: return '#6366f1';
    }
  }};
  animation: slideIn 0.3s ease;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    transform: translateX(-4px);
    box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1);
  }

  @keyframes slideIn {
    from {
      transform: translateX(100%);
      opacity: 0;
    }
    to {
      transform: translateX(0);
      opacity: 1;
    }
  }
`;

const ToastIcon = styled.div<{ type: Toast['type'] }>`
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  font-size: 14px;
  font-weight: bold;
  flex-shrink: 0;
  background: ${props => {
    switch (props.type) {
      case 'success': return 'rgba(16, 185, 129, 0.1)';
      case 'error': return 'rgba(239, 68, 68, 0.1)';
      case 'warning': return 'rgba(245, 158, 11, 0.1)';
      case 'info': return 'rgba(59, 130, 246, 0.1)';
      default: return 'rgba(99, 102, 241, 0.1)';
    }
  }};
  color: ${props => {
    switch (props.type) {
      case 'success': return '#10b981';
      case 'error': return '#ef4444';
      case 'warning': return '#f59e0b';
      case 'info': return '#3b82f6';
      default: return '#6366f1';
    }
  }};
`;

const ToastContent = styled.div`
  flex: 1;
  min-width: 0;
`;

const ToastMessage = styled.div`
  font-size: 14px;
  font-weight: 500;
  color: #171717;
  margin-bottom: 4px;
`;

const ToastDetails = styled.div`
  font-size: 12px;
  color: #737373;
  word-wrap: break-word;
`;

const CloseButton = styled.button`
  width: 20px;
  height: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: transparent;
  border: none;
  color: #a3a3a3;
  font-size: 20px;
  line-height: 1;
  cursor: pointer;
  padding: 0;
  flex-shrink: 0;
  transition: color 0.2s ease;

  &:hover {
    color: #171717;
  }
`;

export default ToastContainer;
