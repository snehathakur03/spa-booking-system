import React from 'react';
import { logger } from '../../utils/logger';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    logger.error('ERROR_BOUNDARY', error.message, info.componentStack);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          padding: '24px',
          background: '#1a1a2e',
          border: '1px solid #ef4444',
          borderRadius: '12px',
          color: '#ef4444',
          margin: '8px',
        }}>
          <div style={{ fontSize: '14px', fontWeight: 600, marginBottom: 8 }}>
            ⚠ Component Error
          </div>
          <div style={{ fontSize: '12px', color: '#fca5a5', fontFamily: 'monospace' }}>
            {this.state.error?.message}
          </div>
          <button
            onClick={() => this.setState({ hasError: false, error: null })}
            style={{
              marginTop: 12,
              padding: '6px 14px',
              background: '#ef4444',
              color: '#fff',
              border: 'none',
              borderRadius: 6,
              cursor: 'pointer',
              fontSize: 12,
            }}
          >
            Retry
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

export default ErrorBoundary;
