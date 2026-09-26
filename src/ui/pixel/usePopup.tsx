import { useRef, useState, type ReactNode } from 'react'
import { BLOCK_SIZE as B, SCREEN_HEIGHT, SCREEN_WIDTH } from '../../engine/constants'
import { WrappedText } from './PixelText'
import { useMenuKeys } from '../menuKeys'
import TextButton from './TextButton'

type PopupState = { type: 'alert' | 'confirm'; message: string } | null

export interface PopupHandle {
  /** 渲染在 Screen 最上层的弹窗节点 */
  popup: ReactNode
  /** 弹窗打开期间由弹窗接管导航按键，页面自己的按键处理应暂停 */
  open: boolean
  showAlert(message: string): Promise<void>
  showConfirm(message: string): Promise<boolean>
}

/** 像素风 alert / confirm 弹窗，移植自原版 PopupProvider */
export default function usePopup(): PopupHandle {
  const [state, setState] = useState<PopupState>(null)
  const resolveRef = useRef<(ok: boolean) => void>(() => {})
  // confirm 的键盘焦点默认在 no，误按确认键不会执行删除、覆盖等操作
  const [yesFocused, setYesFocused] = useState(false)

  const open = (type: 'alert' | 'confirm', message: string) =>
    new Promise<boolean>((resolve) => {
      resolveRef.current = resolve
      setYesFocused(false)
      setState({ type, message })
    })

  const close = (ok: boolean) => {
    setState(null)
    resolveRef.current(ok)
  }

  // 关闭弹窗后 React 可能在两个 document 监听器之间重渲染，页面的监听器随之解除禁用；
  // 这里吞掉本次按键，所以页面必须在自己的 useMenuKeys 之前调用 usePopup
  useMenuKeys((key, e) => {
    e.stopImmediatePropagation()
    if (key === 'back') close(false)
    else if (key === 'confirm') close(state!.type === 'alert' || yesFocused)
    else if (key === 'left' || key === 'right') setYesFocused(!yesFocused)
  }, state != null)

  const popup =
    state == null ? null : (
      <g className={`popup-${state.type}`}>
        {/* 透明遮罩挡住下层按钮 */}
        <rect width={SCREEN_WIDTH} height={SCREEN_HEIGHT} fill="transparent" />
        <g transform={`translate(${2.5 * B}, ${4.5 * B})`}>
          <rect x={-0.5 * B} y={-0.5 * B} width={12 * B} height={4 * B} fill="#e91e63" />
          <WrappedText content={state.message} maxLength={22} fill="#333" />
          {state.type === 'alert' ? (
            <TextButton
              x={9.5 * B}
              y={2.25 * B}
              textFill="#333"
              content="OK"
              focused
              onClick={() => close(true)}
            />
          ) : (
            <>
              <TextButton
                x={7.5 * B}
                y={2 * B}
                textFill="#333"
                content="no"
                focused={!yesFocused}
                onClick={() => close(false)}
              />
              <TextButton
                x={9 * B}
                y={2 * B}
                textFill="#333"
                content="yes"
                focused={yesFocused}
                onClick={() => close(true)}
              />
            </>
          )}
        </g>
      </g>
    )

  return {
    popup,
    open: state != null,
    showAlert: async (message) => {
      await open('alert', message)
    },
    showConfirm: (message) => open('confirm', message),
  }
}
