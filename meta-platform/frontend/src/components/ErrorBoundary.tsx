import { Component, type ReactNode } from 'react'

interface Props { children: ReactNode }
interface State { error: Error | null }

export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null }

  static getDerivedStateFromError(error: Error): State {
    return { error }
  }

  componentDidCatch(error: Error, info: { componentStack: string }) {
    console.error('[ErrorBoundary]', error, info.componentStack)
  }

  render() {
    if (this.state.error) {
      return (
        <div className="fixed inset-0 z-[999] flex items-center justify-center bg-white p-8">
          <div className="max-w-xl w-full rounded-xl border border-red-200 bg-red-50 p-6">
            <h1 className="text-base font-semibold text-red-700 mb-2">
              🚨 Render Error
            </h1>
            <pre className="text-xs text-red-600 whitespace-pre-wrap break-words bg-red-100 rounded p-3 mb-4 max-h-64 overflow-y-auto">
              {this.state.error.message}
              {'\n\n'}
              {this.state.error.stack}
            </pre>
            <button
              onClick={() => this.setState({ error: null })}
              className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700"
            >
              Dismiss & retry
            </button>
          </div>
        </div>
      )
    }
    return this.props.children
  }
}
