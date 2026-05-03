#!/usr/bin/env bun
import { mkdir, writeFile } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'

import { tokens } from '../src/tokens.ts'

type Primitive = string | number

function flatten(
  obj: Record<string, unknown>,
  prefix: string,
  sep: string,
  out: Record<string, Primitive>
) {
  for (const [key, value] of Object.entries(obj)) {
    const name = key === 'DEFAULT' ? prefix : prefix ? `${prefix}${sep}${key}` : key
    if (value && typeof value === 'object' && !Array.isArray(value)) {
      flatten(value as Record<string, unknown>, name, sep, out)
    } else {
      out[name] = value as Primitive
    }
  }
}

function toCssValue(key: string, value: Primitive): string {
  if (typeof value === 'number') {
    return key.startsWith('space-') || key.startsWith('radius-') ? `${value}px` : String(value)
  }
  return value
}

function buildCss(): string {
  const flat: Record<string, Primitive> = {}
  flatten(tokens as unknown as Record<string, unknown>, '', '-', flat)

  const lines = Object.entries(flat)
    .map(([key, value]) => `  --${key}: ${toCssValue(key, value)};`)
    .sort((a, b) => a.localeCompare(b))

  return `:root {\n${lines.join('\n')}\n}\n`
}

const outPath = resolve(import.meta.dir, '..', 'dist', 'tokens.css')
await mkdir(dirname(outPath), { recursive: true })
await writeFile(outPath, buildCss(), 'utf8')

console.log(`Wrote ${outPath}`)
