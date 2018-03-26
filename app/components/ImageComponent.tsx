import React from 'react'
import PropTypes from 'prop-types'
import { renderToString } from 'react-dom/server'
const withContext = require('recompose/withContext').default

const cache = new Map<string, string>()

class SimpleWrapper extends React.Component {
  render() {
    return React.Children.only(this.props.children)
  }
}

export interface StaticComponentConfig {
  disabled?: boolean
  key: string
  transform: string
  width: string | number
  height: string | number
}

export default abstract class ImageComponent<P = {}, S = {}> extends React.PureComponent<P, S> {
  static contextTypes = {
    store: PropTypes.any,
    underImageComponent: PropTypes.bool,
  }

  abstract getConfig(): StaticComponentConfig
  abstract renderImageContent(): JSX.Element

  render() {
    const { store, underImageComponent } = this.context
    const { disabled = false, key, width, height, transform } = this.getConfig()

    if (disabled || underImageComponent) {
      // underImageComponent 不能嵌套，如果已经在一个 ImageComponent 下的话，那么只能使用原始的render方法
      return <g transform={transform}>{this.renderImageContent()}</g>
    } else {
      if (!cache.has(key)) {
        const rawElement = this.renderImageContent()
        const open = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}">`
        const enhancer = withContext(
          { underImageComponent: PropTypes.bool, store: PropTypes.any },
          () => ({
            underImageComponent: true,
            store,
          }),
        )
        const element = React.createElement(enhancer(SimpleWrapper), null, rawElement)
        const string = renderToString(element)
        const close = '</svg>'
        const markup = open + string + close
        const blob = new Blob([markup], { type: 'image/svg+xml' })
        const url = URL.createObjectURL(blob)
        cache.set(key, url)
      }
      return <image transform={transform} href={cache.get(key)} />
    }
  }
}
