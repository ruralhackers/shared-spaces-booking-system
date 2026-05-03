import type { Logger, LogParams } from '@dfs/common'

export const consoleLogger: Logger = {
  info: (msg, params?) => console.info(msg, params ?? ''),
  warn: (msg, params?) => console.warn(msg, params ?? ''),
  error: (msg, params?) => console.error(msg, params ?? ''),
  debug: (msg, params?) => console.debug(msg, params ?? ''),
  withSource: (source) => ({
    ...consoleLogger,
    info: (msg: string, params?: LogParams) => console.info(`[${source}]`, msg, params ?? ''),
    warn: (msg: string, params?: LogParams | Error) =>
      console.warn(`[${source}]`, msg, params ?? ''),
    error: (msg: string, params?: LogParams | Error) =>
      console.error(`[${source}]`, msg, params ?? ''),
    debug: (msg: string, params?: LogParams) => console.debug(`[${source}]`, msg, params ?? '')
  })
}
