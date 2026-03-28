import axios from 'axios'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import ApiErrorState from '../components/ApiErrorState'
import useRetryableRequest from '../hooks/useRetryableRequest'
import RenderErrorBoundary from '../components/RenderErrorBoundary'

type Post = {
  id: number
  title: string
  body: string
  tags: string[]
  reactions: {
    likes: number
    dislikes: number
  }
}

function CrashOnRender() {
  const brokenPost: { title: string } | null = null

  return (
    <div className="post-demo__crash">
      <h3>Render-time exception demo</h3>
      <p>{brokenPost!.title.toUpperCase()}</p>
    </div>
  )
}

type CrashMode = 'none' | 'without-boundary' | 'with-boundary'

type PostRequestError = {
  errorCode: string
  httpStatus: string
  errorMessage: string
}

function PostDemoPage() {
  const navigate = useNavigate()
  const [crashMode, setCrashMode] = useState<CrashMode>('none')

  function toPostRequestError(error: unknown): PostRequestError {
    if (axios.isAxiosError(error)) {
      return {
        errorCode: String(error.code ?? 'UNKNOWN'),
        httpStatus: error.response?.status ? String(error.response.status) : 'No HTTP response',
        errorMessage: error.message || 'Unable to load post demo.',
      }
    }

    return {
      errorCode: 'UNKNOWN',
      httpStatus: 'No HTTP response',
      errorMessage: error instanceof Error ? error.message : 'Unable to load post demo.',
    }
  }

  const {
    data: post,
    error: requestError,
    loading,
    retry: handleRequestRetry,
    retryAttempts,
  } = useRetryableRequest<Post, PostRequestError>({
    requestKey: 'post-demo',
    mapError: toPostRequestError,
    request: async (signal) => {
      const response = await axios.get<Post>('https://dummyjson.com/posts/1', {
        signal,
      })

      return response.data
    },
  })

  if (crashMode === 'without-boundary') {
    return <CrashOnRender />
  }

  if (crashMode === 'with-boundary') {
    return (
      <RenderErrorBoundary
        componentName="Post Demo Page"
        functionName="CrashOnRender"
        onReset={() => setCrashMode('none')}
      >
        <CrashOnRender />
      </RenderErrorBoundary>
    )
  }

  if (requestError) {
    return (
      <ApiErrorState
        apiName="https://dummyjson.com/posts/1"
        componentName="Post Demo Page"
        functionName="loadPost"
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
        <h2>Post demo: with and without error boundary</h2>
        <p className="resource-page__description">
          This page loads <code>https://dummyjson.com/posts/1</code> and gives you two crash
          buttons. One crashes the render tree without protection, and the other crashes inside an
          error boundary that shows the shared fallback UI.
        </p>
      </header>

      {loading ? <p className="resource-page__status">Loading post...</p> : null}

      {post ? (
        <article className="resource-card post-demo">
          <p className="resource-card__id">#{post.id}</p>
          <h3>{post.title}</h3>
          <p className="resource-card__body">{post.body}</p>
          <div className="resource-card__meta">
            <span>Likes {post.reactions.likes}</span>
            <span>Dislikes {post.reactions.dislikes}</span>
          </div>
          <div className="resource-card__meta">
            {post.tags.map((tag) => (
              <span key={tag}>#{tag}</span>
            ))}
          </div>

          <div className="post-demo__actions">
            <p className="post-demo__note">
              The first button will break the page because there is no error boundary around the
              crashing component. Refresh the page after testing it.
            </p>
            <button
              type="button"
              className="api-error-state__button"
              onClick={() => setCrashMode('without-boundary')}
            >
              Trigger render-time exception without Error boundary
            </button>
            <button
              type="button"
              className="api-error-state__button api-error-state__button--secondary"
              onClick={() => setCrashMode('with-boundary')}
            >
              Trigger render-time exception with Error boundary
            </button>
          </div>
        </article>
      ) : null}
    </section>
  )
}

export default PostDemoPage
