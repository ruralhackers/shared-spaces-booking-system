import { tokens } from './tokens'

type ColorValue = string | { DEFAULT: string; foreground?: string }

export function tailwindColors(): Record<string, ColorValue> {
  const result: Record<string, ColorValue> = {}
  for (const [key, value] of Object.entries(tokens.color)) {
    if (typeof value === 'string') {
      result[key] = value
    } else {
      result[key] = { DEFAULT: value.DEFAULT, foreground: value.foreground }
    }
  }
  return result
}

export function tailwindRadius(): Record<string, string> {
  const result: Record<string, string> = {}
  for (const [key, value] of Object.entries(tokens.radius)) {
    result[key] = `${value}px`
  }
  return result
}

export function tailwindSpacing(): Record<string, string> {
  const result: Record<string, string> = {}
  for (const [key, value] of Object.entries(tokens.space)) {
    result[key] = `${value}px`
  }
  return result
}

export function tailwindFontFamily(): Record<string, string[]> {
  return {
    sans: tokens.font.sans.split(',').map((s) => s.trim())
  }
}
