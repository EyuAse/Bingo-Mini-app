import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  componentName?: string;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error(`🚨 [ErrorBoundary caught in ${this.props.componentName || 'Component'}]:`, error, errorInfo);
  }

  public handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback !== undefined) {
        return this.props.fallback;
      }

      return (
        <div style={{
          padding: '24px',
          margin: '16px auto',
          maxWidth: '400px',
          background: 'rgba(15, 23, 42, 0.95)',
          borderRadius: '16px',
          border: '1px solid rgba(239, 68, 68, 0.4)',
          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.5)',
          color: '#ffffff',
          textAlign: 'center',
          fontFamily: 'Inter, sans-serif'
        }}>
          <div style={{ fontSize: '2rem', marginBottom: '8px' }}>⚠️</div>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 700, margin: '0 0 8px 0', color: '#f87171' }}>
            Display Notice
          </h3>
          <p style={{ fontSize: '0.85rem', color: '#cbd5e1', margin: '0 0 16px 0', lineHeight: 1.4 }}>
            Something temporarily interrupted this view. Your balance and tickets remain 100% safe.
          </p>
          <button
            type="button"
            onClick={this.handleReset}
            style={{
              padding: '10px 20px',
              backgroundColor: '#16a34a',
              color: '#ffffff',
              border: 'none',
              borderRadius: '8px',
              fontWeight: 700,
              fontSize: '0.875rem',
              cursor: 'pointer'
            }}
          >
            🔄 Refresh View
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
