const DEFAULT_URL = 'https://YOUR_PROJECT_REF.supabase.co';
const DEFAULT_ANON_KEY = 'YOUR_SUPABASE_ANON_KEY';

const appConfig = window.CAMPUS_CONNECT_CONFIG || {};

export const SUPABASE_URL = appConfig.supabaseUrl || DEFAULT_URL;
export const SUPABASE_ANON_KEY = appConfig.supabaseAnonKey || DEFAULT_ANON_KEY;

function looksLikePlaceholder(value) {
  const text = String(value || '').toUpperCase();
  return text.includes('YOUR_PROJECT_REF') || text.includes('YOUR_SUPABASE_ANON_KEY') || text.includes('YOUR_');
}

if (!window.supabase || typeof window.supabase.createClient !== 'function') {
  throw new Error('Supabase CDN script is missing.');
}

export const hasSupabaseConfig =
  SUPABASE_URL !== DEFAULT_URL &&
  SUPABASE_ANON_KEY !== DEFAULT_ANON_KEY &&
  !looksLikePlaceholder(SUPABASE_URL) &&
  !looksLikePlaceholder(SUPABASE_ANON_KEY);

export const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true
  }
});
