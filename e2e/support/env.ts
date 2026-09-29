import { loadEnv } from 'vite';

/**
 * Reads the same `.env` the Vite build uses. Runs in the Playwright worker
 * (Node), never in the browser, and the raw values are never logged — only the
 * derived Supabase storage key is needed, so the app's `getSession()` call
 * resolves from a seeded localStorage entry instead of hitting the network.
 */
const env = loadEnv('development', process.cwd(), 'VITE_');

const supabaseUrl = env.VITE_SUPABASE_URL || 'https://localhost.supabase.co';

/** supabase-js derives its localStorage key as `sb-<first hostname label>-auth-token`. */
const projectRef = new URL(supabaseUrl).hostname.split('.')[0];

export const SUPABASE_AUTH_STORAGE_KEY = `sb-${projectRef}-auth-token`;
