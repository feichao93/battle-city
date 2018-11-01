import { useEffect, useRef } from 'react'

export default function useKeyboard(
  eventType: 'keydown',
  listener: (event: KeyboardEvent) => void,
) {
  useEffect(
    () => {
      document.addEventListener(eventType, listener)
      return () => document.removeEventListener(eventType, listener)
    },
    [eventType, listener],
  )
}
