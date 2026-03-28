import { useEffect, useRef, useState } from 'react'

type UseRetryableRequestOptions<TData, TError> = {
  requestKey: string
  mapError: (error: unknown) => TError
  request: (signal: AbortSignal) => Promise<TData>
}

type UseRetryableRequestResult<TData, TError> = {
  data: TData | null
  error: TError | null
  loading: boolean
  retry: () => void
  retryAttempts: number
}

type KeyedValue<T> = {
  requestKey: string
  value: T | null
}

function useRetryableRequest<TData, TError>({
  requestKey,
  mapError,
  request,
}: UseRetryableRequestOptions<TData, TError>): UseRetryableRequestResult<TData, TError> {
  const mapErrorRef = useRef(mapError)
  const requestRef = useRef(request)
  const [dataState, setDataState] = useState<KeyedValue<TData>>({
    requestKey,
    value: null,
  })
  const [errorState, setErrorState] = useState<KeyedValue<TError>>({
    requestKey,
    value: null,
  })
  const [loadingState, setLoadingState] = useState({
    requestKey,
    value: true,
  })
  const [reloadToken, setReloadToken] = useState(0)
  const [retryAttempts, setRetryAttempts] = useState(0)

  mapErrorRef.current = mapError
  requestRef.current = request

  useEffect(() => {
    const controller = new AbortController()

    async function runRequest() {
      try {
        setLoadingState({
          requestKey,
          value: true,
        })

        const nextData = await requestRef.current(controller.signal)

        if (controller.signal.aborted) {
          return
        }

        setDataState({
          requestKey,
          value: nextData,
        })
        setErrorState({
          requestKey,
          value: null,
        })
        setRetryAttempts(0)
      } catch (requestError) {
        if (controller.signal.aborted) {
          return
        }

        setDataState({
          requestKey,
          value: null,
        })
        setErrorState({
          requestKey,
          value: mapErrorRef.current(requestError),
        })
      } finally {
        if (!controller.signal.aborted) {
          setLoadingState({
            requestKey,
            value: false,
          })
        }
      }
    }

    void runRequest()

    return () => controller.abort()
  }, [reloadToken, requestKey])

  function retry() {
    setRetryAttempts((count) => count + 1)
    setReloadToken((token) => token + 1)
  }

  return {
    data: dataState.requestKey === requestKey ? dataState.value : null,
    error: errorState.requestKey === requestKey ? errorState.value : null,
    loading: loadingState.requestKey === requestKey ? loadingState.value : true,
    retry,
    retryAttempts: errorState.requestKey === requestKey ? retryAttempts : 0,
  }
}

export default useRetryableRequest
