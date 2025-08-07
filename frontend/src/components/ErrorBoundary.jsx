import React from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';
import './ErrorBoundary.css';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Error caught by ErrorBoundary:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      const isNetworkError = this.state.error?.message?.includes('chain') || 
                            this.state.error?.message?.includes('network') ||
                            this.state.error?.message?.includes('Unsupported chain');
      
      return (
        <div className="error-boundary">
          <div className="error-content">
            <AlertTriangle size={48} className="error-icon" />
            <h2>Something went wrong</h2>
            
            {isNetworkError ? (
              <div className="network-error">
                <h3>Network Configuration Issue</h3>
                <p>The application detected an unsupported network connection.</p>
                <div className="error-suggestions">
                  <h4>Try these solutions:</h4>
                  <ul>
                    <li>Switch to a supported testnet in your wallet (MetaMask, etc.)</li>
                    <li>Supported networks: Horizen Testnet, Sepolia, Hardhat Local, Polygon Mumbai</li>
                    <li>Refresh the page after switching networks</li>
                  </ul>
                </div>
              </div>
            ) : (
              <div className="general-error">
                <p>An unexpected error occurred. Please try refreshing the page.</p>
              </div>
            )}
            
            <div className="error-actions">
              <button 
                className="error-button primary"
                onClick={() => window.location.reload()}
              >
                <RefreshCw size={16} />
                Refresh Page
              </button>
              
              <button 
                className="error-button secondary"
                onClick={() => window.location.href = '/'}
              >
                <Home size={16} />
                Go Home
              </button>
            </div>
            
            {process.env.NODE_ENV === 'development' && (
              <details className="error-details">
                <summary>Error Details (Development)</summary>
                <pre className="error-stack">
                  {this.state.error?.message}
                  {this.state.error?.stack && (
                    <>
                      {'\n\nStack trace:\n'}
                      {this.state.error.stack}
                    </>
                  )}
                </pre>
              </details>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
