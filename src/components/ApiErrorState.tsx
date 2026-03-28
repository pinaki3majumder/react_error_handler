import axios from 'axios'
import { useEffect, useRef } from 'react'

type ApiErrorStateProps = {
  apiName: string
  componentName: string
  functionName: string
  errorCode: string
  httpStatus: string
  errorMessage: string
  missingDetails?: string
  retryAttempts?: number
  maxRetries?: number
  retryLabel?: string
  fallbackLabel?: string
  onRetry: () => void
  onFallbackAction: () => void
}

function ApiErrorState({
  apiName,
  componentName,
  functionName,
  errorCode,
  httpStatus,
  errorMessage,
  missingDetails,
  retryAttempts = 0,
  maxRetries = 2,
  retryLabel = 'Retry',
  fallbackLabel = 'Back to home page',
  onRetry,
  onFallbackAction,
}: ApiErrorStateProps) {
  const lastLoggedErrorKeyRef = useRef<string | null>(null)
  const canRetry = retryAttempts < maxRetries

  useEffect(() => {
    const errorLogPayload = {
      apiName,
      componentName,
      functionName,
      errorCode,
      httpStatus,
      errorMessage,
      missingDetails,
      retryAttempts,
    }

    const errorLogKey = JSON.stringify(errorLogPayload)

    if (lastLoggedErrorKeyRef.current === errorLogKey) {
      return
    }

    lastLoggedErrorKeyRef.current = errorLogKey

    void axios.post('/error-log', JSON.stringify(errorLogPayload), {
      headers: {
        'Content-Type': 'application/json',
      },
    })
  }, [
    apiName,
    componentName,
    errorCode,
    errorMessage,
    functionName,
    httpStatus,
    missingDetails,
    retryAttempts,
  ])

  function handleAction() {
    if (canRetry) {
      onRetry()
      return
    }

    onFallbackAction()
  }

  return (
    <section className="api-error-state" aria-live="polite">
      <h1>API failed</h1>
      <h2>Failed API: {apiName}</h2>
      <h3>
        Failed from: {componentName} {functionName}
      </h3>
      <h4>
        Error code: {errorCode} | HTTP status: {httpStatus}
      </h4>
      <h5>Backend message: {errorMessage}</h5>
      {missingDetails ? <h6>Missing in API response: {missingDetails}</h6> : null}

      <button type="button" className="api-error-state__button" onClick={handleAction}>
        {canRetry ? retryLabel : fallbackLabel}
      </button>
    </section>
  )
}

export default ApiErrorState
