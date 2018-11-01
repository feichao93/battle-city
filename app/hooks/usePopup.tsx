import React, { useRef, useState } from 'react'
import Popup from '../types/Popup'
import { BLOCK_SIZE as B, SCREEN_HEIGHT, SCREEN_WIDTH } from '../utils/constants'
import TextButton from '../components/TextButton'
import TextWithLineWrap from '../components/TextWithLineWrap'

interface PopupProps {
  popup: Popup
  onCancel(): void
  onConfirm(): void
  onClickOkOfAlert(): void
}

function renderPopup(props: PopupProps) {
  const { popup } = props
  if (popup == null) {
    return null
  }
  if (popup.type === 'alert') {
    return renderAlertPopup(props)
  } else if (popup.type === 'confirm') {
    return renderConfirmPopup(props)
  } else {
    throw new Error(`Invalid popup type ${popup.type}`)
  }
}

function renderAlertPopup({ popup, onClickOkOfAlert }: PopupProps) {
  return (
    <g className="popup-alert">
      <rect x={0} y={0} width={SCREEN_WIDTH} height={SCREEN_HEIGHT} fill="transparent" />
      <g transform={`translate(${2.5 * B}, ${4.5 * B})`}>
        <rect x={-0.5 * B} y={-0.5 * B} width={12 * B} height={4 * B} fill="#e91e63" />
        <TextWithLineWrap x={0} y={0} fill="#333" maxLength={22} content={popup.message} />
        <TextButton
          x={9.5 * B}
          y={2.25 * B}
          textFill="#333"
          content="OK"
          onClick={onClickOkOfAlert}
        />
      </g>
    </g>
  )
}

function renderConfirmPopup({ popup, onCancel, onConfirm }: PopupProps) {
  return (
    <g className="popup-confirm">
      <rect x={0} y={0} width={SCREEN_WIDTH} height={SCREEN_HEIGHT} fill="transparent" />
      <g transform={`translate(${2.5 * B}, ${4.5 * B})`}>
        <rect x={-0.5 * B} y={-0.5 * B} width={12 * B} height={4 * B} fill="#e91e63" />
        <TextWithLineWrap x={0} y={0} fill="#333" maxLength={22} content={popup.message} />
        <TextButton x={7.5 * B} y={2 * B} textFill="#333" content="no" onClick={onCancel} />
        <TextButton x={9 * B} y={2 * B} textFill="#333" content="yes" onClick={onConfirm} />
      </g>
    </g>
  )
}

export default function usePopup() {
  const [popup, setPopup] = useState<Popup>(null)
  const resolveConfirmRef = useRef<(ok: boolean) => void>(null)
  const resolveAlertRef = useRef<() => void>(null)

  const onConfirm = () => {
    resolveConfirmRef.current(true)
    resolveConfirmRef.current = null
    setPopup(null)
  }
  const onCancel = () => {
    resolveConfirmRef.current(false)
    resolveConfirmRef.current = null
    setPopup(null)
  }
  const onClickOkOfAlert = () => {
    resolveAlertRef.current()
    resolveAlertRef.current = null
    setPopup(null)
  }
  const showConfirmPopup = (message: string) => {
    setPopup(new Popup({ type: 'confirm', message }))
    return new Promise<boolean>(resolve => {
      resolveConfirmRef.current = resolve
    })
  }
  const showAlertPopup = (message: string) => {
    setPopup(new Popup({ type: 'alert', message }))
    return new Promise<void>(resolve => {
      resolveAlertRef.current = resolve
    })
  }

  const element = renderPopup({
    popup,
    onCancel,
    onConfirm,
    onClickOkOfAlert,
  })

  return { element, showConfirmPopup, showAlertPopup }
}
