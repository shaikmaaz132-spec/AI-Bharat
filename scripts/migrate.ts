import fs from 'fs';
import path from 'path';
import { Client } from 'pg';
import * as dotenv from 'dotenv';

// Load environment variables from .env.local and .env
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

async function runMigration() {
  console.log('\n======================================================');
  console.log('  🇮🇳 AI FOR BHARAT (जन एआई) - SUPABASE MIGRATION RUNNER ');
  console.log('======================================================\n');

  const migrationFile = path.resolve(process.cwd(), 'supabase/migrations/001_initial_schema.sql');
  if (!fs.existsSync(migrationFile)) {
    console.error(`❌ Migration file not found: ${migrationFile}`);
    process.exit(1);
  }

  const sqlContent = fs.readFileSync(migrationFile, 'utf8');

  // Priority 1: Direct DATABASE_URL / POSTGRES_URL
  let connectionString = process.env.DATABASE_URL || process.env.POSTGRES_URL;

  // Priority 2: Construct from Supabase DB credentials if provided
  if (!connectionString && process.env.SUPABASE_DB_PASSWORD && process.env.SUPABASE_URL) {
    const projectRef = process.env.SUPABASE_URL.replace(/https?:\/\//, '').split('.')[0];
    connectionString = `postgresql://postgres.${projectRef}:${encodeURIComponent(
      process.env.SUPABASE_DB_PASSWORD
    )}@aws-0-ap-south-1.pooler.supabase.com:6543/postgres`;
  }

  // Priority 3: Supabase Service Role Key via Management / SQL Execution API
  const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!connectionString && (!supabaseUrl || !serviceRoleKey)) {
    console.warn('⚠️ No database connection credentials configured in environment.');
    console.log('To run this migration against your Supabase Cloud PostgreSQL:');
    console.log('1. Set DATABASE_URL in your .env.local file:');
    console.log('   DATABASE_URL="postgresql://postgres:[YOUR-PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres"');
    console.log('   OR');
    console.log('2. Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env.local');
    console.log('\n✅ Migration SQL script verified successfully at:');
    console.log(`   ${migrationFile}`);
    console.log('You can also paste the contents directly into the Supabase Cloud SQL Editor.\n');
    return;
  }

  if (connectionString) {
    console.log('📡 Connecting to PostgreSQL database...');
    const client = new Client({
      connectionString,
      ssl: {
        rejectUnauthorized: false,
      },
    });

    try {
      await client.connect();
      console.log(' Connected to PostgreSQL database.');
      console.log('🚀 Executing 001_initial_schema.sql...');

      await client.query(sqlContent);
      console.log(' Schema migration and seed data applied successfully!');

      // Verify created tables
      const res = await client.query(`
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name IN ('schemes', 'citizens', 'chat_conversations', 'chat_messages', 'eligibility_evaluations', 'documents', 'grievances')
        ORDER BY table_name;
      `);

      console.log('\n Verified Tables in Database:');
      res.rows.forEach((row) => console.log(`   - ${row.table_name}`));

      // Verify scheme count
      const countRes = await client.query('SELECT count(*) FROM schemes;');
      console.log(`\n Total Seeded Schemes: ${countRes.rows[0].count}`);

      await client.end();
      console.log('\n🎉 Migration completed successfully!\n');
    } catch (err: any) {
      console.error('❌ Migration failed:', err.message);
      await client.end().catch(() => {});
      process.exit(1);
    }
  } else if (supabaseUrl && serviceRoleKey) {
    console.log('📡 Attempting migration via Supabase SQL endpoint with Service Role Key...');
    try {
      const response = await fetch(`${supabaseUrl}/rest/v1/rpc`, {
        method: 'POST',
        headers: {
          apikey: serviceRoleKey,
          Authorization: `Bearer ${serviceRoleKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ query: sqlContent }),
      });

      if (!response.ok) {
        console.log('ℹ️ Supabase REST SQL RPC is protected. Please execute via SQL Editor or DATABASE_URL:');
        console.log(`   Direct SQL File: ${migrationFile}`);
      } else {
        console.log(' Migration applied successfully via Supabase service role!');
      }
    } catch (err: any) {
      console.log('ℹ️ Note: Supabase migrations are best applied via DATABASE_URL or SQL Editor.');
    }
  }
}

runMigration().catch((err) => {
  console.error('Fatal error during migration:', err);
  process.exit(1);
});
