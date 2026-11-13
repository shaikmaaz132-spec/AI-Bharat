import { z } from 'zod';

const envSchema = z.object({
  GEMINI_API_KEY: z.string().min(1, 'GEMINI_API_KEY is required').default('dummy-gemini-key-for-build'),
  NEXT_PUBLIC_SUPABASE_URL: z.string().url('NEXT_PUBLIC_SUPABASE_URL must be a valid URL').default('https://placeholder.supabase.co'),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1, 'NEXT_PUBLIC_SUPABASE_ANON_KEY is required').default('dummy-anon-key'),
  SUPABASE_SERVICE_ROLE_KEY: z.string().optional(),
  DATABASE_URL: z.string().optional(),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  NEXT_PUBLIC_APP_URL: z.string().optional().default('http://localhost:3000'),
});

export type Env = z.infer<typeof envSchema>;

let validatedEnv: Env;

export function validateEnv(): Env {
  if (validatedEnv) {
    return validatedEnv;
  }

  // Allow build step in CI/offline without crashing if keys are dummy
  const isBuildPhase = process.env.NEXT_PHASE === 'phase-production-build';

  const parseResult = envSchema.safeParse(process.env);

  if (!parseResult.success) {
    if (isBuildPhase) {
      console.warn('⚠️ Building with fallback environment variables.');
      return envSchema.parse({});
    }
    const errors = parseResult.error.format();
    console.error('❌ Environment validation error:', JSON.stringify(errors, null, 2));
    throw new Error('Invalid environment variables. Check .env.local');
  }

  validatedEnv = parseResult.data;
  return validatedEnv;
}

export const env = validateEnv();
