import { describe, expect, it } from 'vitest'

import { DEFAULT_ERROR_MESSAGE, getErrorMessage } from './errorMessage'

describe('getErrorMessage', () => {
  it('returns a provided string message', () => {
    expect(getErrorMessage('Request failed')).toBe('Request failed')
  })

  it('returns the message from an Error instance', () => {
    expect(getErrorMessage(new Error('Network timeout'))).toBe('Network timeout')
  })

  it('returns the message from an error-like object', () => {
    expect(getErrorMessage({ message: 'Invalid payload' })).toBe(
      'Invalid payload',
    )
  })

  it('falls back to the default message for unknown values', () => {
    expect(getErrorMessage(null)).toBe(DEFAULT_ERROR_MESSAGE)
  })
})
