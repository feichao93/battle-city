// eslint-disable-next-line no-undef
onmessage = function (event) {
  const message = JSON.parse(event.data)
  console.debug('[worker] receive', message)
  postMessage(message)
}
