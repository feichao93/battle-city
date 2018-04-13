import React from 'react'
import Popup from '../types/Popup'
import { BLOCK_SIZE as B, SCREEN_HEIGHT, SCREEN_WIDTH } from '../utils/constants'
import TextButton from './TextButton'
import TextWithLineWrap from './TextWithLineWrap'

export interface PopupHandle {
  showAlertPopup(message: string): Promise<void>
  showConfirmPopup(message: string): Promise<boolean>
  popup: React.ReactNode
}

export default class PopupProvider extends React.PureComponent<
  { children: (props: PopupHandle) => JSX.Element | null | false },
  { popup: Popup }
> {
  state = {
    popup: null as Popup,
  }

  private resolveConfirm: (ok: boolean) => void = null
  private resolveAlert: () => void = null

  showAlertPopup = (message: string) => {
    this.setState({
      popup: new Popup({ type: 'alert', message }),
    })
    return new Promise<void>(resolve => {
      this.resolveAlert = resolve
    })
  }

  showConfirmPopup = (message: string) => {
    this.setState({
      popup: new Popup({ type: 'confirm', message }),
    })
    return new Promise<boolean>(resolve => {
      this.resolveConfirm = resolve
    })
  }

  onConfirm = () => {
    this.resolveConfirm(true)
    this.resolveConfirm = null
    this.setState({ popup: null })
  }

  onCancel = () => {
    this.resolveConfirm(false)
    this.resolveConfirm = null
    this.setState({ popup: null })
  }

  onClickOkOfAlert = () => {
    this.resolveAlert()
    this.resolveAlert = null
    this.setState({ popup: null })
  }

  renderAlertPopup() {
    const { popup } = this.state
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
            onClick={this.onClickOkOfAlert}
          />
        </g>
      </g>
    )
  }

  renderConfirmPopup() {
    const { popup } = this.state
    return (
      <g className="popup-confirm">
        <rect x={0} y={0} width={SCREEN_WIDTH} height={SCREEN_HEIGHT} fill="transparent" />
        <g transform={`translate(${2.5 * B}, ${4.5 * B})`}>
          <rect x={-0.5 * B} y={-0.5 * B} width={12 * B} height={4 * B} fill="#e91e63" />
          <TextWithLineWrap x={0} y={0} fill="#333" maxLength={22} content={popup.message} />
          <TextButton x={7.5 * B} y={2 * B} textFill="#333" content="no" onClick={this.onCancel} />
          <TextButton x={9 * B} y={2 * B} textFill="#333" content="yes" onClick={this.onConfirm} />
        </g>
      </g>
    )
  }

  renderPopup() {
    const { popup } = this.state
    if (popup == null) {
      return null
    }
    if (popup.type === 'alert') {
      return this.renderAlertPopup()
    } else if (popup.type === 'confirm') {
      return this.renderConfirmPopup()
    } else {
      throw new Error(`Invalid popup type ${popup.type}`)
    }
  }

  render() {
    return this.props.children({
      showAlertPopup: this.showAlertPopup,
      showConfirmPopup: this.showConfirmPopup,
      popup: this.renderPopup(),
    })
  }
}
