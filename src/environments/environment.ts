declare const process:
  | {
      env?: Record<string, string | undefined>;
    }
  | undefined;

const runtimeEnv = typeof process !== 'undefined' ? process.env : undefined;

export const environment = {
  production: true,
  supabaseUrl: runtimeEnv?.['SUPABASE_URL'] ?? '',
  supabaseKey: runtimeEnv?.['SUPABASE_ANON_KEY'] ?? '',
};
