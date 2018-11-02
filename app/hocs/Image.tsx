import React from 'react'
import { renderToStaticMarkup } from 'react-dom/server'

const cache = new Map<string, string>()

const UnderImageContext = React.createContext(false)

export interface ImageProps {
  disabled?: boolean
  imageKey: string
  transform?: string
  width: string | number
  height: string | number
  children?: React.ReactNode
  className?: string
  style?: any
}

export default class Image extends React.PureComponent<ImageProps> {
  static contextType = UnderImageContext

  render() {
    const underImageComponent = this.context
    const { disabled = false, imageKey, width, height, transform, children, ...other } = this.props

    // TODO 优化性能？
    if (true) {
      // underImageComponent 不能嵌套，如果已经在一个 ImageComponent 下的话，那么只能使用原始的render方法
      return (
        <g transform={transform} {...other}>
          {children}
        </g>
      )
    } else {
      if (!cache.has(imageKey)) {
        DEV.LOG_PERF && console.time(`Image: loading content of ${imageKey}`)
        const open = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}">`
        const string = renderToStaticMarkup(
          <UnderImageContext.Provider value={true}>
            <g>{children}</g>
          </UnderImageContext.Provider>,
        )
        const close = '</svg>'
        const markup = open + string + close
        const blob = new Blob([markup], { type: 'image/svg+xml' })
        const url = URL.createObjectURL(blob)
        cache.set(imageKey, url)
        DEV.LOG_PERF && console.timeEnd(`Image: loading content of ${imageKey}`)
      }
      return (
        <image
          data-imagekey={imageKey}
          transform={transform}
          href={cache.get(imageKey)}
          width={width}
          height={height}
          {...other}
        />
      )
    }
  }
}
