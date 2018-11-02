import React, { useContext } from 'react'
import { Connect } from '../hooks/useProvider'
import ReduxContext from '../ReduxContext'
import buildSvg from '../utils/buildSvg'
import store from '../utils/store'

const cache = new Map<string, string>()

const IsBuildingCacheContext: any = React.createContext(false)
const IsUnderImageContext = React.createContext(false)

export function preload(ele: any) {
  let { type, props } = ele
  while (type !== Image) {
    ;({ type, props } = type(props))
  }
  DEV.ASSERT && console.assert(type === Image)
  const url = buildSvg(
    props.width,
    props.height,
    <Connect store={store} context={ReduxContext}>
      <IsBuildingCacheContext.Provider value={true}>
        {props.children}
      </IsBuildingCacheContext.Provider>
    </Connect>,
  )

  cache.set(props.imageKey, url)
}

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

export default function Image(props: ImageProps) {
  const isBuilding = useContext(IsBuildingCacheContext)
  const underImage = useContext(IsUnderImageContext)

  const { disabled = false, imageKey, width, height, transform, children, ...other } = props

  if (isBuilding || underImage || disabled || !cache.has(imageKey)) {
    return (
      // @ts-ignore
      <IsUnderImageContext.Provider value={true}>
        <g transform={transform} {...other}>
          {children}
        </g>
      </IsUnderImageContext.Provider>
    )
  } else {
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
