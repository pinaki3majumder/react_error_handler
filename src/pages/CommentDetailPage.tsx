import axios from 'axios'
import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import ApiErrorState from '../components/ApiErrorState'
import RenderErrorBoundary from '../components/RenderErrorBoundary'
import useRetryableRequest from '../hooks/useRetryableRequest'

type CommentDetail = {
  id: number
  body: string
  likes: number
  user: {
    username: string
    fullName?: string
  }
}

type CommentDetailRequestError = {
  errorCode: string
  httpStatus: string
  errorMessage: string
}

type CommentViewModel = {
  body: string
  user: {
    username?: string
    fullName?: string
  }
}

function buildAuthorHeading(comment: CommentViewModel) {
  const authorName = comment.user.fullName ?? comment.user.username

  if (!authorName) {
    throw new Error('Comment author name is required to build the heading.')
  }

  return authorName.toUpperCase()
}

function ProtectedCommentHeading({ body }: { body: string }) {
  return (
    <div className="quote-demo__crash">
      <h4>{buildAuthorHeading({ body, user: {} })}</h4>
    </div>
  )
}

type InvalidStateMode = 'none' | 'without-boundary' | 'with-boundary'

function CommentDetailPage() {
  const navigate = useNavigate()
  const { id = '1' } = useParams()
  const [invalidStateMode, setInvalidStateMode] = useState<InvalidStateMode>('none')

  function toCommentDetailRequestError(error: unknown): CommentDetailRequestError {
    if (axios.isAxiosError(error)) {
      return {
        errorCode: String(error.code ?? 'UNKNOWN'),
        httpStatus: error.response?.status ? String(error.response.status) : 'No HTTP response',
        errorMessage: error.message || 'Unable to load comment detail.',
      }
    }

    return {
      errorCode: 'UNKNOWN',
      httpStatus: 'No HTTP response',
      errorMessage: error instanceof Error ? error.message : 'Unable to load comment detail.',
    }
  }

  const {
    data: comment,
    error,
    loading,
    retry,
    retryAttempts,
  } = useRetryableRequest<CommentDetail, CommentDetailRequestError>({
    requestKey: `comment-detail:${id}`,
    mapError: toCommentDetailRequestError,
    request: async (signal) => {
      const response = await axios.get<CommentDetail>(`https://dummyjson.com/comments/${id}`, {
        signal,
      })

      return response.data
    },
  })

  if (error) {
    return (
      <ApiErrorState
        apiName={`https://dummyjson.com/comments/${id}`}
        componentName="Comment Detail Page"
        functionName="loadCommentDetail"
        errorCode={error.errorCode}
        httpStatus={error.httpStatus}
        errorMessage={error.errorMessage}
        retryAttempts={retryAttempts}
        onRetry={retry}
        onFallbackAction={() => navigate('/comments')}
      />
    )
  }

  return (
    <section className="resource-page">
      <header className="resource-page__header">
        <p className="resource-page__eyebrow">Unexpected Error</p>
        <h2>Comment detail</h2>
        <p className="resource-page__description">
          This page loads <code>https://dummyjson.com/comments/{id}</code> and demonstrates a more
          realistic unexpected thrown error from the React tree. Instead of a static throw, a helper
          function throws because the UI receives invalid data for a required author heading.
        </p>
      </header>

      {loading ? <p className="resource-page__status">Loading comment detail...</p> : null}

      {comment ? (
        <article className="resource-card comment-card">
          <p className="resource-card__id">#{comment.id}</p>
          <h3>
            {buildAuthorHeading(
              invalidStateMode === 'without-boundary'
                ? {
                    body: comment.body,
                    user: {},
                  }
                : comment,
            )}
          </h3>
          <p className="resource-card__body">
            "
            {invalidStateMode === 'without-boundary'
              ? 'The author fields were removed before rendering this heading.'
              : comment.body}
            "
          </p>
          <div className="resource-card__meta">
            <span>@{comment.user.username}</span>
            <span>{comment.likes} likes</span>
          </div>

          <div className="comment-detail__actions">
            <p className="comment-detail__note">
              This button simulates a bad application state. The render path calls a helper that
              expects author data to exist, and that helper throws when the assumption is broken.
            </p>
            <button
              type="button"
              className="api-error-state__button"
              onClick={() => setInvalidStateMode('without-boundary')}
            >
              Trigger unexpected thrown error without Error boundary
            </button>
            <button
              type="button"
              className="api-error-state__button api-error-state__button--secondary"
              onClick={() => setInvalidStateMode('with-boundary')}
            >
              Trigger unexpected thrown error with Error boundary
            </button>
            <Link className="comment-card__link" to="/comments">
              Back to comments
            </Link>
          </div>

          {invalidStateMode === 'with-boundary' ? (
            <section className="comment-detail__widget">
              <h4>Protected Comment Heading Widget</h4>
              <p className="comment-detail__note">
                This uses the same broken assumption, but only this nested widget is wrapped in an
                error boundary. The rest of the page stays healthy.
              </p>
              <RenderErrorBoundary
                componentName="Comment Detail Page"
                functionName="ProtectedCommentHeading"
                onReset={() => setInvalidStateMode('none')}
              >
                <ProtectedCommentHeading body={comment.body} />
              </RenderErrorBoundary>
            </section>
          ) : null}
        </article>
      ) : null}
    </section>
  )
}

export default CommentDetailPage
