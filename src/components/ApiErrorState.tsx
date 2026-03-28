type ApiErrorStateProps = {
  apiName: string
  componentName: string
  functionName: string
  errorCode: string
  httpStatus: string
  errorMessage: string
  missingDetails?: string
  canRetry: boolean
  onAction: () => void
}

function ApiErrorState({
  apiName,
  componentName,
  functionName,
  errorCode,
  httpStatus,
  errorMessage,
  missingDetails,
  canRetry,
  onAction,
}: ApiErrorStateProps) {
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

      <button type="button" className="api-error-state__button" onClick={onAction}>
        {canRetry ? 'Retry' : 'Back to home page'}
      </button>
    </section>
  )
}

export default ApiErrorState
