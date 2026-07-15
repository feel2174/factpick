import 'server-only';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';

const url = process.env.SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_KEY;

export const isSupabaseConfigured = Boolean(url && serviceKey);

const client = isSupabaseConfigured
  ? createClient(url!, serviceKey!, {
      auth: { persistSession: false, autoRefreshToken: false },
    })
  : null;

// UI와 정적 콘텐츠는 DB 환경변수 없이도 빌드할 수 있게 하고,
// 실제 DB 접근을 시도할 때만 명확한 오류를 발생시킨다.
export const supabase: SupabaseClient =
  client ??
  new Proxy({} as SupabaseClient, {
    get() {
      throw new Error(
        'Missing SUPABASE_URL or SUPABASE_SERVICE_KEY in nextjs/.env.local (server-only)',
      );
    },
  });
