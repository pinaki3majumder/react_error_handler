import { Component, type ErrorInfo, type ReactNode } from 'react'
import ApiErrorState from './ApiErrorState'

type RenderErrorBoundaryProps = {
  children: ReactNode
  componentName: string
  functionName: string
  onReset: () => void
}

type RenderErrorBoundaryState = {
  error: Error | null
}

class RenderErrorBoundary extends Component<
  RenderErrorBoundaryProps,
  RenderErrorBoundaryState
> {
  state: RenderErrorBoundaryState = {
    error: null,
  }

  static getDerivedStateFromError(error: Error): RenderErrorBoundaryState {
    return { error }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('RenderErrorBoundary caught an error:', error, errorInfo)
  }

  handleReset = () => {
    this.setState({ error: null })
    this.props.onReset()
  }

  render() {
    if (this.state.error) {
      return (
        <ApiErrorState
          apiName="Render tree"
          componentName={this.props.componentName}
          functionName={this.props.functionName}
          errorCode="RENDER_EXCEPTION"
          httpStatus="Not applicable"
          errorMessage={this.state.error.message}
          missingDetails="A render-time exception crashed this React subtree. The boundary caught it and rendered fallback UI."
          fallbackLabel="Reset demo"
          onRetry={this.handleReset}
          onFallbackAction={this.handleReset}
        />
      )
    }

    return this.props.children
  }
}

export default RenderErrorBoundary
