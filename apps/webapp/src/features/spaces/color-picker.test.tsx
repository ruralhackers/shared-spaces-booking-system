import { afterEach, describe, expect, mock, test } from 'bun:test'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { ColorPicker } from './color-picker'

describe('The ColorPicker', () => {
  afterEach(cleanup)

  test('selecting a preset calls onChange with that hex', () => {
    const onChange = mock(() => {})
    render(<ColorPicker value={null} onChange={onChange} />)

    const swatch = screen.getByTitle('#3b82f6')
    fireEvent.click(swatch)

    expect(onChange).toHaveBeenCalledWith('#3b82f6')
  })

  test('clicking the selected preset calls onChange with null', () => {
    const onChange = mock(() => {})
    render(<ColorPicker value="#3b82f6" onChange={onChange} />)

    const swatch = screen.getByTitle('#3b82f6')
    fireEvent.click(swatch)

    expect(onChange).toHaveBeenCalledWith(null)
  })

  test('typing in input calls onChange with typed value', () => {
    const onChange = mock(() => {})
    render(<ColorPicker value={null} onChange={onChange} />)

    const input = screen.getByPlaceholderText('e.g. #3b82f6')
    fireEvent.change(input, { target: { value: '#aabbcc' } })

    expect(onChange).toHaveBeenCalledWith('#aabbcc')
  })
})
