export const logAI = (...args: any[]) =>
  console.log('%c AILOG ', 'background: #666;color:white;font-weight: bold', ...args)

export const logNote = (...args: any[]) =>
  console.log('%c NOTE ', 'background: #222; color: #bada55', ...args)

export const logCommand = (...args: any[]) =>
  console.log('%c COMMAND ', 'background: #222; color: steelblue; font-weight: bold', ...args)

export const logAhead = (...args: any[]) => 0
