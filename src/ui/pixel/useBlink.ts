import { useEffect, useState } from 'react'

/** 像素提示文字的闪烁：每 500ms 切换一次可见 */
export default function useBlink(): boolean {
  const [visible, setVisible] = useState(true)
  useEffect(() => {
    const handle = setInterval(() => setVisible((v) => !v), 500)
    return () => clearInterval(handle)
  }, [])
  return visible
}
