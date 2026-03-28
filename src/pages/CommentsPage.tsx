import axios from 'axios'
import { Link, useNavigate } from 'react-router-dom'
import ApiErrorState from '../components/ApiErrorState'
import useRetryableRequest from '../hooks/useRetryableRequest'

type Comment = {
  id: number
  body: string
  likes: number
  user: {
    username: string
    fullName?: string
  }
}

type CommentsResponse = {
  comments: Comment[]
}

type CommentsRequestError = {
  errorCode: string
  httpStatus: string
  errorMessage: string
}

function CommentsPage() {
  const navigate = useNavigate()

  function toCommentsRequestError(error: unknown): CommentsRequestError {
    if (axios.isAxiosError(error)) {
      return {
        errorCode: String(error.code ?? 'UNKNOWN'),
        httpStatus: error.response?.status ? String(error.response.status) : 'No HTTP response',
        errorMessage: error.message || 'Unable to load comments.',
      }
    }

    return {
      errorCode: 'UNKNOWN',
      httpStatus: 'No HTTP response',
      errorMessage: error instanceof Error ? error.message : 'Unable to load comments.',
    }
  }

  const {
    data: comments,
    error,
    loading,
    retry,
    retryAttempts,
  } = useRetryableRequest<Comment[], CommentsRequestError>({
    requestKey: 'comments-list',
    mapError: toCommentsRequestError,
    request: async (signal) => {
      const response = await axios.get<CommentsResponse>('https://dummyjson.com/comments', {
        signal,
      })

      return response.data.comments
    },
  })

  if (error) {
    return (
      <ApiErrorState
        apiName="https://dummyjson.com/comments"
        componentName="Comments Page"
        functionName="loadComments"
        errorCode={error.errorCode}
        httpStatus={error.httpStatus}
        errorMessage={error.errorMessage}
        retryAttempts={retryAttempts}
        onRetry={retry}
        onFallbackAction={() => navigate('/')}
      />
    )
  }

  return (
    <section className="resource-page">
      <header className="resource-page__header">
        <p className="resource-page__eyebrow">Comments</p>
        <h2>Comments list</h2>
        <p className="resource-page__description">
          Browse comments from <code>https://dummyjson.com/comments</code> and open a detail page
          for a single comment.
        </p>
      </header>

      {loading ? <p className="resource-page__status">Loading comments...</p> : null}

      {!loading && comments ? (
        <div className="resource-grid">
          {comments.slice(0, 12).map((comment) => (
            <article key={comment.id} className="resource-card comment-card">
              <p className="resource-card__id">#{comment.id}</p>
              <h3>{comment.user.fullName ?? comment.user.username}</h3>
              <p className="resource-card__body">{comment.body}</p>
              <div className="resource-card__meta">
                <span>@{comment.user.username}</span>
                <span>{comment.likes} likes</span>
              </div>
              <Link className="comment-card__link" to={`/comments/${comment.id}`}>
                Open detail
              </Link>
            </article>
          ))}
        </div>
      ) : null}
    </section>
  )
}

export default CommentsPage
