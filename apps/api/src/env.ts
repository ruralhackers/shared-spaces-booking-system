import { createEnv } from '@t3-oss/env-core'
import { z } from 'zod'

export const env = createEnv({
  server: {
    PORT: z.coerce.number().default(4001),
    NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
    CORS_ORIGINS: z
      .string()
      .default('http://localhost:3001,http://localhost:3000,http://localhost:8081'),
    BETTER_AUTH_SECRET: process.env.NODE_ENV === 'production' ? z.string() : z.string().optional(),
    BETTER_AUTH_URL: z.url().optional(),
    // SQLite database file path (e.g., file:./data/app.db)
    DATABASE_URL: z.url(),
    EMAIL_SERVER: z.string().optional(),
    EMAIL_FROM: z.string().optional(),
    GOOGLE_CLIENT_ID: z.string().optional(),
    GOOGLE_CLIENT_SECRET: z.string().optional(),
    ADMIN_KEY: z.string().min(1),
    SLACK_WEBHOOK_URL: z.url().optional(),
    TZ: z.string().default('Europe/Madrid'),
    SITE_NAME: z.string().default('Shared Spaces'),
    SITE_SHORT_NAME: z.string().max(12).optional(),
    SITE_WEBAPP_URL: z.url(),
    SITE_LOGO_URL: z.url().optional()
  },
  runtimeEnv: process.env,
  skipValidation: !!process.env.SKIP_ENV_VALIDATION,
  emptyStringAsUndefined: true
})
