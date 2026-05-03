import { useEffect } from 'react'

export function useDocumentTitle(title: string | undefined) {
  useEffect(() => {
    if (title !== undefined) {
      document.title = title
    }
  }, [title])
}
