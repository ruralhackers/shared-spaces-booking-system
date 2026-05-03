import { describe, expect, test } from 'bun:test'
import { renderHook } from '@testing-library/react'
import { useDocumentTitle } from './use-document-title'

describe('The document title hook', () => {
  test('updates document.title when called with a string', () => {
    const originalTitle = document.title

    renderHook(() => useDocumentTitle('Casa Verde'))

    expect(document.title).toBe('Casa Verde')

    // Cleanup
    document.title = originalTitle
  })

  test('does not update document.title when called with undefined', () => {
    document.title = 'Original Title'

    renderHook(() => useDocumentTitle(undefined))

    expect(document.title).toBe('Original Title')
  })

  test('updates document.title when title changes', () => {
    const { rerender } = renderHook(({ title }) => useDocumentTitle(title), {
      initialProps: { title: 'First Title' }
    })

    expect(document.title).toBe('First Title')

    rerender({ title: 'Second Title' })

    expect(document.title).toBe('Second Title')
  })
})
