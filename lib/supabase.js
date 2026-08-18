import { createClient } from '@supabase/supabase-js';

let _supabase = null;

function getClient() {
  if (_supabase) return _supabase;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !key) {
    // During build / SSR without env vars, return a stub that won't crash
    // Real calls will only happen in the browser where env vars are injected
    return null;
  }

  _supabase = createClient(url, key);
  return _supabase;
}

// Proxy object: forwards property access to the real client (lazily created)
export const supabase = new Proxy(
  {},
  {
    get(_, prop) {
      const client = getClient();
      if (!client) {
        // Return a no-op function during SSG/build so nothing crashes
        return () => ({ data: null, error: new Error('Supabase not configured') });
      }
      const value = client[prop];
      return typeof value === 'function' ? value.bind(client) : value;
    },
  }
);
