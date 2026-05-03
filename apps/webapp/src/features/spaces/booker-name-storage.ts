const BOOKER_NAME_KEY = 'booker-name'

export function readStoredBookerName(): string {
  if (typeof window === 'undefined') return ''
  return localStorage.getItem(BOOKER_NAME_KEY) ?? ''
}

export function writeStoredBookerName(name: string): void {
  if (typeof window === 'undefined') return
  localStorage.setItem(BOOKER_NAME_KEY, name)
}
