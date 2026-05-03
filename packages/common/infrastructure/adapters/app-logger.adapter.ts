import { Logtail as BetterStackNodeLogger } from '@logtail/node'
import type { Logger, LogParams } from '../../domain/ports/logger.port'

type LogLevel = 'debug' | 'info' | 'warn' | 'error'

interface LogBackend {
  debug(message: string, params?: object): void
  info(message: string, params?: object): void
  warn(message: string, params?: object): void
  error(message: string, params?: object): void
}

function getServiceId(): string {
  if (typeof process !== 'undefined' && process.env?.HOSTNAME) {
    return process.env.HOSTNAME.slice(-5)
  }
  try {
    const os = require('node:os')
    return os.hostname().slice(-5)
  } catch {
    return 'local'
  }
}

export class AppLogger implements Logger {
  private static instance: AppLogger
  private readonly backend: LogBackend
  private readonly isProduction: boolean
  private readonly isTest: boolean
  private readonly shouldLogInTest: boolean
  private readonly source?: string
  private readonly serviceId: string

  private constructor(source?: string) {
    this.serviceId = getServiceId()
    this.isProduction = process.env.NODE_ENV === 'production'
    this.isTest = process.env.NODE_ENV === 'test'
    this.shouldLogInTest = Boolean(process.env.TEST_LOGGER)
    this.source = source
    this.backend = this.createBackend()
  }

  public static getInstance(): AppLogger {
    if (!AppLogger.instance) {
      AppLogger.instance = new AppLogger()
    }
    return AppLogger.instance
  }

  public withSource(source: string): Logger {
    return new AppLogger(source)
  }

  public debug(message: string, params?: LogParams): void {
    this.log('debug', message, params)
  }

  public info(message: string, params?: LogParams): void {
    this.log('info', message, params)
  }

  public warn(message: string, params?: LogParams | Error): void {
    this.log('warn', message, params)
  }

  public error(message: string, params?: LogParams | Error): void {
    this.log('error', message, params)
  }

  private log(level: LogLevel, message: string, params?: LogParams | Error): void {
    if (this.isTest && !this.shouldLogInTest) {
      return
    }

    const source = this.getSource(params)
    const metadata = this.buildMetadata(params, source)

    if (this.isProduction) {
      this.backend[level](message, metadata)
    } else {
      const timestamp = new Date().toISOString()
      const levelStr = level.toUpperCase().padEnd(5)
      const sourceStr = source ? `[${source}] ` : ''
      const structuredData = this.formatStructuredData(params)
      const logLine = `${timestamp} ${levelStr} ${sourceStr}${message}${structuredData}`

      const consoleMethod = level === 'info' ? 'log' : level
      console[consoleMethod](logLine)
    }
  }

  private buildMetadata(params?: LogParams | Error, source?: string): object {
    const meta: Record<string, unknown> = {
      serviceId: this.serviceId
    }

    if (source) {
      meta.ctx = source
    }

    if (params instanceof Error) {
      meta.error = params.message
      meta.stack = params.stack
    } else if (params) {
      const { source: _, ...rest } = params
      Object.assign(meta, rest)
    }

    return meta
  }

  private createBackend(): LogBackend {
    if (this.isProduction) {
      const hasLogtailToken = Boolean(process.env.LOGTAIL_SOURCE_TOKEN)
      if (hasLogtailToken) {
        return this.createBetterStackBackend()
      }
      return this.createConsoleBackend()
    }

    if (this.isTest && !this.shouldLogInTest) {
      return this.createSilentBackend()
    }

    return this.createConsoleBackend()
  }

  private createBetterStackBackend(): LogBackend {
    const token = process.env.LOGTAIL_SOURCE_TOKEN || ''
    const rawEndpoint = process.env.LOGTAIL_URL || 'https://in.logs.betterstack.com'
    const endpoint = rawEndpoint.startsWith('http') ? rawEndpoint : `https://${rawEndpoint}`

    const logger = new BetterStackNodeLogger(token, { endpoint })
    logger.use(
      async (log) =>
        ({
          ...log,
          serviceId: this.serviceId
        }) as typeof log
    )

    return logger
  }

  private createConsoleBackend(): LogBackend {
    return console
  }

  private createSilentBackend(): LogBackend {
    return {
      debug: () => {},
      info: () => {},
      warn: () => {},
      error: () => {}
    }
  }

  private getSource(params?: LogParams | Error): string | undefined {
    if (this.source) return this.source
    if (params && !(params instanceof Error) && params.source) {
      return params.source
    }
    return undefined
  }

  private formatStructuredData(params?: LogParams | Error): string {
    if (!params) return ''

    if (params instanceof Error) {
      return ` error="${params.message}"`
    }

    const entries = Object.entries(params)
      .filter(([key]) => key !== 'source')
      .map(([key, value]) => `${key}=${this.formatValue(value)}`)

    return entries.length > 0 ? ` ${entries.join(' ')}` : ''
  }

  private formatValue(value: unknown): string {
    if (value === null || value === undefined) return 'null'
    if (typeof value === 'string') {
      return value.includes(' ') ? `"${value}"` : value
    }
    if (typeof value === 'object') {
      return JSON.stringify(value)
    }
    return String(value)
  }
}

export const logger = AppLogger.getInstance()
