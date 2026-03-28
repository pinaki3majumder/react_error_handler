import axios from 'axios'
import { useNavigate } from 'react-router-dom'
import { useState } from 'react'
import ApiErrorState from '../components/ApiErrorState'
import RenderErrorBoundary from '../components/RenderErrorBoundary'
import useRetryableRequest from '../hooks/useRetryableRequest'

type Quote = {
  id: number
  quote: string
  author: string
}

type QuoteRequestError = {
  errorCode: string
  httpStatus: string
  errorMessage: string
}

function BrokenAuthorCard() {
  const authorInfo: { name: string } | null = null

  return (
    <section className="quote-demo__crash">
      <h3>Component crash demo</h3>
      <p>
        This child component crashes while rendering its own content, so without an error boundary
        the whole visible React subtree breaks.
      </p>
      <p>{authorInfo!.name.toUpperCase()}</p>
    </section>
  )
}

type CrashMode = 'none' | 'without-boundary' | 'with-boundary'

function QuoteDemoPage() {
  const navigate = useNavigate()
  const [crashMode, setCrashMode] = useState<CrashMode>('none')

  function toQuoteRequestError(error: unknown): QuoteRequestError {
    if (axios.isAxiosError(error)) {
      return {
        errorCode: String(error.code ?? 'UNKNOWN'),
        httpStatus: error.response?.status ? String(error.response.status) : 'No HTTP response',
        errorMessage: error.message || 'Unable to load quote demo.',
      }
    }

    return {
      errorCode: 'UNKNOWN',
      httpStatus: 'No HTTP response',
      errorMessage: error instanceof Error ? error.message : 'Unable to load quote demo.',
    }
  }

  const {
    data: quote,
    error: requestError,
    loading,
    retry: handleRequestRetry,
    retryAttempts,
  } = useRetryableRequest<Quote, QuoteRequestError>({
    requestKey: 'quote-demo',
    mapError: toQuoteRequestError,
    request: async (signal) => {
      const response = await axios.get<Quote>('https://dummyjson.com/quotes/1', {
        signal,
      })

      return response.data
    },
  })

  if (requestError) {
    return (
      <ApiErrorState
        apiName="https://dummyjson.com/quotes/1"
        componentName="Quote Demo Page"
        functionName="loadQuote"
        errorCode={requestError.errorCode}
        httpStatus={requestError.httpStatus}
        errorMessage={requestError.errorMessage}
        retryAttempts={retryAttempts}
        onRetry={handleRequestRetry}
        onFallbackAction={() => navigate('/')}
      />
    )
  }

  return (
    <section className="resource-page">
      <header className="resource-page__header">
        <p className="resource-page__eyebrow">Crash demo</p>
        <h2>Quote demo: component crash without error boundary</h2>
        <p className="resource-page__description">
          This page loads <code>https://dummyjson.com/quotes/1</code> and then lets you trigger a
          child component crash inside the page layout. Because there is no error boundary around
          that child, the whole page breaks when the child component crashes.
        </p>
      </header>

      {loading ? <p className="resource-page__status">Loading quote...</p> : null}

      {quote ? (
        <article className="resource-card quote-demo">
          <p className="resource-card__id">#{quote.id}</p>
          <h3>{quote.author}</h3>
          <p className="resource-card__body">"{quote.quote}"</p>

          <div className="quote-demo__actions">
            <p className="quote-demo__note">
              This button mounts a nested child widget that crashes during its own render. The page
              shell is still trying to render, but without an error boundary the child crash takes
              down the visible route.
            </p>
            <button
              type="button"
              className="api-error-state__button"
              onClick={() => setCrashMode('without-boundary')}
            >
              Trigger component crash without Error boundary
            </button>
            <button
              type="button"
              className="api-error-state__button api-error-state__button--secondary"
              onClick={() => setCrashMode('with-boundary')}
            >
              Trigger component crash with Error boundary
            </button>
          </div>

          <section className="quote-demo__widget">
            <h4>Nested Author Widget</h4>
            <p className="quote-demo__note">
              This widget is safe until you mount the broken child component below. Try the two
              buttons above to compare the behavior.
            </p>
            {crashMode === 'without-boundary' ? <BrokenAuthorCard /> : null}
            {crashMode === 'with-boundary' ? (
              <RenderErrorBoundary
                componentName="Quote Demo Page"
                functionName="BrokenAuthorCard"
                onReset={() => setCrashMode('none')}
              >
                <BrokenAuthorCard />
              </RenderErrorBoundary>
            ) : null}
          </section>
        </article>
      ) : null}
    </section>
  )
}

export default QuoteDemoPage
