import axios from 'axios'
import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import ApiErrorState from '../components/ApiErrorState'
import {
  type Cart,
  type Recipe,
  type ResourceItem,
  type ResourceKey,
  type User,
  validateResourceResponse,
} from '../lib/resourceSchemas'

type ResourcePageProps = {
  title: string
  description: string
  endpoint: string
  resourceKey: ResourceKey
  emptyMessage: string
  pageName: string
  functionName: string
}

type ApiFailure = {
  errorCode: string
  httpStatus: string
  errorMessage: string
  missingDetails?: string
}

type ErrorLogPayload = {
  title: string
  description: string
  endpoint: string
  resourceKey: ResourceKey
  pageName: string
  functionName: string
  retryAttempts: number
  error: ApiFailure
}

function isUser(item: ResourceItem): item is User {
  return 'firstName' in item
}

function isRecipe(item: ResourceItem): item is Recipe {
  return 'cuisine' in item
}

function isCart(item: ResourceItem): item is Cart {
  return 'totalProducts' in item
}

function renderCardContent(item: ResourceItem) {
  if (isUser(item)) {
    return (
      <>
        <div className="resource-card__meta">
          <span>{item.email}</span>
          <span>{item.mobile}</span>
        </div>
        <p className="resource-card__body">
          {item.company?.name ?? 'Independent'}{' '}
          {item.company?.department ? `• ${item.company.department}` : ''}
        </p>
      </>
    )
  }

  if (isRecipe(item)) {
    return (
      <>
        <div className="resource-card__meta">
          <span>{item.cuisine}</span>
          <span>{item.difficulty}</span>
        </div>
        <p className="resource-card__body">
          Rating {item.rating}/5 • Cook time {item.cookTimeMinutes} min
        </p>
      </>
    )
  }

  if (isCart(item)) {
    return (
      <>
        <div className="resource-card__meta">
          <span>{item.totalProducts} products</span>
          <span>{item.totalQuantity} items</span>
        </div>
        <p className="resource-card__body">
          Total ${item.total} • Discounted ${item.discountedTotal}
        </p>
      </>
    )
  }

  return null
}

function getCardTitle(item: ResourceItem) {
  if (isUser(item)) {
    return `${item.firstName} ${item.lastName}`
  }

  if (isRecipe(item)) {
    return item.name
  }

  if (isCart(item)) {
    return `Cart #${item.id}`
  }

  return 'Item'
}

function ResourcePage({
  title,
  description,
  endpoint,
  resourceKey,
  emptyMessage,
  pageName,
  functionName,
}: ResourcePageProps) {
  const navigate = useNavigate()
  const lastLoggedErrorKeyRef = useRef<string | null>(null)
  const [items, setItems] = useState<ResourceItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<ApiFailure | null>(null)
  const [requestVersion, setRequestVersion] = useState(0)
  const [retryAttempts, setRetryAttempts] = useState(0)

  function getBackendMessage(error: unknown) {
    if (!axios.isAxiosError(error)) {
      return error instanceof Error ? error.message : 'Unable to load data.'
    }

    const responseData = error.response?.data

    if (typeof responseData === 'string' && responseData.trim()) {
      return responseData
    }

    if (
      responseData &&
      typeof responseData === 'object' &&
      'message' in responseData &&
      typeof responseData.message === 'string'
    ) {
      return responseData.message
    }

    if (responseData !== undefined) {
      try {
        return JSON.stringify(responseData)
      } catch {
        return error.message || 'Unable to load data.'
      }
    }

    return error.message || 'Unable to load data.'
  }

  function handleAction() {
    if (retryAttempts >= 2) {
      navigate('/')
      return
    }

    setRetryAttempts((count) => count + 1)
    setRequestVersion((version) => version + 1)
  }

  useEffect(() => {
    const controller = new AbortController()

    async function loadItems() {
      try {
        setLoading(true)
        setError(null)

        const response = await axios.get(endpoint, {
          signal: controller.signal,
        })
        const validation = validateResourceResponse(resourceKey, response.data)

        if (!validation.success) {
          setItems([])
          setError({
            errorCode: 'RESPONSE_SCHEMA_MISMATCH',
            httpStatus: response.status ? String(response.status) : 'No HTTP response',
            errorMessage: validation.errorMessage,
            missingDetails: validation.missingDetails,
          })
          return
        }

        setItems(validation.items)
        setRetryAttempts(0)
      } catch (err) {
        if (axios.isCancel(err)) {
          return
        }

        if (axios.isAxiosError(err)) {
          setItems([])
          setError({
            errorCode: String(err.code ?? 'UNKNOWN'),
            httpStatus: err.response?.status ? String(err.response.status) : 'No HTTP response',
            errorMessage: getBackendMessage(err),
          })
          return
        }

        setItems([])
        setError({
          errorCode: 'RESPONSE_SCHEMA_MISMATCH',
          httpStatus: 'No HTTP response',
          errorMessage: err instanceof Error ? err.message : 'Unable to load data.',
        })
      } finally {
        setLoading(false)
      }
    }

    void loadItems()

    return () => controller.abort()
  }, [endpoint, requestVersion, resourceKey])

  useEffect(() => {
    if (!error) {
      lastLoggedErrorKeyRef.current = null
      return
    }

    const errorLogPayload: ErrorLogPayload = {
      title,
      description,
      endpoint,
      resourceKey,
      pageName,
      functionName,
      retryAttempts,
      error,
    }

    const errorLogKey = JSON.stringify({
      title,
      description,
      endpoint,
      resourceKey,
      pageName,
      functionName,
      error,
    })

    if (lastLoggedErrorKeyRef.current === errorLogKey) {
      return
    }

    lastLoggedErrorKeyRef.current = errorLogKey

    void axios.post('/error-log', JSON.stringify(errorLogPayload), {
      headers: {
        'Content-Type': 'application/json',
      },
    })
  }, [description, endpoint, error, functionName, pageName, resourceKey, retryAttempts, title])

  if (error) {
    return (
      <ApiErrorState
        apiName={endpoint}
        componentName={pageName}
        functionName={functionName}
        errorCode={error.errorCode}
        httpStatus={error.httpStatus}
        errorMessage={error.errorMessage}
        missingDetails={error.missingDetails}
        canRetry={retryAttempts < 2}
        onAction={handleAction}
      />
    )
  }

  return (
    <section className="resource-page">
      <header className="resource-page__header">
        <p className="resource-page__eyebrow">Live data</p>
        <h2>{title}</h2>
        <p className="resource-page__description">{description}</p>
      </header>

      {loading ? <p className="resource-page__status">Loading data...</p> : null}
      {!loading && items.length === 0 ? (
        <p className="resource-page__status">{emptyMessage}</p>
      ) : null}

      {!loading && items.length > 0 ? (
        <div className="resource-grid">
          {items.map((item) => (
            <article key={item.id} className="resource-card">
              <p className="resource-card__id">#{item.id}</p>
              <h3>{getCardTitle(item)}</h3>
              {renderCardContent(item)}
            </article>
          ))}
        </div>
      ) : null}
    </section>
  )
}

export default ResourcePage
