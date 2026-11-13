import { createClient } from '@supabase/supabase-js';
import { env } from './env';

// Public client for browser / client components
export const supabase = createClient(
  env.NEXT_PUBLIC_SUPABASE_URL || 'https://demo.supabase.co',
  env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'demo-key'
);

// Admin client with service role for secure backend operations
export function getAdminClient() {
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  return createClient(env.NEXT_PUBLIC_SUPABASE_URL, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

export interface SchemeRecord {
  id: string;
  slug: string;
  title: string;
  title_translations: Record<string, string>;
  description: string;
  description_translations: Record<string, string>;
  category: string;
  ministry: string;
  level: string;
  state: string | null;
  financial_benefit: string;
  financial_benefit_amount: number;
  eligibility_criteria: Record<string, any>;
  required_documents: string[];
  application_process: string;
  official_url: string;
  similarity?: number;
}

/**
 * Executes vector similarity retrieval using Supabase RPC function `match_schemes`
 */
export async function matchSchemesVector(
  queryEmbedding: number[],
  matchThreshold: number = 0.2,
  matchCount: number = 5,
  filterCategory?: string,
  filterState?: string
): Promise<SchemeRecord[]> {
  try {
    const admin = getAdminClient();
    const { data, error } = await admin.rpc('match_schemes', {
      query_embedding: queryEmbedding,
      match_threshold: matchThreshold,
      match_count: matchCount,
      filter_category: filterCategory || null,
      filter_state: filterState || null,
    });

    if (error) {
      console.warn('Supabase match_schemes RPC call returned error:', error.message);
      // Fallback: Query schemes directly via SQL table filter
      const query = admin.from('schemes').select('*').eq('is_active', true);
      if (filterCategory) query.eq('category', filterCategory);
      if (filterState) query.or(`state.is.null,state.eq.${filterState}`);
      const fallbackResult = await query.limit(matchCount);

      if (fallbackResult.data && fallbackResult.data.length > 0) {
        return fallbackResult.data as SchemeRecord[];
      }
      return [];
    }

    return (data || []) as SchemeRecord[];
  } catch (err: any) {
    console.error('Vector search exception:', err.message);
    return [];
  }
}

/**
 * Retrieves all active schemes with optional category filtering
 */
export async function getAllSchemes(category?: string): Promise<SchemeRecord[]> {
  const admin = getAdminClient();
  let query = admin.from('schemes').select('*').eq('is_active', true).order('financial_benefit_amount', { ascending: false });

  if (category && category !== 'all') {
    query = query.eq('category', category);
  }

  const { data, error } = await query;
  if (error) {
    console.error('Error fetching schemes from Supabase:', error.message);
    return [];
  }
  return (data || []) as SchemeRecord[];
}

/**
 * Retrieves a single scheme by slug
 */
export async function getSchemeBySlug(slug: string): Promise<SchemeRecord | null> {
  const admin = getAdminClient();
  const { data, error } = await admin.from('schemes').select('*').eq('slug', slug).single();

  if (error || !data) {
    return null;
  }
  return data as SchemeRecord;
}
