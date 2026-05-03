export interface LogParams {
  source?: string
  [key: string]: unknown
}

export interface Logger {
  info(message: string, params?: LogParams): void
  debug(message: string, params?: LogParams): void
  warn(message: string, params?: LogParams | Error): void
  error(message: string, params?: LogParams | Error): void
  withSource(source: string): Logger
}
