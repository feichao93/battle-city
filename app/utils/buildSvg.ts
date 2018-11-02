import { renderToStaticMarkup } from 'react-dom/server'

export default function buildSvg(width: number, height: number, element: any) {
  console.count('building svg')
  const open = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}">`
  const main = renderToStaticMarkup(element)
  const close = '</svg>'
  const blob = new Blob([open, main, close], { type: 'image/svg+xml' })
  return URL.createObjectURL(blob)
}
