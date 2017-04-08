onmessage = function (event) {
  const message = JSON.parse(event.data)
  postMessage(message, '')
  console.debug('[worker] receive', message)
}
