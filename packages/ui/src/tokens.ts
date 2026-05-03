export const tokens = {
  color: {
    background: {
      DEFAULT: 'hsl(0 0% 100%)',
      foreground: 'hsl(222 47% 11%)'
    },
    primary: {
      DEFAULT: 'hsl(222 47% 11%)',
      foreground: 'hsl(0 0% 98%)'
    },
    secondary: {
      DEFAULT: 'hsl(210 40% 96%)',
      foreground: 'hsl(222 47% 11%)'
    },
    muted: {
      DEFAULT: 'hsl(210 40% 96%)',
      foreground: 'hsl(215 16% 47%)'
    },
    accent: {
      DEFAULT: 'hsl(210 40% 96%)',
      foreground: 'hsl(222 47% 11%)'
    },
    destructive: {
      DEFAULT: 'hsl(0 84% 60%)',
      foreground: 'hsl(0 0% 98%)'
    },
    border: 'hsl(214 32% 91%)',
    input: 'hsl(214 32% 91%)',
    ring: 'hsl(222 84% 5%)'
  },
  radius: {
    sm: 4,
    md: 6,
    lg: 8
  },
  space: {
    1: 4,
    2: 8,
    3: 12,
    4: 16,
    6: 24,
    8: 32
  },
  font: {
    sans: 'Inter, system-ui, sans-serif'
  }
} as const

export type Tokens = typeof tokens
