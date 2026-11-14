import * as dotenv from 'dotenv';
import path from 'path';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { createClient } from '@supabase/supabase-js';
import { Client } from 'pg';

// Prioritize .env.local, then .env
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

async function verifyAllConnections() {
  console.log('\n======================================================');
  console.log('  🔍 CREDENTIALS & CONNECTION VERIFICATION REPORT      ');
  console.log('======================================================\n');

  const geminiKey = process.env.GEMINI_API_KEY;
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const dbUrl = process.env.DATABASE_URL;

  console.log('Current Loaded Values from .env.local / environment:');
  console.log(`- GEMINI_API_KEY:              ${geminiKey ? `${geminiKey.slice(0, 10)}...` : '❌ Missing'}`);
  console.log(`- NEXT_PUBLIC_SUPABASE_URL:    ${supabaseUrl || '❌ Missing'}`);
  console.log(`- NEXT_PUBLIC_SUPABASE_ANON_KEY: ${anonKey ? `${anonKey.slice(0, 15)}...` : '❌ Missing'}`);
  console.log(`- SUPABASE_SERVICE_ROLE_KEY:   ${serviceRoleKey ? `${serviceRoleKey.slice(0, 15)}...` : '❌ Missing'}`);
  console.log(`- DATABASE_URL:                ${dbUrl ? `${dbUrl.replace(/:[^:]*@/, ':****@')}` : '⚠️ Not set (optional)'}`);
  console.log('');

  // 1. Check if placeholders are still present
  const isDemoGemini = !geminiKey || geminiKey.includes('demo') || geminiKey.includes('YourGemini');
  const isDemoSupabase = !supabaseUrl || supabaseUrl.includes('placeholder') || supabaseUrl.includes('demo') || supabaseUrl.includes('your-project');
  const isDemoAnon = !anonKey || anonKey.includes('demo') || anonKey.includes('...');
  const isDemoService = !serviceRoleKey || serviceRoleKey.includes('demo') || serviceRoleKey.includes('...');

  if (isDemoGemini || isDemoSupabase || isDemoAnon || isDemoService) {
    console.log('⚠️ STATUS: PLACEHOLDER CREDENTIALS DETECTED');
    console.log('The files currently contain template / demo placeholder values:');
    if (isDemoGemini) console.log('  - GEMINI_API_KEY is currently a placeholder.');
    if (isDemoSupabase) console.log('  - NEXT_PUBLIC_SUPABASE_URL is currently a placeholder.');
    if (isDemoAnon) console.log('  - NEXT_PUBLIC_SUPABASE_ANON_KEY is currently a placeholder.');
    if (isDemoService) console.log('  - SUPABASE_SERVICE_ROLE_KEY is currently a placeholder.');
    console.log('\nTo connect to your live accounts:');
    console.log('Replace the placeholder values in .env.local with your real keys.\n');
    return;
  }

  // 2. Test Live Gemini Connection
  console.log('Testing Google Gemini API Key...');
  try {
    const genAI = new GoogleGenerativeAI(geminiKey);
    const candidateModels = ['gemini-3.8-flash', 'gemini-2.5-flash', 'gemini-1.5-flash'];
    let connected = false;
    for (const m of candidateModels) {
      try {
        const model = genAI.getGenerativeModel({ model: m });
        const res = await model.generateContent('Say "OK"');
        console.log(`  ✅ Gemini API Key is ACTIVE and valid with model "${m}"! Response:`, res.response.text().trim());
        connected = true;
        break;
      } catch (innerErr: any) {
        if (!innerErr.message.includes('404')) {
          throw innerErr;
        }
      }
    }
    if (!connected) {
      console.log('  ⚠️ Gemini API Key responded, but models need updating.');
    }
  } catch (err: any) {
    console.log('  ❌ Gemini API Key failed:', err.message);
  }

  // 3. Test Live Supabase Client Connection
  console.log('\nTesting Supabase REST endpoint...');
  try {
    const supabase = createClient(supabaseUrl, serviceRoleKey || anonKey!);
    const { data, error } = await supabase.from('schemes').select('count', { count: 'exact', head: true });
    if (error) {
      console.log('  ⚠️ Supabase connection reached, but returned:', error.message);
    } else {
      console.log('  ✅ Supabase connection successful! Schemes table accessible.');
    }
  } catch (err: any) {
    console.log('  ❌ Supabase connection failed:', err.message);
  }

  // 4. Test Live Database URL (PostgreSQL)
  if (dbUrl) {
    console.log('\nTesting PostgreSQL Database Connection (DATABASE_URL)...');
    const client = new Client({ connectionString: dbUrl, ssl: { rejectUnauthorized: false } });
    try {
      await client.connect();
      const res = await client.query('SELECT current_database(), version();');
      console.log(`  ✅ Connected to PostgreSQL DB: ${res.rows[0].current_database}`);
      await client.end();
    } catch (err: any) {
      console.log('  ❌ PostgreSQL connection failed:', err.message);
      await client.end().catch(() => {});
    }
  }

  console.log('\n======================================================\n');
}

verifyAllConnections().catch(console.error);
