import { useEffect, useMemo, useRef } from 'react'

export default function useFileUploader(onFileOpen: (file: File) => void) {

  const ref = useRef<HTMLInputElement>(null)
  useEffect(
    () => {
      const form = document.createElement('form')

      const input = document.createElement('input')
      ref.current = input
      input.type = 'file'
      form.appendChild(input)

      const resetButton = document.createElement('input')
      resetButton.type = 'reset'
      form.appendChild(resetButton)

      input.addEventListener('change', listener)

      return () => {
        input.removeEventListener('change', listener)
        form.remove()
      }

      function listener() {
        const file = input.files[0]
        if (file) {
          resetButton.click()
          onFileOpen(file)
        }
      }
    },
    [onFileOpen],
  )

  const request = () => ref.current.click()
  return useMemo(() => request, [ref.current])
}
