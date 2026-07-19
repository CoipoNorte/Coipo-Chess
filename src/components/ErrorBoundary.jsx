import { Component } from 'react'

/**
 * ErrorBoundary — Catches render errors and shows a fallback UI
 * instead of a blank/black screen.
 */
export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null, errorInfo: null }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }

  componentDidCatch(error, errorInfo) {
    console.error('[ErrorBoundary] Component crashed:', error, errorInfo)
    this.setState({ errorInfo })
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null, errorInfo: null })
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '40px 20px',
          gap: '16px',
          color: '#F0F0F0',
          textAlign: 'center',
          minHeight: '60vh',
        }}>
          <span style={{ fontSize: '3rem' }}>⚠️</span>
          <h2 style={{ fontSize: '1.2rem', fontWeight: 600 }}>Algo salió mal</h2>
          <p style={{ fontSize: '0.85rem', color: '#A0A0A0', maxWidth: '400px' }}>
            {this.state.error?.message || 'Error desconocido durante el renderizado.'}
          </p>
          <pre style={{
            fontSize: '0.7rem',
            color: '#606060',
            maxWidth: '500px',
            overflow: 'auto',
            whiteSpace: 'pre-wrap',
            background: 'rgba(255,255,255,0.03)',
            padding: '10px',
            borderRadius: '8px',
            border: '1px solid rgba(255,255,255,0.06)',
          }}>
            {this.state.error?.stack}
          </pre>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              onClick={this.handleRetry}
              style={{
                padding: '10px 20px',
                background: 'linear-gradient(135deg, #2F4F4F, #3A6A6A)',
                color: '#fff',
                border: 'none',
                borderRadius: '8px',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              🔄 Reintentar
            </button>
            <button
              onClick={() => window.location.href = '/'}
              style={{
                padding: '10px 20px',
                background: 'rgba(255,255,255,0.05)',
                color: '#A0A0A0',
                border: '1px solid rgba(255,255,255,0.08)',
                borderRadius: '8px',
                cursor: 'pointer',
              }}
            >
              🏠 Inicio
            </button>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}
