#!/usr/bin/env bun

// Simple placeholder icon generator for PWA
// Creates PNG icons with "S" letter on colored background

import { writeFileSync } from 'node:fs'

function generateSVG(size: number, isMaskable: boolean): string {
  const safeZone = isMaskable ? size * 0.2 : 0
  const contentSize = size - safeZone * 2
  const fontSize = contentSize * 0.6

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
  <rect width="${size}" height="${size}" fill="#2563eb"/>
  <text 
    x="${size / 2}" 
    y="${size / 2 + fontSize * 0.35}" 
    font-family="system-ui, -apple-system, sans-serif" 
    font-size="${fontSize}" 
    font-weight="700" 
    fill="white" 
    text-anchor="middle">S</text>
</svg>`
}

async function generatePNG(svgContent: string, outputPath: string) {
  // For now, just write the SVG and document that it needs conversion
  // In production, you'd use sharp or similar
  const svgPath = outputPath.replace('.png', '.svg')
  writeFileSync(svgPath, svgContent)
  console.log(`Generated ${svgPath}`)
  console.log(`  → Convert to PNG: convert ${svgPath} ${outputPath}`)
}

// Generate all required icons
const icons = [
  { size: 192, name: 'icon-192.png', maskable: false },
  { size: 512, name: 'icon-512.png', maskable: false },
  { size: 512, name: 'icon-maskable-512.png', maskable: true },
  { size: 180, name: 'apple-touch-icon.png', maskable: false }
]

const publicDir = './apps/webapp/public'

for (const icon of icons) {
  const svg = generateSVG(icon.size, icon.maskable)
  await generatePNG(svg, `${publicDir}/${icon.name}`)
}

console.log('\n✓ SVG placeholders generated')
console.log(
  '⚠ Note: These are SVG files. For production, convert to PNG using ImageMagick or similar.'
)
console.log(
  '  Example: for f in apps/webapp/public/*.svg; do convert "$f" "$(basename "$f" .svg).png"; done'
)
