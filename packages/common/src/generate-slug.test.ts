import { describe, expect, test } from 'bun:test'
import { generateSlug } from './generate-slug'

describe('The generateSlug utility', () => {
  test('converts to lowercase', () => {
    expect(generateSlug('Hello World')).toBe('hello-world')
  })

  test('strips accents', () => {
    expect(generateSlug('Café Résumé')).toBe('cafe-resume')
  })

  test('replaces non-alphanumeric characters with dashes', () => {
    expect(generateSlug('Sala S & M!')).toBe('sala-s-m')
  })

  test('trims leading and trailing dashes', () => {
    expect(generateSlug('  --hello--  ')).toBe('hello')
  })

  test('collapses multiple dashes into one', () => {
    expect(generateSlug('hello   world')).toBe('hello-world')
  })

  test('truncates to 60 characters', () => {
    const long = 'a'.repeat(80)

    const result = generateSlug(long)

    expect(result).toBe('a'.repeat(60))
  })

  test('handles a name that is exactly 60 chars after processing', () => {
    const name = 'a'.repeat(60)

    const result = generateSlug(name)

    expect(result).toBe('a'.repeat(60))
  })

  test('handles empty string', () => {
    const result = generateSlug('')

    expect(result).toBe('')
  })

  test('handles string with only special characters', () => {
    const result = generateSlug('!@#$%^&*()')

    expect(result).toBe('')
  })
})
