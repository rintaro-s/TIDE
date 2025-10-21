import React, { ReactNode, ErrorInfo } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    console.error('🚨 Error Boundary caught error:', error);
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('❌ Error caught by boundary:');
    console.error('Error:', error);
    console.error('Component Stack:', errorInfo.componentStack);
    console.error('Error Info:', errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          height: '100vh',
          backgroundColor: '#1e1e1e',
          color: '#cccccc',
          fontFamily: 'Segoe UI, sans-serif',
          padding: '20px',
        }}>
          <h1 style={{ fontSize: '32px', marginBottom: '20px' }}>⚠️ エラーが発生しました</h1>
          <div style={{
            backgroundColor: '#2d2d30',
            padding: '20px',
            borderRadius: '8px',
            maxWidth: '600px',
            border: '1px solid #dc3545',
          }}>
            <p style={{ color: '#ff6b6b', marginBottom: '10px' }}>
              <strong>Error Message:</strong>
            </p>
            <pre style={{
              backgroundColor: '#1e1e1e',
              padding: '10px',
              borderRadius: '4px',
              overflow: 'auto',
              color: '#ce9178',
            }}>
              {this.state.error?.toString()}
            </pre>
            <p style={{ color: '#999', marginTop: '20px', fontSize: '12px' }}>
              詳細はデベロッパー コンソールを確認してください。
            </p>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;